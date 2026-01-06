/**
 * BoxesTable - Tabla de cajas para vista desktop
 * Sigue el patrón de UsersView con responsive design
 * Acciones separadas: Ver detalle, Cambiar estado, Mover bodega, Editar datos
 */

"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, MapPin, TruckIcon, ToggleLeft } from "lucide-react";
import { Box } from "@/domain/entities/Box";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { cn } from "@/lib/utils";

interface BoxesTableProps {
  boxes: Box[];
  canEdit: boolean;
  onViewDetail: (boxId: string) => void;
  onEdit: (box: Box) => void;
  onMove?: (box: Box) => void;
  onChangeStatus?: (box: Box) => void;
}

export function BoxesTable({ boxes, canEdit, onViewDetail, onEdit, onMove, onChangeStatus }: BoxesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
              Código QR
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
              Tipo
            </th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">
              Peso/Contenido
            </th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">
              Estado
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
              Bodega
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {boxes.map((box) => (
            <tr
              key={box.id}
              className={cn(
                "border-b border-border hover:bg-secondary/20 transition-colors",
                (box.status === "DANADA" || box.status === "RETIRADA") && "bg-red-50/50 opacity-70 dark:bg-red-950/20"
              )}
            >
              {/* Código QR */}
              <td className="py-4 px-4">
                <div
                  className="cursor-pointer hover:text-primary transition-colors"
                  onClick={() => onViewDetail(box.id)}
                >
                  <p className="font-mono font-medium text-foreground">
                    {box.qrCode}
                  </p>
                  {box.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {box.description}
                    </p>
                  )}
                </div>
              </td>

              {/* Tipo */}
              <td className="py-4 px-4">
                <EntityBadge status={box.type} />
              </td>

              {/* Peso/Contenido */}
              <td className="py-4 px-4 text-center">
                <p className="text-lg font-bold text-primary">
                  {box.currentWeightKg.toFixed(1)} kg
                </p>
              </td>

              {/* Estado - solo lectura */}
              <td className="py-4 px-4 text-center">
                <EntityBadge status={box.status} />
              </td>

              {/* Bodega - solo información */}
              <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  {box.warehouseName || box.warehouse?.name ? (
                    <span className="text-sm text-foreground font-medium truncate">
                      {box.warehouseName || box.warehouse?.name}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      Sin bodega
                    </span>
                  )}
                </div>
              </td>

              {/* Acciones - Patrón: [Ver] + 3 botones solo-icono */}
              <td className="py-4 px-4">
                <div className="flex items-center justify-end gap-1.5">
                  {/* Botón principal: Ver detalle */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetail(box.id)}
                    className="h-8 gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    Ver
                  </Button>

                  {/* Botones solo-icono (solo si canEdit) */}
                  {canEdit && (
                    <>
                      {/* 1. Cambiar estado */}
                      {onChangeStatus && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onChangeStatus(box)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                          title="Cambiar estado"
                          aria-label="Cambiar estado de la caja"
                        >
                          <ToggleLeft className="h-4 w-4" />
                        </Button>
                      )}

                      {/* 2. Mover bodega */}
                      {onMove && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onMove(box)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                          title="Mover a otra bodega"
                          aria-label="Mover caja a otra bodega"
                        >
                          <TruckIcon className="h-4 w-4" />
                        </Button>
                      )}

                      {/* 3. Editar datos maestros */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(box)}
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                        title="Editar datos de la caja"
                        aria-label="Editar datos maestros de la caja"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
