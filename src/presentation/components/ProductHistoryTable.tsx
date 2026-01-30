"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
} from "lucide-react";
import { ProductHistoryEvent, ProductHistoryEventType } from "@/domain/entities/ProductHistory";

interface ProductHistoryTableProps {
  events: ProductHistoryEvent[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onExportCsv?: () => void; // Opcional
}

/**
 * Mapea el tipo de evento a un color de badge
 */
function getEventTypeBadgeVariant(eventType: ProductHistoryEventType): "default" | "secondary" | "destructive" | "outline" {
  switch (eventType) {
    case 'CREATED':
      return 'default';
    case 'UPDATED':
    case 'MODEL_CHANGED':
    case 'DESCRIPTION_CHANGED':
      return 'secondary';
    case 'DEACTIVATED':
      return 'destructive';
    case 'REACTIVATED':
      return 'default';
    case 'PRICE_CHANGED':
    case 'CURRENCY_CHANGED':
      return 'outline';
    case 'UNIT_CHANGED':
      return 'secondary';
    default:
      return 'outline';
  }
}

/**
 * Mapea el tipo de evento a un texto legible
 */
function getEventTypeLabel(eventType: ProductHistoryEventType): string {
  switch (eventType) {
    case 'CREATED':
      return 'Creado';
    case 'UPDATED':
      return 'Actualizado';
    case 'DEACTIVATED':
      return 'Dado de baja';
    case 'REACTIVATED':
      return 'Reactivado';
    case 'PRICE_CHANGED':
      return 'Cambio de precio';
    case 'UNIT_CHANGED':
      return 'Cambio de unidad';
    case 'MODEL_CHANGED':
      return 'Cambio de modelo';
    case 'DESCRIPTION_CHANGED':
      return 'Cambio de descripción';
    case 'CURRENCY_CHANGED':
      return 'Cambio de moneda';
    case 'OTHER':
      return 'Otro';
    default:
      return eventType;
  }
}

/**
 * Genera un resumen del cambio basado en previousValue y newValue
 */
function generateChangeSummary(event: ProductHistoryEvent): string {
  const { previousValue, newValue, eventType } = event;

  // Si no hay valores, mostrar solo el tipo de evento
  if (!previousValue && !newValue) {
    return getEventTypeLabel(eventType);
  }

  // Si solo hay newValue (creación)
  if (!previousValue && newValue) {
    return 'Producto creado';
  }

  // Si hay ambos valores, intentar generar un resumen
  if (previousValue && newValue) {
    const changes: string[] = [];

    // Comparar campos comunes
    if (previousValue.name !== newValue.name) {
      changes.push(`nombre: "${previousValue.name}" → "${newValue.name}"`);
    }
    if (previousValue.model !== newValue.model) {
      changes.push(`modelo: "${previousValue.model}" → "${newValue.model}"`);
    }
    if (previousValue.currency !== newValue.currency) {
      changes.push(`moneda: ${previousValue.currency} → ${newValue.currency}`);
    }
    if (previousValue.unitOfMeasure !== newValue.unitOfMeasure) {
      changes.push(`unidad: ${previousValue.unitOfMeasure} → ${newValue.unitOfMeasure}`);
    }
    if (previousValue.isActive !== newValue.isActive) {
      const status = newValue.isActive ? 'Activo' : 'Inactivo';
      changes.push(`estado: ${status}`);
    }
    if (previousValue.monetaryValue !== newValue.monetaryValue) {
      changes.push(`costo: ${previousValue.monetaryValue} → ${newValue.monetaryValue}`);
    }

    return changes.length > 0 ? changes.join(', ') : 'Cambios registrados';
  }

  return 'Sin detalles';
}

export function ProductHistoryTable({
  events,
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onExportCsv,
}: ProductHistoryTableProps) {
  const showPagination = totalPages > 1;

  return (
    <div className="space-y-4">
      {/* Botón de exportar (opcional) */}
      {onExportCsv && events.length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onExportCsv} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      )}

      {/* Tabla */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha y Hora</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Tipo de Evento</TableHead>
              <TableHead>Cambios</TableHead>
              <TableHead>Justificación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hay eventos históricos para este producto</p>
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-mono text-sm">
                    {format(new Date(event.performedAt), "dd MMM yyyy HH:mm", { locale: es })}
                  </TableCell>
                  <TableCell>
                    {event.performedBy ? (
                      <div className="space-y-0.5">
                        <p className="font-medium text-sm">{event.performedBy.name}</p>
                        <p className="text-xs text-muted-foreground">{event.performedBy.email}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic text-sm">Sistema</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getEventTypeBadgeVariant(event.eventType)}>
                      {getEventTypeLabel(event.eventType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-sm truncate" title={generateChangeSummary(event)}>
                      {generateChangeSummary(event)}
                    </p>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {event.justification ? (
                      <p className="text-sm text-muted-foreground truncate" title={event.justification}>
                        {event.justification}
                      </p>
                    ) : (
                      <span className="text-muted-foreground italic text-sm">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {showPagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de {total} eventos
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
