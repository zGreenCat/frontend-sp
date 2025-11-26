"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Search, Pencil, Trash2, AlertTriangle } from "lucide-react";
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
import { UserDialog } from "@/presentation/components/UserDialog";
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
  const [users, setUsers] = useState<User[]>([]);
  const [areas, setAreas] = useState<Array<{ id: string; name: string }>>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [usersResult, areasData, warehousesData] = await Promise.all([
        new ListUsers(userRepo).execute(TENANT_ID),
        areaRepo.findAll(TENANT_ID),
        warehouseRepo.findAll(TENANT_ID),
      ]);
      
      if (usersResult.ok) {
        setUsers(usersResult.value);
        setAreas(areasData.map(a => ({ id: a.id, name: a.name })));
        setWarehouses(warehousesData.map(w => ({ id: w.id, name: w.name })));
      } else {
        toast({
          title: "Error",
          description: "Error al cargar usuarios",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar datos",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper para obtener nombre de área por ID
  const getAreaName = (areaId: string): string => {
    const area = areas.find(a => a.id === areaId);
    return area?.name || areaId;
  };

  // Helper para obtener nombre de bodega por ID
  const getWarehouseName = (warehouseId: string): string => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse?.name || warehouseId;
  };

  const handleCreate = async (data: CreateUserInput) => {
    setActionLoading(true);
    const useCase = new CreateUser(userRepo);
    const result = await useCase.execute(data);
    
    if (result.ok) {
      // Registrar asignaciones iniciales en el historial
      if (currentUser && (data.areas.length > 0 || data.warehouses.length > 0)) {
        const logUseCase = new LogAssignmentChange(
          assignmentHistoryRepo,
          areaRepo,
          warehouseRepo
        );
        await logUseCase.execute({
          userId: result.value.id,
          previousAreas: [],
          newAreas: data.areas,
          previousWarehouses: [],
          newWarehouses: data.warehouses,
          performedBy: currentUser.id,
          performedByName: `${currentUser.name} ${currentUser.lastName || ''}`.trim(),
          tenantId: TENANT_ID,
        });
      }

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
              <div className="text-xs text-muted-foreground mt-1">
                <p className="font-semibold">Asignaciones:</p>
                {assignmentDetails.map((detail, i) => (
                  <p key={i}>• {detail}</p>
                ))}
              </div>
            )}
          </div>
        ),
      });
      await loadUsers();
    } else {
      toast({
        title: "Error",
        description: result.error || "Error al crear usuario",
        variant: "destructive",
      });
    }
    setActionLoading(false);
  };

  const handleUpdate = async (data: CreateUserInput) => {
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
      // Registrar cambios en asignaciones si hubo modificaciones
      if (currentUser && hasAssignmentChanges) {
        const logUseCase = new LogAssignmentChange(
          assignmentHistoryRepo,
          areaRepo,
          warehouseRepo
        );
        await logUseCase.execute({
          userId: selectedUser.id,
          previousAreas,
          newAreas: data.areas,
          previousWarehouses,
          newWarehouses: data.warehouses,
          performedBy: currentUser.id,
          performedByName: `${currentUser.name} ${currentUser.lastName || ''}`.trim(),
          tenantId: TENANT_ID,
        });
      }

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
              <div className="text-xs text-muted-foreground mt-1">
                <p className="font-semibold">Cambios en asignaciones:</p>
                {changes.map((change, i) => (
                  <p key={i}>• {change}</p>
                ))}
              </div>
            )}
          </div>
        ),
      });
      await loadUsers();
      setSelectedUser(null);
    } else {
      toast({
        title: "Error",
        description: result.error || "Error al actualizar usuario",
        variant: "destructive",
      });
    }
    setActionLoading(false);
  };

  const handleDisable = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    const useCase = new DisableUser(userRepo);
    const result = await useCase.execute(selectedUser.id, TENANT_ID);
    
    if (result.ok) {
      toast({
        title: "Éxito",
        description: "Usuario deshabilitado correctamente",
      });
      await loadUsers();
      setSelectedUser(null);
      setConfirmOpen(false);
    } else {
      toast({
        title: "Error",
        description: result.error || "Error al deshabilitar usuario",
        variant: "destructive",
      });
    }
    setActionLoading(false);
  };

  const openCreateDialog = () => {
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const openDeleteConfirm = (user: User) => {
    setSelectedUser(user);
    setConfirmOpen(true);
  };

  // Filtrar usuarios según jerarquía del usuario autenticado
  const filterUsersByHierarchy = (allUsers: User[]): User[] => {
    if (!currentUser) return allUsers;

    const userRole = currentUser.role || currentUser.roleId;
    const userAreas = currentUser.areas || [];

    switch (userRole) {
      case USER_ROLES.ADMIN:
        // Admin ve todos los usuarios
        return allUsers;
      
      case USER_ROLES.JEFE:
        // Jefe de Área solo ve usuarios de sus áreas asignadas
        if (userAreas.length === 0) return [];
        return allUsers.filter(u => {
          const userAreasSet = new Set(u.areas);
          return userAreas.some(areaId => userAreasSet.has(areaId));
        });
      
      case USER_ROLES.SUPERVISOR:
        // Supervisor no ve listado administrativo de usuarios
        return [];
      
      default:
        return allUsers;
    }
  };

  const usersByHierarchy = filterUsersByHierarchy(users);

  const filteredUsers = usersByHierarchy.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.lastName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

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
                return roleStr === USER_ROLES.JEFE && (
                  <span className="block text-xs mt-1 text-primary">
                    Mostrando solo usuarios de tus áreas asignadas
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
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 bg-secondary/30"
              />
            </div>
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
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-foreground">{user.name} {user.lastName}</p>
                            <p className="text-sm text-muted-foreground">{user.rut}</p>
                          </div>
                          {user.areas.length === 0 && user.warehouses.length === 0 && (
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
                          {user.areas.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {user.areas.slice(0, 2).map((areaId) => (
                                <Badge 
                                  key={areaId} 
                                  variant="secondary" 
                                  className="text-xs"
                                >
                                  {getAreaName(areaId)}
                                </Badge>
                              ))}
                              {user.areas.length > 2 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs cursor-help"
                                      >
                                        +{user.areas.length - 2} más
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="space-y-1">
                                        {user.areas.slice(2).map((areaId) => (
                                          <p key={areaId} className="text-sm">
                                            {getAreaName(areaId)}
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
                          {user.warehouses.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {user.warehouses.slice(0, 2).map((warehouseId) => (
                                <Badge 
                                  key={warehouseId} 
                                  variant="outline" 
                                  className="text-xs"
                                >
                                  {getWarehouseName(warehouseId)}
                                </Badge>
                              ))}
                              {user.warehouses.length > 2 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs cursor-help"
                                      >
                                        +{user.warehouses.length - 2} más
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="space-y-1">
                                        {user.warehouses.slice(2).map((warehouseId) => (
                                          <p key={warehouseId} className="text-sm">
                                            {getWarehouseName(warehouseId)}
                                          </p>
                                        ))}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          )}

                          {/* Sin asignaciones */}
                          {user.areas.length === 0 && user.warehouses.length === 0 && (
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(user)}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {can(PERMISSIONS.USERS_DELETE) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteConfirm(user)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Dialog para crear/editar usuario */}
      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={selectedUser ? handleUpdate : handleCreate}
        defaultValues={selectedUser || undefined}
        isLoading={actionLoading}
        mode={selectedUser ? "edit" : "create"}
      />

      {/* Dialog de confirmación para deshabilitar */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDisable}
        title="¿Deshabilitar usuario?"
        description={`¿Está seguro de deshabilitar al usuario ${selectedUser?.name} ${selectedUser?.lastName}? Esta acción puede revertirse más tarde.`}
      />
    </>
  );
}
