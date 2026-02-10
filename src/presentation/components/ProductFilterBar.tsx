"use client";

import { useEffect, useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";

interface BaseFilterBarProps {
  search?: string;
  onSearchChange: (value: string) => void;
  isActive?: boolean | undefined;
  onIsActiveChange: (value: boolean | undefined) => void;
  currencyId?: string;
  onCurrencyIdChange: (value: string | undefined) => void;
  currencies?: Array<{ id: string; code: string; name: string }>;
  debounceMs?: number;
}

interface EquipmentFilterBarProps extends BaseFilterBarProps {
  type: 'EQUIPMENT';
}

interface SparePartFilterBarProps extends BaseFilterBarProps {
  type: 'SPARE_PART';
  category?: 'COMPONENT' | 'SPARE' | undefined;
  onCategoryChange: (value: 'COMPONENT' | 'SPARE' | undefined) => void;
  equipmentId?: string;
  onEquipmentIdChange: (value: string | undefined) => void;
  equipments?: Array<{ id: string; name: string }>;
}

interface MaterialFilterBarProps extends BaseFilterBarProps {
  type: 'MATERIAL';
  unitOfMeasureId?: string;
  onUnitOfMeasureIdChange: (value: string | undefined) => void;
  unitsOfMeasure?: Array<{ id: string; name: string; abbreviation: string }>;
  isHazardous?: boolean | undefined;
  onIsHazardousChange: (value: boolean | undefined) => void;
}

export type ProductFilterBarProps =
  | EquipmentFilterBarProps
  | SparePartFilterBarProps
  | MaterialFilterBarProps;

/**
 * Componente de filtros reutilizable para productos
 * Adaptable según el tipo de producto (Equipment, SparePart, Material)
 */
export function ProductFilterBar(props: ProductFilterBarProps) {
  const {
    search = '',
    onSearchChange,
    isActive,
    onIsActiveChange,
    currencyId,
    onCurrencyIdChange,
    currencies = [],
    debounceMs = 400,
  } = props;

  // Debounce para el search
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localSearch, search, onSearchChange, debounceMs]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search (común para todos) */}
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="search">Búsqueda</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Buscar por nombre, modelo o descripción..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Estado activo (común para todos) */}
          <div className="space-y-2">
            <Label htmlFor="isActive">Estado</Label>
            <Select
              value={
                isActive === undefined
                  ? 'all'
                  : isActive
                  ? 'active'
                  : 'inactive'
              }
              onValueChange={(value) => {
                if (value === 'all') {
                  onIsActiveChange(undefined);
                } else {
                  onIsActiveChange(value === 'active');
                }
              }}
            >
              <SelectTrigger id="isActive">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Moneda (común para todos) */}
          <div className="space-y-2">
            <Label htmlFor="currency">Moneda</Label>
            <Select
              value={currencyId || 'all'}
              onValueChange={(value) => {
                onCurrencyIdChange(value === 'all' ? undefined : value);
              }}
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {currencies.map((currency) => (
                  <SelectItem key={currency.id} value={currency.id}>
                    {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtros específicos de Spare Parts */}
          {props.type === 'SPARE_PART' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={props.category || 'all'}
                  onValueChange={(value) => {
                    props.onCategoryChange(
                      value === 'all'
                        ? undefined
                        : (value as 'COMPONENT' | 'SPARE')
                    );
                  }}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="COMPONENT">Componente</SelectItem>
                    <SelectItem value="SPARE">Repuesto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment">Equipo</Label>
                <Select
                  value={props.equipmentId || 'all'}
                  onValueChange={(value) => {
                    props.onEquipmentIdChange(
                      value === 'all' ? undefined : value
                    );
                  }}
                >
                  <SelectTrigger id="equipment">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {props.equipments?.map((equipment) => (
                      <SelectItem key={equipment.id} value={equipment.id}>
                        {equipment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Filtros específicos de Materials */}
          {props.type === 'MATERIAL' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="unitOfMeasure">Unidad de Medida</Label>
                <Select
                  value={props.unitOfMeasureId || 'all'}
                  onValueChange={(value) => {
                    props.onUnitOfMeasureIdChange(
                      value === 'all' ? undefined : value
                    );
                  }}
                >
                  <SelectTrigger id="unitOfMeasure">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {props.unitsOfMeasure?.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name} ({unit.abbreviation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="isHazardous">Peligrosidad</Label>
                <Select
                  value={
                    props.isHazardous === undefined
                      ? 'all'
                      : props.isHazardous
                      ? 'hazardous'
                      : 'non-hazardous'
                  }
                  onValueChange={(value) => {
                    if (value === 'all') {
                      props.onIsHazardousChange(undefined);
                    } else {
                      props.onIsHazardousChange(value === 'hazardous');
                    }
                  }}
                >
                  <SelectTrigger id="isHazardous">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="hazardous">Peligrosos</SelectItem>
                    <SelectItem value="non-hazardous">No peligrosos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
