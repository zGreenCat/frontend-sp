// src/presentation/components/UserDetailDialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "@/domain/entities/User";
import { useUserEnablementHistory } from "@/hooks/useUserEnablementHistory";
import { UserEnablementHistoryList } from "./UserEnablementHistoryList";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, IdCard, Building2, Warehouse, History } from "lucide-react";
import { EntityBadge } from "@/presentation/components/EntityBadge";

interface UserDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export function UserDetailDialog({
  open,
  onOpenChange,
  user,
}: UserDetailDialogProps) {
  const { data: historyData, isLoading: historyLoading } = useUserEnablementHistory(
    user?.id || '',
    1,
    undefined,
    { enabled: !!user?.id && open }
  );

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 gap-0 overflow-hidden">
        {/* Header con fondo */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background px-6 py-5 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Detalle de Usuario
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {user.name} {user.lastName}
            </p>
          </DialogHeader>
        </div>

        {/* Contenido con Tabs */}
        <Tabs defaultValue="info" className="flex-1">
          <div className="border-b px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Información</TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                Historial
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB: Información General */}
          <TabsContent value="info" className="px-6 py-6 overflow-y-auto max-h-[60vh]">
            <div className="space-y-6">
              {/* Datos Básicos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Datos Básicos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                      <p className="text-sm">{user.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Apellido</p>
                      <p className="text-sm">{user.lastName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-sm">{user.email}</p>
                    </div>
                  </div>

                  {user.rut && (
                    <div className="flex items-center gap-2">
                      <IdCard className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">RUT</p>
                        <p className="text-sm">{user.rut}</p>
                      </div>
                    </div>
                  )}

                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                        <p className="text-sm">{user.phone}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Rol</p>
                      <EntityBadge status={user.role} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Estado</p>
                      <EntityBadge status={user.status} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Asignaciones */}
              {(user.areaDetails && user.areaDetails.length > 0) ||
              (user.warehouseDetails && user.warehouseDetails.length > 0) ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Asignaciones</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Áreas */}
                    {user.areaDetails && user.areaDetails.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">Áreas ({user.areaDetails.length})</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {user.areaDetails.map((area) => (
                            <Badge key={area.id} variant="secondary">
                              {area.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bodegas */}
                    {user.warehouseDetails && user.warehouseDetails.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Warehouse className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">
                            Bodegas ({user.warehouseDetails.length})
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {user.warehouseDetails.map((warehouse) => (
                            <Badge key={warehouse.id} variant="outline">
                              {warehouse.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </TabsContent>

          {/* TAB: Historial de Habilitación */}
          <TabsContent value="history" className="px-6 py-6 overflow-y-auto max-h-[60vh]">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Historial de Habilitación/Deshabilitación
                </h3>
                <p className="text-xs text-muted-foreground">
                  Registro completo de cambios en el estado de acceso al sistema
                </p>
              </div>

              <UserEnablementHistoryList
                entries={historyData?.data || []}
                isLoading={historyLoading}
                showUserInfo={false}
              />

              {historyData && historyData.total > 0 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Total de registros: {historyData.total}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
