// src/presentation/views/UserEnablementHistoryView.tsx
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { History, Search, Filter, RefreshCw } from "lucide-react";
import { useGlobalEnablementHistory } from "@/hooks/useUserEnablementHistory";
import { UserEnablementHistoryList } from "@/presentation/components/UserEnablementHistoryList";
import { GetEnablementHistoryFilters } from "@/domain/repositories/IUserEnablementHistoryRepository";
import { EnablementAction } from "@/domain/entities/UserEnablementHistory";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/shared/permissions";

export function UserEnablementHistoryView() {
  const { can } = usePermissions();
  
  // Filtros
  const [userIdFilter, setUserIdFilter] = useState("");
  const [performedByFilter, setPerformedByFilter] = useState("");
  const [actionFilter, setActionFilter] = useState<EnablementAction | "">("");
  const [searchTerm, setSearchTerm] = useState("");

  // Construir filtros para la query
  const filters: GetEnablementHistoryFilters = useMemo(() => {
    const f: GetEnablementHistoryFilters = {};
    if (userIdFilter) f.userId = userIdFilter;
    if (performedByFilter) f.performedById = performedByFilter;
    if (actionFilter) f.action = actionFilter;
    return f;
  }, [userIdFilter, performedByFilter, actionFilter]);

  // Query data
  const { data, isLoading, refetch } = useGlobalEnablementHistory(filters, {
    enabled: can(PERMISSIONS.USERS_VIEW),
  });

  // Filtro local por término de búsqueda
  const filteredEntries = useMemo(() => {
    if (!data?.data) return [];
    if (!searchTerm) return data.data;

    const term = searchTerm.toLowerCase();
    return data.data.filter((entry) => {
      const userName = entry.user
        ? `${entry.user.firstName} ${entry.user.lastName} ${entry.user.email}`.toLowerCase()
        : "";
      const performerName = entry.performer
        ? `${entry.performer.firstName} ${entry.performer.lastName} ${entry.performer.email}`.toLowerCase()
        : "";
      return userName.includes(term) || performerName.includes(term);
    });
  }, [data?.data, searchTerm]);

  const handleClearFilters = () => {
    setUserIdFilter("");
    setPerformedByFilter("");
    setActionFilter("");
    setSearchTerm("");
  };

  if (!can(PERMISSIONS.USERS_VIEW)) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          No tienes permisos para ver el historial de habilitación
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <History className="h-8 w-8 text-primary" />
            Historial de Habilitación
          </h1>
          <p className="text-muted-foreground mt-1">
            Registro completo de cambios de estado de usuarios
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda por texto */}
            <div className="lg:col-span-2">
              <label className="text-sm font-medium mb-2 block">
                Buscar usuario o ejecutor
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por acción */}
            <div>
              <label className="text-sm font-medium mb-2 block">Acción</label>
              <Select
                value={actionFilter}
                onValueChange={(value) => setActionFilter(value as EnablementAction | "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las acciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="ENABLED">Habilitado</SelectItem>
                  <SelectItem value="DISABLED">Deshabilitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botón limpiar filtros */}
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="w-full"
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Resultados ({filteredEntries.length})
            </CardTitle>
            {data && (
              <span className="text-sm text-muted-foreground">
                Total de registros: {data.total}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <UserEnablementHistoryList
            entries={filteredEntries}
            isLoading={isLoading}
            showUserInfo={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
