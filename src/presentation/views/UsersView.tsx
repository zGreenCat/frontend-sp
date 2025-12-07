"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Search, Pencil, Trash2, AlertTriangle, UserX, UserCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import { ListUsers } from "@/application/usecases/user/ListUsers";
import { CreateUser } from "@/application/usecases/user/CreateUser";
import { UpdateUser } from "@/application/usecases/user/UpdateUser";
import { DisableUser } from "@/application/usecases/user/DisableUser";
import { LogAssignmentChange } from "@/application/usecases/user/LogAssignmentChange";
import { TENANT_ID } from "@/shared/constants";
import { User } from "@/domain/entities/User";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { EmptyState } from "@/presentation/components/EmptyState";
import { formatRUT } from "@/shared/utils/formatters";
import { UserDialog } from "@/presentation/components/UserDialog";
import { AssignmentsDialog } from "@/presentation/components/AssignmentsDialog";
import { ConfirmDialog } from "@/presentation/components/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/hooks/use-auth";
import { CreateUserInput } from "@/shared/schemas";
import { PERMISSIONS } from "@/shared/permissions";
import { USER_ROLES } from "@/shared/constants";

export function UsersView() {
  const { userRepo, assignmentHistoryRepo, areaRepo, warehouseRepo } = useRepositories();
  const { toast } = useToast();
  const { can } = usePermissions();
  const { user: currentUser } = useAuth();
  
  // Extraer valores primitivos para evitar loops en useEffect
  const currentUserId = currentUser?.id;
  const currentUserRole = useMemo(() => {
    if (!currentUser) return '';
    if (typeof currentUser.role === 'string') return currentUser.role;
    if (currentUser.role && typeof currentUser.role === 'object' && 'name' in currentUser.role) {
      return (currentUser.role as any).name;
    }
    return currentUser.roleId || '';
  }, [currentUser]);
  const currentUserAreas = useMemo(() => {
    const areas = currentUser?.areas || [];
    // Extraer solo los IDs para usar en comparaciones
    return areas.map(a => typeof a === 'string' ? a : a.id);
  }, [currentUser?.areas]);
  
  const [users, setUsers] = useState<User[]>([]);
  const [areas, setAreas] = useState<Array<{ id: string; name: string }>>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignmentsDialogOpen, setAssignmentsDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Filtros avanzados
  const [filterRole, setFilterRole] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterArea, setFilterArea] = useState<string>("");
  const [filterWarehouse, setFilterWarehouse] = useState<string>("");

  const loadUsers = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading users - Page:', currentPage, 'PageSize:', pageSize);
      console.log('👤 Current user role:', currentUserRole, 'Areas:', currentUserAreas);
      
      // Mapear rol del backend al frontend si es necesario
      const ROLE_MAP: Record<string, string> = {
        'JEFE_AREA': 'JEFE',
        'BODEGUERO': 'SUPERVISOR',
      };
      const mappedRole = ROLE_MAP[currentUserRole] || currentUserRole;
      console.log('🔄 Mapped role:', currentUserRole, '->', mappedRole);
      
      // Si es JEFE_AREA, cargar usuarios específicos de sus áreas
      const isJefeArea = mappedRole === USER_ROLES.JEFE || mappedRole === 'JEFE';
      
      if (isJefeArea && currentUserAreas.length > 0) {
        console.log('👤 JEFE_AREA detected, loading users from assigned areas:', currentUserAreas);
        
        // Cargar usuarios de cada área asignada al JEFE
        const usersByAreaPromises = currentUserAreas.map(areaId => 
          (userRepo as any).findByArea(areaId)
        );
        
        const [usersByArea, areasData, warehousesData] = await Promise.all([
          Promise.all(usersByAreaPromises),
          areaRepo.findAll(TENANT_ID),
          warehouseRepo.findAll(TENANT_ID),
        ]);
        
        // Combinar usuarios de todas las áreas y eliminar duplicados
        const allUsers = usersByArea.flat();
        const uniqueUsers = Array.from(
          new Map(allUsers.map(u => [u.id, u])).values()
        );
        
        // Filtrar solo SUPERVISORES (el JEFE solo debe ver supervisores de sus áreas)
        const supervisors = uniqueUsers.filter(u => {
          const uRole = typeof u.role === 'string' ? u.role : (u.role as any)?.name || '';
          return uRole === 'SUPERVISOR' || uRole === USER_ROLES.SUPERVISOR;
        });
        
        console.log('✅ Loaded supervisors from JEFE areas:', supervisors.length);
        
        setUsers(supervisors);
        setTotalPages(1); // Sin paginación para esta vista
        setTotalUsers(supervisors.length);
        setAreas(areasData.map(a => ({ id: a.id, name: a.name })));
        setWarehouses(warehousesData.map(w => ({ id: w.id, name: w.name })));
      } else {
        // Para ADMIN o cualquier otro rol, cargar normalmente
        const [usersResult, areasData, warehousesData] = await Promise.all([
          new ListUsers(userRepo).execute(TENANT_ID, currentPage, pageSize),
          areaRepo.findAll(TENANT_ID),
          warehouseRepo.findAll(TENANT_ID),
        ]);
        
        if (usersResult.ok) {
          console.log('✅ Users loaded:', usersResult.value);
          setUsers(usersResult.value.data);
          setTotalPages(usersResult.value.totalPages);
          setTotalUsers(usersResult.value.total);
          setAreas(areasData.map(a => ({ id: a.id, name: a.name })));
          setWarehouses(warehousesData.map(w => ({ id: w.id, name: w.name })));
        } else {
          toast({
            title: "Error al cargar usuarios",
            description: usersResult.error || "No se pudieron obtener los usuarios del sistema",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Error de conexión con el servidor";
      toast({
        title: "Error de carga",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('LoadUsers error:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentUserId) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, currentUserId, currentUserRole, currentUserAreas]);

  // Helper para obtener nombre de área por ID desde los detalles del usuario o lista global
  const getAreaName = (areaId: string, userAreaDetails?: Array<{ id: string; name: string }>): string => {
    // Primero buscar en los detalles del usuario
    if (userAreaDetails) {
      const area = userAreaDetails.find(a => a.id === areaId);
      if (area) return area.name;
    }
    // Si no está, buscar en la lista global
    const area = areas.find(a => a.id === areaId);
    return area?.name || areaId;
  };

  // Helper para obtener nombre de bodega por ID desde los detalles del usuario o lista global
  const getWarehouseName = (warehouseId: string, userWarehouseDetails?: Array<{ id: string; name: string }>): string => {
    // Primero buscar en los detalles del usuario
    if (userWarehouseDetails) {
      const warehouse = userWarehouseDetails.find(w => w.id === warehouseId);
      if (warehouse) return warehouse.name;
    }
    // Si no está, buscar en la lista global
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse?.name || warehouseId;
  };

  const handleCreate = async (data: CreateUserInput) => {
    setActionLoading(true);
    try {
      const useCase = new CreateUser(userRepo);
      const result = await useCase.execute(data);
      
      if (result.ok) {
        // TODO: Registrar asignaciones iniciales en el historial (backend no implementado aún)
        // if (currentUser && (data.areas.length > 0 || data.warehouses.length > 0)) {
        //   const logUseCase = new LogAssignmentChange(
        //     assignmentHistoryRepo,
        //     areaRepo,
        //     warehouseRepo
        //   );
        //   await logUseCase.execute({
        //     userId: result.value.id,
        //     previousAreas: [],
        //     newAreas: data.areas,
        //     previousWarehouses: [],
        //     newWarehouses: data.warehouses,
        //     performedBy: currentUser.id,
        //     performedByName: `${currentUser.name} ${currentUser.lastName || ''}`.trim(),
        //     tenantId: TENANT_ID,
        //   });
        // }

        // Toast con detalles de asignaciones
        const assignmentDetails = [];
        if (data.areas.length > 0) {
          const areaNames = data.areas.map(id => getAreaName(id)).join(", ");
          assignmentDetails.push(`Áreas: ${areaNames}`);
        }
        if (data.warehouses.length > 0) {
          const warehouseNames = data.warehouses.map(id => getWarehouseName(id)).join(", ");
          assignmentDetails.push(`Bodegas: ${warehouseNames}`);
        }

        toast({
          title: "Éxito",
          description: (
            <div className="space-y-1">
              <p>Usuario creado correctamente</p>
              {assignmentDetails.length > 0 && (
                <div className="text-xs opacity-80 mt-1">
                  <p className="font-semibold">Asignaciones:</p>
                  {assignmentDetails.map((detail, i) => (
                    <p key={i}>• {detail}</p>
                  ))}
                </div>
              )}
            </div>
          ),
          variant: "success",
        });
        await loadUsers();
      } else {
        const errorMsg = result.error || "Error al crear usuario";
        const isEmailDuplicate = errorMsg.toLowerCase().includes('email') || errorMsg.toLowerCase().includes('duplicado');
        toast({
          title: isEmailDuplicate ? "Email duplicado" : "Error al crear usuario",
          description: isEmailDuplicate 
            ? "El email ingresado ya está registrado en el sistema"
            : errorMsg,
          variant: "destructive",
        });
        throw new Error(errorMsg); // Lanzar error para que el dialog no se cierre
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAssignments = async (data: { areas: string[]; warehouses: string[] }) => {
    if (!selectedUser) return;
    
    setActionLoading(true);

    // Detectar cambios en asignaciones
    const previousAreas = selectedUser.areas || [];
    const previousWarehouses = selectedUser.warehouses || [];
    const hasAssignmentChanges = 
      JSON.stringify(previousAreas.sort()) !== JSON.stringify(data.areas.sort()) ||
      JSON.stringify(previousWarehouses.sort()) !== JSON.stringify(data.warehouses.sort());

    const useCase = new UpdateUser(userRepo);
    const result = await useCase.execute(selectedUser.id, data, TENANT_ID);
    
    if (result.ok) {
      // TODO: Registrar cambios en asignaciones (backend no implementado aún)
      // if (currentUser && hasAssignmentChanges) {
      //   const logUseCase = new LogAssignmentChange(
      //     assignmentHistoryRepo,
      //     areaRepo,
      //     warehouseRepo
      //   );
      //   await logUseCase.execute({
      //     userId: selectedUser.id,
      //     previousAreas,
      //     newAreas: data.areas,
      //     previousWarehouses,
      //     newWarehouses: data.warehouses,
      //     performedBy: currentUser.id,
      //     performedByName: `${currentUser.name} ${currentUser.lastName || ''}`.trim(),
      //     tenantId: TENANT_ID,
      //   });
      // }

      // Toast con detalles de cambios en asignaciones
      const changes = [];
      if (hasAssignmentChanges) {
        const addedAreas = data.areas.filter(id => !previousAreas.includes(id));
        const removedAreas = previousAreas.filter(id => !data.areas.includes(id));
        const addedWarehouses = data.warehouses.filter(id => !previousWarehouses.includes(id));
        const removedWarehouses = previousWarehouses.filter(id => !data.warehouses.includes(id));

        if (addedAreas.length > 0) {
          const names = addedAreas.map(id => getAreaName(id)).join(", ");
          changes.push(`Áreas agregadas: ${names}`);
        }
        if (removedAreas.length > 0) {
          const names = removedAreas.map(id => getAreaName(id)).join(", ");
          changes.push(`Áreas removidas: ${names}`);
        }
        if (addedWarehouses.length > 0) {
          const names = addedWarehouses.map(id => getWarehouseName(id)).join(", ");
          changes.push(`Bodegas agregadas: ${names}`);
        }
        if (removedWarehouses.length > 0) {
          const names = removedWarehouses.map(id => getWarehouseName(id)).join(", ");
          changes.push(`Bodegas removidas: ${names}`);
        }
      }

      toast({
        title: "Éxito",
        description: (
          <div className="space-y-1">
            <p>Usuario actualizado correctamente</p>
            {changes.length > 0 && (
              <div className="text-xs opacity-80 mt-1">
                <p className="font-semibold">Cambios en asignaciones:</p>
                {changes.map((change, i) => (
                  <p key={i}>• {change}</p>
                ))}
              </div>
            )}
          </div>
        ),
        variant: "success",
      });
      await loadUsers();
      setSelectedUser(null);
      setAssignmentsDialogOpen(false);
    } else {
      const errorMsg = result.error || "Error al actualizar asignaciones";
      toast({
        title: "Error en actualización",
        description: errorMsg.includes('conexión') || errorMsg.includes('network')
          ? "Error de conexión. Verifica tu conexión a internet e intenta nuevamente"
          : errorMsg,
        variant: "destructive",
      });
    }
    setActionLoading(false);
  };

  const handleDisable = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    
    try {
      // Cambiar estado: si está habilitado, deshabilitar; si está deshabilitado, habilitar
      const newStatus = selectedUser.status === 'HABILITADO' ? 'DESHABILITADO' as const : 'HABILITADO' as const;
      
      // Llamar directamente al repositorio para actualizar solo el estado
      await userRepo.update(selectedUser.id, { status: newStatus }, TENANT_ID);
      
      toast({
        title: "Éxito",
        description: `Usuario ${newStatus === 'HABILITADO' ? 'habilitado' : 'deshabilitado'} correctamente`,
        variant: "success",
      });
      await loadUsers();
      setSelectedUser(null);
      setConfirmOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cambiar estado del usuario",
        variant: "destructive",
      });
    }
    
    setActionLoading(false);
  };

  const openCreateDialog = () => {
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const openAssignmentsDialog = (user: User) => {
    setSelectedUser(user);
    setAssignmentsDialogOpen(true);
  };

  const openDeleteConfirm = (user: User) => {
    setSelectedUser(user);
    setConfirmOpen(true);
  };

  // Filtrar usuarios según jerarquía del usuario autenticado
  const filterUsersByHierarchy = (allUsers: User[]): User[] => {
    if (!currentUser) return allUsers;

    // Extraer rol correctamente - puede venir como string o como objeto
    let userRole: string;
    if (typeof currentUser.role === 'string') {
      userRole = currentUser.role;
    } else if (currentUser.role && typeof currentUser.role === 'object' && 'name' in currentUser.role) {
      userRole = (currentUser.role as any).name;
    } else {
      userRole = currentUser.roleId || '';
    }
    
    const userAreas = currentUser.areas || [];

    switch (userRole) {
      case USER_ROLES.ADMIN:
      case 'ADMIN':
        // Admin ve todos los usuarios
        return allUsers;
      
      case USER_ROLES.JEFE:
      case 'JEFE':
      case 'JEFE_AREA':
        // Jefe de Área - el filtrado ya se hizo en loadUsers
        // Solo necesitamos retornar los usuarios cargados (ya filtrados por área)
        return allUsers;
      
      case USER_ROLES.SUPERVISOR:
      case 'SUPERVISOR':
        // Supervisor no ve listado administrativo de usuarios
        return [];
      
      default:
        return allUsers;
    }
  };

  const usersByHierarchy = filterUsersByHierarchy(users);

  // Los filtros locales están deshabilitados mientras se usa paginación del servidor
  // TODO: Enviar filtros al backend como query params para filtrado en servidor
  // Excluir al usuario autenticado de la lista
  const filteredUsers = usersByHierarchy.filter(u => u.id !== currentUserId);
  
  // VERSIÓN ANTERIOR CON FILTROS LOCALES (causa problemas con paginación del servidor):
  // const filteredUsers = usersByHierarchy.filter(u => {
  //   const matchesSearch = search === "" || 
  //     u.name.toLowerCase().includes(search.toLowerCase()) ||
  //     u.lastName.toLowerCase().includes(search.toLowerCase()) ||
  //     u.email.toLowerCase().includes(search.toLowerCase());
  //   const matchesRole = filterRole === "" || u.role === filterRole;
  //   const matchesStatus = filterStatus === "" || u.status === filterStatus;
  //   const matchesArea = filterArea === "" || (u.areas && u.areas.includes(filterArea));
  //   const matchesWarehouse = filterWarehouse === "" || (u.warehouses && u.warehouses.includes(filterWarehouse));
  //   return matchesSearch && matchesRole && matchesStatus && matchesArea && matchesWarehouse;
  // });

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Usuarios</h1>
            <p className="text-muted-foreground">
              Gestión de usuarios del sistema
              {(() => {
                const role = currentUser?.role;
                const roleStr = typeof role === 'string' ? role : role?.name || currentUser?.roleId;
                return (roleStr === USER_ROLES.JEFE || roleStr === 'JEFE_AREA') && (
                  <span className="block text-xs mt-1 text-primary">
                    📋 Mostrando solo supervisores de las bodegas en tus áreas asignadas
                  </span>
                );
              })()}
            </p>
          </div>
          {can(PERMISSIONS.USERS_CREATE) && (
            <Button 
              className="bg-primary text-primary-foreground h-10 gap-2"
              onClick={openCreateDialog}
            >
              <Plus className="h-4 w-4" />
              Nuevo Usuario
            </Button>
          )}
        </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 bg-secondary/30"
              />
            </div>
            
            {/* Filtros avanzados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Select value={filterRole || "all"} onValueChange={(value) => { setFilterRole(value === "all" ? "" : value); setCurrentPage(1); }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Filtrar por rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="JEFE">Jefe de Área</SelectItem>
                  <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus || "all"} onValueChange={(value) => { setFilterStatus(value === "all" ? "" : value); setCurrentPage(1); }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="HABILITADO">Habilitado</SelectItem>
                  <SelectItem value="DESHABILITADO">Deshabilitado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterArea || "all"} onValueChange={(value) => { setFilterArea(value === "all" ? "" : value); setCurrentPage(1); }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Filtrar por área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las áreas</SelectItem>
                  {areas.map(area => (
                    <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterWarehouse || "all"} onValueChange={(value) => { setFilterWarehouse(value === "all" ? "" : value); setCurrentPage(1); }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Filtrar por bodega" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las bodegas</SelectItem>
                  {warehouses.map(warehouse => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Botón para limpiar filtros */}
            {(filterRole || filterStatus || filterArea || filterWarehouse || search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setFilterRole("");
                  setFilterStatus("");
                  setFilterArea("");
                  setFilterWarehouse("");
                }}
                className="self-start text-xs"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState message="No se encontraron usuarios" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Nombre</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Rol</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Estado</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Áreas / Bodegas</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-foreground">{user.name} {user.lastName}</p>
                            <p className="text-sm text-muted-foreground">{formatRUT(user.rut)}</p>
                          </div>
                          {user.areas.length === 0 && user.warehouses.length === 0 && 
                           user.role !== 'ADMIN' && user.role !== USER_ROLES.ADMIN && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex-shrink-0">
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-sm font-semibold">Usuario sin asignaciones</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-foreground">{user.email}</td>
                      <td className="py-4 px-4">
                        <EntityBadge status={user.role} />
                      </td>
                      <td className="py-4 px-4">
                        <EntityBadge status={user.status} />
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-2">
                          {/* Áreas */}
                          {user.areaDetails && user.areaDetails.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {user.areaDetails.slice(0, 2).map((area) => (
                                <Badge 
                                  key={area.id} 
                                  variant="secondary" 
                                  className="text-xs"
                                >
                                  {area.name}
                                </Badge>
                              ))}
                              {user.areaDetails.length > 2 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs cursor-help"
                                      >
                                        +{user.areaDetails.length - 2} más
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="space-y-1">
                                        {user.areaDetails.slice(2).map((area) => (
                                          <p key={area.id} className="text-sm">
                                            {area.name}
                                          </p>
                                        ))}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          )}
                          
                          {/* Bodegas */}
                          {user.warehouseDetails && user.warehouseDetails.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {user.warehouseDetails.slice(0, 2).map((warehouse) => (
                                <Badge 
                                  key={warehouse.id} 
                                  variant="outline" 
                                  className="text-xs"
                                >
                                  {warehouse.name}
                                </Badge>
                              ))}
                              {user.warehouseDetails.length > 2 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs cursor-help"
                                      >
                                        +{user.warehouseDetails.length - 2} más
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="space-y-1">
                                        {user.warehouseDetails.slice(2).map((warehouse) => (
                                          <p key={warehouse.id} className="text-sm">
                                            {warehouse.name}
                                          </p>
                                        ))}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          )}

                          {/* Sin asignaciones - No mostrar para ADMIN */}
                          {user.areas.length === 0 && user.warehouses.length === 0 && 
                           user.role !== 'ADMIN' && user.role !== USER_ROLES.ADMIN && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge 
                                    variant="destructive" 
                                    className="text-xs gap-1 cursor-help"
                                  >
                                    <AlertTriangle className="h-3 w-3" />
                                    Sin asignar
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-sm">
                                    Este usuario no tiene áreas ni bodegas asignadas
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2 justify-end">
                          {can(PERMISSIONS.USERS_EDIT) && (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openAssignmentsDialog(user)}
                                      className="h-8 w-8 p-0"
                                      disabled={user.status === 'INACTIVE' || !user.isActive}
                                    >
                                      <Pencil className="h-4 w-4 text-primary" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{user.status === 'INACTIVE' || !user.isActive ? 'Usuario deshabilitado' : 'Modificar asignaciones'}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openDeleteConfirm(user)}
                                      className="h-8 w-8 p-0"
                                    >
                                      {user.status === 'HABILITADO' ? (
                                        <UserX className="h-4 w-4 text-amber-600" />
                                      ) : (
                                        <UserCheck className="h-4 w-4 text-success" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{user.status === 'HABILITADO' ? 'Deshabilitar usuario' : 'Habilitar usuario'}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Controles de paginación */}
          {!loading && totalUsers > 0 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Mostrando</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span>de {totalUsers} usuarios</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('⬅️ Previous page clicked, current:', currentPage);
                    setCurrentPage(prev => Math.max(1, prev - 1));
                  }}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-muted-foreground">Página</span>
                  <span className="font-medium">{currentPage}</span>
                  <span className="text-muted-foreground">de</span>
                  <span className="font-medium">{totalPages}</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('➡️ Next page clicked, current:', currentPage, 'totalPages:', totalPages);
                    setCurrentPage(prev => {
                      const newPage = Math.min(totalPages, prev + 1);
                      console.log('📄 New page will be:', newPage);
                      return newPage;
                    });
                  }}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Dialog para crear usuario */}
      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
        defaultValues={undefined}
        isLoading={actionLoading}
        mode="create"
      />

      {/* Dialog para modificar asignaciones */}
      {selectedUser && (
        <AssignmentsDialog
          open={assignmentsDialogOpen}
          onOpenChange={setAssignmentsDialogOpen}
          onSubmit={handleUpdateAssignments}
          user={selectedUser}
          isLoading={actionLoading}
        />
      )}

      {/* Dialog de confirmación para cambiar estado */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDisable}
        title={selectedUser?.status === 'HABILITADO' ? '¿Deshabilitar usuario?' : '¿Habilitar usuario?'}
        description={`¿Está seguro de ${selectedUser?.status === 'HABILITADO' ? 'deshabilitar' : 'habilitar'} al usuario ${selectedUser?.name} ${selectedUser?.lastName}?`}
      />
    </>
  );
}
