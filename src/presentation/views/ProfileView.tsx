"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Warehouse, 
  Shield,
  LogOut
} from "lucide-react";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { formatPhone } from "@/shared/utils/formatters";
import { useRouter } from "next/navigation";
import { EditProfileDialog } from "@/presentation/components/EditProfileDialog";

export function ProfileView() {
  const { user, logout, hasPermission } = useAuth();
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No hay usuario autenticado</p>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const userInitials = `${(user.firstName || 'U').charAt(0)}${(user.lastName || 'S').charAt(0)}`.toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Mi Perfil</h1>
        <p className="text-muted-foreground">Información personal y permisos</p>
      </div>

      {/* Información Principal */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{user.firstName || ''} {user.lastName || ''}</CardTitle>
                <CardDescription className="text-base mt-1">
                  {user.role?.name || 'Usuario'}
                </CardDescription>
                <div className="mt-2">
                  <EntityBadge status={user.status || 'HABILITADO'} />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
                className="gap-2"
              >
                <Phone className="h-4 w-4" />
                Editar Teléfono
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Separator />

          {/* Información de Contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Teléfono</p>
                <p className="font-medium">{user.phone ? formatPhone(user.phone) : 'No especificado'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">RUT</p>
                <p className="font-medium font-mono">{user.rut || 'No especificado'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rol</p>
                <p className="font-medium">{user.role?.name || 'Usuario'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Asignaciones */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Áreas Asignadas</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.areas && user.areas.length > 0 ? (
                  user.areas.map((areaId) => (
                    <Badge key={areaId} variant="secondary">
                      {areaId}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Sin áreas asignadas</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Warehouse className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Bodegas Asignadas</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.warehouses && user.warehouses.length > 0 ? (
                  user.warehouses.map((warehouseId) => (
                    <Badge key={warehouseId} variant="secondary">
                      {warehouseId}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Sin bodegas asignadas</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de edición de teléfono */}
      <EditProfileDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
      />
    </div>
  );
}
