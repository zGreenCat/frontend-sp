"use client";

import { useState, useMemo, useEffect } from "react";
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
import {
  Plus,
  Search,
  Pencil,
  AlertTriangle,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { User } from "@/domain/entities/User";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { EmptyState } from "@/presentation/components/EmptyState";
import { formatRUT } from "@/shared/utils/formatters";
import { UserDialog } from "@/presentation/components/UserDialog";
import { AssignmentsDialog } from "@/presentation/components/AssignmentsDialog";
import { ConfirmDialog } from "@/presentation/components/ConfirmDialog";
import { UserDetailDialog } from "@/presentation/components/UserDetailDialog";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/hooks/use-auth";
import { CreateUserInput } from "@/shared/schemas";
import { PERMISSIONS } from "@/shared/permissions";
import { USER_ROLES } from "@/shared/constants";
import { useAreas } from "@/hooks/useAreas";
import { useWarehouses } from "@/hooks/useWarehouses";
import {
  useUsersList,
  useCreateUserMutation,
  useToggleUserStatus,
} from "@/hooks/useUsers";
import {
  useAssignManager,
  useRemoveManager,
  useAssignSupervisorToWarehouse,
  useRemoveSupervisorFromWarehouse,
} from "@/hooks/useAssignments";

export function UsersView() {
  const { toast } = useToast();
  const { can } = usePermissions();
  const { user: currentUser } = useAuth();

  // React Query hooks - caché compartido con AreasView / Warehouses
  const { data: areasData = [] } = useAreas();
  const { data: warehousesData = [] } = useWarehouses();

  // Extraer valores primitivos para evitar loops y facilitar comparaciones
  const currentUserId = currentUser?.id;
  const currentUserRole = useMemo(() => {
    if (!currentUser) return "";
    if (typeof currentUser.role === "string") return currentUser.role;
    if (
      currentUser.role &&
      typeof currentUser.role === "object" &&
      "name" in currentUser.role
    ) {
      return (currentUser.role as any).name;
    }
    return (currentUser as any).roleId || "";
  }, [currentUser]);

  // Transformar datos de React Query al formato esperado para selects, helpers, etc.
  const areas = useMemo(
    () => areasData.map((a) => ({ id: a.id, name: a.name })),
    [areasData]
  );
  const warehouses = useMemo(
    () => warehousesData.map((w) => ({ id: w.id, name: w.name })),
    [warehousesData]
  );

  // Paginación controlada por el componente (page/pageSize) → input del hook
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Hook de usuarios (nuestro flujo con React Query + usecases)
  const {
    data: usersResult,
    isLoading: usersLoading,
    error: usersError,
    refetch,
  } = useUsersList(currentPage, pageSize);

  const users: User[] = usersResult?.users ?? [];
  const totalPages = usersResult?.totalPages ?? 1;
  const totalUsers = usersResult?.totalUsers ?? 0;

  // Mutations
  const createUserMutation = useCreateUserMutation();
  const toggleStatusMutation = useToggleUserStatus();

  const assignManagerMutation = useAssignManager();
  const removeManagerMutation = useRemoveManager();
  const assignSupervisorToWarehouseMutation = useAssignSupervisorToWarehouse();
  const removeSupervisorFromWarehouseMutation =
    useRemoveSupervisorFromWarehouse();

  // Estado de UI
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignmentsDialogOpen, setAssignmentsDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false); // ← NUEVO
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filtros avanzados
  const [filterRole, setFilterRole] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterArea, setFilterArea] = useState<string>("");
  const [filterWarehouse, setFilterWarehouse] = useState<string>("");

  // Toast de error si falla el query de usuarios
  useEffect(() => {
    if (usersError) {
      const message =
        usersError instanceof Error
          ? usersError.message
          : "Error al cargar usuarios";
      toast({
        title: "Error de carga",
        description: message,
        variant: "destructive",
      });
    }
  }, [usersError, toast]);

  // Helpers para nombres
  const getAreaName = (
    areaId: string,
    userAreaDetails?: Array<{ id: string; name: string }>
  ): string => {
    if (userAreaDetails) {
      const area = userAreaDetails.find((a) => a.id === areaId);
      if (area) return area.name;
    }
    const area = areas.find((a) => a.id === areaId);
    return area?.name || areaId;
  };

  const getWarehouseName = (
    warehouseId: string,
    userWarehouseDetails?: Array<{ id: string; name: string }>
  ): string => {
    if (userWarehouseDetails) {
      const warehouse = userWarehouseDetails.find((w) => w.id === warehouseId);
      if (warehouse) return warehouse.name;
    }
    const warehouse = warehouses.find((w) => w.id === warehouseId);
    return warehouse?.name || warehouseId;
  };

  // Crear usuario (usa hook de React Query + usecase CreateUser)
  const handleCreate = async (data: CreateUserInput) => {
    setActionLoading(true);
    try {
      const createdUser = await createUserMutation.mutateAsync(data);

      const assignmentDetails: string[] = [];
      if (data.areas.length > 0) {
        const areaNames = data.areas.map((id) => getAreaName(id)).join(", ");
        assignmentDetails.push(`Áreas: ${areaNames}`);
      }
      if (data.warehouses.length > 0) {
        const warehouseNames = data.warehouses
          .map((id) => getWarehouseName(id))
          .join(", ");
        assignmentDetails.push(`Bodegas: ${warehouseNames}`);
      }

      toast({
        title: "Éxito",
        description: (
          <div className="space-y-1">
            <p>Usuario creado correctamente</p>
            {assignmentDetails.length > 0 && (
              <div className="text-xs opacity-80 mt-1">
                <p className="font-semibold">Asignaciones iniciales:</p>
                {assignmentDetails.map((detail, i) => (
                  <p key={i}>• {detail}</p>
                ))}
              </div>
            )}
          </div>
        ),
        variant: "success",
      });

      await refetch();
      setDialogOpen(false);
    } catch (error: any) {
      const errorMsg = error?.message || "Error al crear usuario";
      const isEmailDuplicate =
        errorMsg.toLowerCase().includes("email") ||
        errorMsg.toLowerCase().includes("duplicado");

      toast({
        title: isEmailDuplicate ? "Email duplicado" : "Error al crear usuario",
        description: isEmailDuplicate
          ? "El email ingresado ya está registrado en el sistema"
          : errorMsg,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Actualizar asignaciones (áreas / bodegas) usando useAssignments
  const handleUpdateAssignments = async (data: {
    areas: string[];
    warehouses: string[];
  }) => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      const previousAreas = selectedUser.areas || [];
      const previousWarehouses = selectedUser.warehouses || [];

      const roleStr =
        typeof selectedUser.role === "string"
          ? selectedUser.role
          : (selectedUser.role as any)?.name || "";

      const isJefe = roleStr === USER_ROLES.JEFE || roleStr === "JEFE_AREA";
      const isSupervisor = roleStr === USER_ROLES.SUPERVISOR;

      const promises: Promise<any>[] = [];
      const changes: string[] = [];

      // ÁREAS → solo tiene sentido para JEFE / JEFE_AREA
      if (isJefe) {
        const addedAreas = data.areas.filter(
          (id) => !previousAreas.includes(id)
        );
        const removedAreas = previousAreas.filter(
          (id) => !data.areas.includes(id)
        );

        for (const areaId of addedAreas) {
          promises.push(
            assignManagerMutation.mutateAsync({
              managerId: selectedUser.id,
              areaId,
            })
          );
        }
        for (const areaId of removedAreas) {
          promises.push(
            removeManagerMutation.mutateAsync({
              areaId,
              managerId: selectedUser.id,
            })
          );
        }

        if (addedAreas.length > 0) {
          const names = addedAreas.map((id) => getAreaName(id)).join(", ");
          changes.push(`Áreas agregadas: ${names}`);
        }
        if (removedAreas.length > 0) {
          const names = removedAreas.map((id) => getAreaName(id)).join(", ");
          changes.push(`Áreas removidas: ${names}`);
        }
      }

      // BODEGAS → solo tiene sentido para SUPERVISOR
      if (isSupervisor) {
        const addedWarehouses = data.warehouses.filter(
          (id) => !previousWarehouses.includes(id)
        );
        const removedWarehouses = previousWarehouses.filter(
          (id) => !data.warehouses.includes(id)
        );

        for (const warehouseId of addedWarehouses) {
          promises.push(
            assignSupervisorToWarehouseMutation.mutateAsync({
              warehouseId,
              supervisorId: selectedUser.id,
            })
          );
        }
        for (const warehouseId of removedWarehouses) {
          promises.push(
            removeSupervisorFromWarehouseMutation.mutateAsync({
              warehouseId,
              supervisorId: selectedUser.id,
            })
          );
        }

        if (addedWarehouses.length > 0) {
          const names = addedWarehouses
            .map((id) => getWarehouseName(id))
            .join(", ");
          changes.push(`Bodegas agregadas: ${names}`);
        }
        if (removedWarehouses.length > 0) {
          const names = removedWarehouses
            .map((id) => getWarehouseName(id))
            .join(", ");
          changes.push(`Bodegas removidas: ${names}`);
        }
      }

      if (!isJefe && !isSupervisor) {
        toast({
          title: "Rol sin asignaciones",
          description:
            "Solo se gestionan asignaciones para Jefes de Área y Supervisores.",
        });
        setActionLoading(false);
        setAssignmentsDialogOpen(false);
        return;
      }

      if (promises.length === 0) {
        toast({
          title: "Sin cambios",
          description: "No se detectaron cambios en las asignaciones.",
        });
        setActionLoading(false);
        setAssignmentsDialogOpen(false);
        return;
      }

      await Promise.all(promises);

      toast({
        title: "Éxito",
        description: (
          <div className="space-y-1">
            <p>Asignaciones actualizadas correctamente</p>
            {changes.length > 0 && (
              <div className="text-xs opacity-80 mt-1">
                <p className="font-semibold">Cambios:</p>
                {changes.map((change, i) => (
                  <p key={i}>• {change}</p>
                ))}
              </div>
            )}
          </div>
        ),
        variant: "success",
      });

      await refetch();
      setSelectedUser(null);
      setAssignmentsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error en actualización",
        description:
          error?.message ||
          "Ocurrió un error al actualizar las asignaciones del usuario",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Habilitar / deshabilitar usuario usando hook useToggleUserStatus
  const handleDisable = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      const newStatus =
        selectedUser.status === "HABILITADO"
          ? ("DESHABILITADO" as const)
          : ("HABILITADO" as const);

      await toggleStatusMutation.mutateAsync({
        userId: selectedUser.id,
        newStatus,
        performedBy: currentUser?.id || '', // Registrar quién realizó el cambio
      });

      toast({
        title: "Éxito",
        description: `Usuario ${
          newStatus === "HABILITADO" ? "habilitado" : "deshabilitado"
        } correctamente`,
        variant: "success",
      });

      await refetch();
      setSelectedUser(null);
      setConfirmOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.message || "Error al cambiar el estado del usuario",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openCreateDialog = () => {
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const openAssignmentsDialog = (user: User) => {
    setSelectedUser(user);
    setAssignmentsDialogOpen(true);
  };

  const openDetailDialog = (user: User) => {
    setSelectedUser(user);
    setDetailDialogOpen(true);
  };

  const openDeleteConfirm = (user: User) => {
    setSelectedUser(user);
    setConfirmOpen(true);
  };

  // Filtro por jerarquía (ADMIN ve todo; JEFE ya viene filtrado desde el hook; SUPERVISOR ve nada)
  const filterUsersByHierarchy = (allUsers: User[]): User[] => {
    if (!currentUser) return allUsers;

    let userRole: string;
    if (typeof currentUser.role === "string") {
      userRole = currentUser.role;
    } else if (
      currentUser.role &&
      typeof currentUser.role === "object" &&
      "name" in currentUser.role
    ) {
      userRole = (currentUser.role as any).name;
    } else {
      userRole = (currentUser as any).roleId || "";
    }

    switch (userRole) {
      case USER_ROLES.ADMIN:
      case "ADMIN":
        return allUsers;
      case USER_ROLES.JEFE:
      case "JEFE":
      case "JEFE_AREA":
        return allUsers; // ya filtrados en useUsersList
      case USER_ROLES.SUPERVISOR:
      case "SUPERVISOR":
        return [];
      default:
        return allUsers;
    }
  };

  const usersByHierarchy = filterUsersByHierarchy(users);

  // Filtros de búsqueda / rol / estado / área / bodega
  const filteredUsers = usersByHierarchy.filter((u) => {
    if (u.id === currentUserId) return false;

    const matchesSearch =
      search === "" ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      // ✅ TODO #2: Agregar búsqueda por RUT (normalizar sin puntos ni guiones)
      (u.rut && u.rut.replace(/[.-]/g, '').includes(search.replace(/[.-]/g, '')));

    const userRoleStr =
      typeof u.role === "string" ? u.role : (u.role as any)?.name || "";
    const matchesRole = filterRole === "" || userRoleStr === filterRole;

    const matchesStatus = filterStatus === "" || u.status === filterStatus;

    const matchesArea =
      filterArea === "" || (u.areas && u.areas.includes(filterArea));

    const matchesWarehouse =
      filterWarehouse === "" ||
      (u.warehouses && u.warehouses.includes(filterWarehouse));

    return (
      matchesSearch &&
      matchesRole &&
      matchesStatus &&
      matchesArea &&
      matchesWarehouse
    );
  });

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Usuarios</h1>
            <p className="text-muted-foreground">
              Gestión de usuarios del sistema
              {(() => {
                const role = currentUser?.role;
                const roleStr =
                  typeof role === "string"
                    ? role
                    : (role as any)?.name || (currentUser as any)?.roleId;
                return (
                  roleStr &&
                  (roleStr === USER_ROLES.JEFE || roleStr === "JEFE_AREA") && (
                    <span className="block text-xs mt-1 text-primary">
                      📋 Mostrando solo supervisores de las bodegas en tus áreas
                      asignadas
                    </span>
                  )
                );
              })()}
            </p>
          </div>
          {can(PERMISSIONS.USERS_CREATE) && (
            <Button
              className="bg-primary text-primary-foreground h-10 gap-2 w-full sm:w-auto"
              onClick={openCreateDialog}
            >
              <Plus className="h-4 w-4" />
              Nuevo Usuario
            </Button>
          )}
        </div>

        {/* Card principal */}
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
                <Select
                  value={filterRole || "all"}
                  onValueChange={(value) => {
                    setFilterRole(value === "all" ? "" : value);
                    setCurrentPage(1);
                  }}
                >
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

                <Select
                  value={filterStatus || "all"}
                  onValueChange={(value) => {
                    setFilterStatus(value === "all" ? "" : value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="HABILITADO">Habilitado</SelectItem>
                    <SelectItem value="DESHABILITADO">Deshabilitado</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filterArea || "all"}
                  onValueChange={(value) => {
                    setFilterArea(value === "all" ? "" : value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Filtrar por área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las áreas</SelectItem>
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filterWarehouse || "all"}
                  onValueChange={(value) => {
                    setFilterWarehouse(value === "all" ? "" : value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Filtrar por bodega" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las bodegas</SelectItem>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(filterRole ||
                filterStatus ||
                filterArea ||
                filterWarehouse ||
                search) && (
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
            {usersLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando...
              </div>
            ) : filteredUsers.length === 0 ? (
              <EmptyState message="No se encontraron usuarios" />
            ) : (
              <>
                {/* 📱 MOBILE: Cards (md:hidden) */}
                <div className="space-y-3 md:hidden">
                  {filteredUsers.map((user) => {
                    const roleStr =
                      typeof user.role === "string"
                        ? user.role
                        : (user.role as any)?.name || "";

                    const isUnassigned =
                      user.areas.length === 0 &&
                      user.warehouses.length === 0 &&
                      roleStr !== "ADMIN" &&
                      roleStr !== USER_ROLES.ADMIN;

                    return (
                      <div
                        key={user.id}
                        className={`border border-border rounded-lg p-3 bg-card shadow-sm flex flex-col gap-2 ${
                          user.status === "DESHABILITADO" ? "opacity-60 bg-red-50 border-red-200" : ""
                        }`}
                      >
                        {/* Nombre + RUT + alerta sin asignar */}
                        <div className="flex items-start justify-between gap-2">
                          <div 
                            className="cursor-pointer hover:text-primary transition-colors"
                            onClick={() => openDetailDialog(user)}
                          >
                            <p className="font-semibold text-sm">
                              {user.name} {user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatRUT(user.rut)}
                            </p>
                          </div>

                          {isUnassigned && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-sm">
                                    Usuario sin áreas ni bodegas asignadas
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>

                        {/* Email */}
                        <p className="text-xs text-muted-foreground break-all">
                          {user.email}
                        </p>

                        {/* Rol y Estado */}
                        <div className="flex flex-wrap gap-2 text-xs items-center">
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Rol:</span>
                            <EntityBadge status={user.role} />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">
                              Estado:
                            </span>
                            <EntityBadge status={user.status} />
                          </div>
                        </div>

                        {/* Áreas / Bodegas */}
                        <div className="space-y-1 mt-1">
                          {user.areaDetails && user.areaDetails.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {user.areaDetails.slice(0, 3).map((area) => (
                                <Badge
                                  key={area.id}
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  {area.name}
                                </Badge>
                              ))}
                              {user.areaDetails.length > 3 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] cursor-help"
                                      >
                                        +{user.areaDetails.length - 3} más
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="space-y-1">
                                        {user.areaDetails
                                          .slice(3)
                                          .map((area) => (
                                            <p
                                              key={area.id}
                                              className="text-sm"
                                            >
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

                          {user.warehouseDetails &&
                            user.warehouseDetails.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {user.warehouseDetails
                                  .slice(0, 3)
                                  .map((warehouse) => (
                                    <Badge
                                      key={warehouse.id}
                                      variant="outline"
                                      className="text-[10px]"
                                    >
                                      {warehouse.name}
                                    </Badge>
                                  ))}
                                {user.warehouseDetails.length > 3 && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] cursor-help"
                                        >
                                          +
                                          {user.warehouseDetails.length - 3}{" "}
                                          más
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="space-y-1">
                                          {user.warehouseDetails
                                            .slice(3)
                                            .map((wh) => (
                                              <p
                                                key={wh.id}
                                                className="text-sm"
                                              >
                                                {wh.name}
                                              </p>
                                            ))}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            )}

                          {/* Sin asignaciones - no mostrar para ADMIN */}
                          {user.areas.length === 0 &&
                            user.warehouses.length === 0 &&
                            roleStr !== "ADMIN" &&
                            roleStr !== USER_ROLES.ADMIN && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] gap-1 cursor-help border-yellow-600 text-yellow-700 bg-yellow-50"
                                    >
                                      <AlertTriangle className="h-3 w-3" />
                                      Sin asignar
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-sm">
                                      Este usuario no tiene áreas ni bodegas
                                      asignadas
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                        </div>

                        {/* Acciones */}
                        {can(PERMISSIONS.USERS_EDIT) && (
                          <div className="flex justify-end gap-1 pt-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      openAssignmentsDialog(user)
                                    }
                                    disabled={user.status === "DESHABILITADO"}
                                  >
                                    <Pencil className="h-4 w-4 text-primary" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {user.status === "DESHABILITADO"
                                      ? "Usuario deshabilitado"
                                      : "Modificar asignaciones"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openDeleteConfirm(user)}
                                    disabled={false}
                                  >
                                    {user.status === "HABILITADO" ? (
                                      <UserX className="h-4 w-4 text-amber-600" />
                                    ) : (
                                      <UserCheck className="h-4 w-4 text-success" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {user.status === "HABILITADO"
                                      ? "Deshabilitar usuario"
                                      : "Habilitar usuario"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 🖥️ DESKTOP/TABLET: Tabla (hidden en mobile) */}
                <div className="hidden md:block">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                            Nombre
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                            Email
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                            Rol
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                            Estado
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                            Áreas / Bodegas
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr
                            key={user.id}
                            className={`border-b border-border hover:bg-secondary/20 transition-colors ${
                              user.status === "DESHABILITADO" ? "bg-red-50/50 opacity-70" : ""
                            }`}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="cursor-pointer hover:text-primary transition-colors"
                                  onClick={() => openDetailDialog(user)}
                                >
                                  <p className="font-medium text-foreground">
                                    {user.name} {user.lastName}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatRUT(user.rut)}
                                  </p>
                                </div>
                                {user.areas.length === 0 &&
                                  user.warehouses.length === 0 &&
                                  (() => {
                                    const roleStr =
                                      typeof user.role === "string"
                                        ? user.role
                                        : (user.role as any)?.name || "";
                                    return (
                                      roleStr !== "ADMIN" &&
                                      roleStr !== USER_ROLES.ADMIN
                                    );
                                  })() && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex-shrink-0">
                                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-sm font-semibold">
                                            Usuario sin asignaciones
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-sm text-foreground">
                              {user.email}
                            </td>
                            <td className="py-4 px-4">
                              <EntityBadge status={user.role} />
                            </td>
                            <td className="py-4 px-4">
                              <EntityBadge status={user.status} />
                            </td>
                            <td className="py-4 px-4">
                              <div className="space-y-2">
                                {/* Áreas */}
                                {user.areaDetails &&
                                  user.areaDetails.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {user.areaDetails
                                        .slice(0, 2)
                                        .map((area) => (
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
                                                +
                                                {user.areaDetails.length - 2}{" "}
                                                más
                                              </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <div className="space-y-1">
                                                {user.areaDetails
                                                  .slice(2)
                                                  .map((area) => (
                                                    <p
                                                      key={area.id}
                                                      className="text-sm"
                                                    >
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
                                {user.warehouseDetails &&
                                  user.warehouseDetails.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {user.warehouseDetails
                                        .slice(0, 2)
                                        .map((warehouse) => (
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
                                                +
                                                {user.warehouseDetails.length -
                                                  2}{" "}
                                                más
                                              </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <div className="space-y-1">
                                                {user.warehouseDetails
                                                  .slice(2)
                                                  .map((warehouse) => (
                                                    <p
                                                      key={warehouse.id}
                                                      className="text-sm"
                                                    >
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

                                {/* Sin asignaciones - no mostrar para ADMIN */}
                                {user.areas.length === 0 &&
                                  user.warehouses.length === 0 &&
                                  (() => {
                                    const roleStr =
                                      typeof user.role === "string"
                                        ? user.role
                                        : (user.role as any)?.name || "";
                                    return (
                                      roleStr !== "ADMIN" &&
                                      roleStr !== USER_ROLES.ADMIN
                                    );
                                  })() && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Badge
                                            variant="outline"
                                            className="text-xs gap-1 cursor-help border-yellow-600 text-yellow-700 bg-yellow-50"
                                          >
                                            <AlertTriangle className="h-3 w-3" />
                                            Sin asignar
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-sm">
                                            Este usuario no tiene áreas ni
                                            bodegas asignadas
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
                                            onClick={() =>
                                              openAssignmentsDialog(user)
                                            }
                                            className="h-8 w-8 p-0"
                                            disabled={
                                              user.status === "DESHABILITADO"
                                            }
                                          >
                                            <Pencil className="h-4 w-4 text-primary" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>
                                            {user.status === "DESHABILITADO"
                                              ? "Usuario deshabilitado"
                                              : "Modificar asignaciones"}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>

                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              openDeleteConfirm(user)
                                            }
                                            className="h-8 w-8 p-0"
                                          >
                                            {user.status === "HABILITADO" ? (
                                              <UserX className="h-4 w-4 text-amber-600" />
                                            ) : (
                                              <UserCheck className="h-4 w-4 text-success" />
                                            )}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>
                                            {user.status === "HABILITADO"
                                              ? "Deshabilitar usuario"
                                              : "Habilitar usuario"}
                                          </p>
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
                </div>
              </>
            )}

            {/* Paginación */}
            {!usersLoading && totalUsers > 0 && (
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-4 py-4 border-t">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>Mostrando</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-20">
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

                <div className="flex items-center justify-between md:justify-end gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="h-8 w-9 p-0"
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
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(totalPages, prev + 1)
                      )
                    }
                    disabled={currentPage === totalPages}
                    className="h-8 w-9 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog crear usuario */}
      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
        defaultValues={undefined}
        isLoading={actionLoading}
      />

      {/* Dialog modificar asignaciones */}
      {selectedUser && (
        <AssignmentsDialog
          open={assignmentsDialogOpen}
          onOpenChange={setAssignmentsDialogOpen}
          onSubmit={handleUpdateAssignments}
          user={selectedUser}
          isLoading={actionLoading}
        />
      )}

      {/* Dialog de detalle de usuario con historial */}
      <UserDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        user={selectedUser}
      />

      {/* Dialog confirmar habilitar/deshabilitar */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDisable}
        title={
          selectedUser?.status === "HABILITADO"
            ? "¿Deshabilitar usuario?"
            : "¿Habilitar usuario?"
        }
        description={
          selectedUser?.status === "HABILITADO"
            ? `¿Confirma deshabilitar a ${selectedUser?.name} ${selectedUser?.lastName}? No podrá acceder al sistema y sus asignaciones quedarán inactivas.`
            : `¿Confirma habilitar a ${selectedUser?.name} ${selectedUser?.lastName}? Podrá volver a acceder al sistema con sus asignaciones actuales.`
        }
      />
    </>
  );
}
