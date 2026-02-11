"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { WarehouseQuery, WarehouseOrder, WarehouseSortBy } from "@/shared/types/warehouse-filters.types";

interface WarehouseFilterBarProps {
  filters: WarehouseQuery;
  onFiltersChange: (filters: Partial<WarehouseQuery>) => void;
}

export function WarehouseFilterBar({ filters, onFiltersChange }: WarehouseFilterBarProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || "");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFiltersChange({ search: localSearch || undefined });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [localSearch, filters.search, onFiltersChange]);

  const handleIsEnabledChange = useCallback(
    (value: string) => {
      if (value === "all") {
        onFiltersChange({ isEnabled: undefined });
      } else {
        onFiltersChange({ isEnabled: value === "true" });
      }
    },
    [onFiltersChange]
  );

  const handleSortByChange = useCallback(
    (value: string) => {
      onFiltersChange({ sortBy: value as WarehouseSortBy });
    },
    [onFiltersChange]
  );

  const handleOrderChange = useCallback(
    (value: string) => {
      onFiltersChange({ order: value as WarehouseOrder });
    },
    [onFiltersChange]
  );

  const getIsEnabledValue = () => {
    if (filters.isEnabled === undefined) return "all";
    return filters.isEnabled ? "true" : "false";
  };

  return (
    <Card className="p-4 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm font-medium">
            Buscar
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Nombre de bodega..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 h-10 bg-secondary/30"
            />
          </div>
        </div>

        {/* Estado */}
        <div className="space-y-2">
          <Label htmlFor="isEnabled" className="text-sm font-medium">
            Estado
          </Label>
          <Select value={getIsEnabledValue()} onValueChange={handleIsEnabledChange}>
            <SelectTrigger id="isEnabled" className="h-10 bg-secondary/30">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Habilitadas</SelectItem>
              <SelectItem value="false">Deshabilitadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ordenar por */}
        <div className="space-y-2">
          <Label htmlFor="sortBy" className="text-sm font-medium">
            Ordenar por
          </Label>
          <Select value={filters.sortBy || "createdAt"} onValueChange={handleSortByChange}>
            <SelectTrigger id="sortBy" className="h-10 bg-secondary/30">
              <SelectValue placeholder="Fecha creación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Fecha creación</SelectItem>
              <SelectItem value="name">Nombre</SelectItem>
              <SelectItem value="maxCapacityKg">Capacidad</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orden */}
        <div className="space-y-2">
          <Label htmlFor="order" className="text-sm font-medium">
            Orden
          </Label>
          <Select value={filters.order || "desc"} onValueChange={handleOrderChange}>
            <SelectTrigger id="order" className="h-10 bg-secondary/30">
              <SelectValue placeholder="Descendente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descendente</SelectItem>
              <SelectItem value="asc">Ascendente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
