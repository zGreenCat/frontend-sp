"use client";

import { Box } from "@/domain/entities/Box";
import { BoxEquipment } from "@/domain/entities/BoxEquipment";
import { BoxMaterial } from "@/domain/entities/BoxMaterial";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/presentation/components/EmptyState";
import { useRemoveBoxEquipment, useRemoveBoxMaterial } from "@/hooks/useBoxInventory";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Package } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BoxInventoryTabProps {
  box: Box;
}

export function BoxInventoryTab({ box }: BoxInventoryTabProps) {
  const { can } = usePermissions();
  const { toast } = useToast();
  const router = useRouter();
  const removeEquipmentMutation = useRemoveBoxEquipment();
  const removeMaterialMutation = useRemoveBoxMaterial();

  const [removeEquipmentDialog, setRemoveEquipmentDialog] = useState<{
    open: boolean;
    equipment: BoxEquipment | null;
  }>({ open: false, equipment: null });

  const [removeMaterialDialog, setRemoveMaterialDialog] = useState<{
    open: boolean;
    material: BoxMaterial | null;
  }>({ open: false, material: null });

  const canEdit = can("boxes:edit");

  const hasEquipments = box.equipments && box.equipments.length > 0;
  const hasMaterials = box.materials && box.materials.length > 0;
  const hasInventory = hasEquipments || hasMaterials;

  const handleRemoveEquipment = async () => {
    if (!removeEquipmentDialog.equipment) return;

    try {
      await removeEquipmentMutation.mutateAsync({
        boxId: box.id,
        assignmentId: removeEquipmentDialog.equipment.id,
      });

      toast({
        title: "✅ Equipo removido",
        description: `El equipo "${removeEquipmentDialog.equipment.equipment.name}" ha sido removido del inventario.`,
      });

      setRemoveEquipmentDialog({ open: false, equipment: null });
    } catch (error: any) {
      toast({
        title: "❌ Error al remover equipo",
        description: error?.message || "No se pudo remover el equipo.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMaterial = async () => {
    if (!removeMaterialDialog.material) return;

    try {
      await removeMaterialMutation.mutateAsync({
        boxId: box.id,
        assignmentId: removeMaterialDialog.material.id,
      });

      toast({
        title: "✅ Material removido",
        description: `El material "${removeMaterialDialog.material.material.name}" ha sido removido del inventario.`,
      });

      setRemoveMaterialDialog({ open: false, material: null });
    } catch (error: any) {
      toast({
        title: "❌ Error al remover material",
        description: error?.message || "No se pudo remover el material.",
        variant: "destructive",
      });
    }
  };

  if (!hasInventory) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState message="Esta caja no tiene inventario asignado todavía" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sección: Equipos */}
      {hasEquipments && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Equipos ({box.equipments!.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  <TableHead>Dimensiones</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Estado</TableHead>
                  {canEdit && <TableHead className="text-center">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {box.equipments!.map((equipmentAssignment) => {
                  const eq = equipmentAssignment.equipment;
                  const dims = eq.dimensions;
                  return (
                    <TableRow key={equipmentAssignment.id}>
                      <TableCell className="font-medium">
                        <button
                          onClick={() => router.push(`/products/equipment/${eq.id}`)}
                          className="text-primary hover:underline text-left"
                        >
                          {eq.name}
                        </button>
                      </TableCell>
                      <TableCell>{eq.model || "-"}</TableCell>
                      <TableCell className="text-center">{equipmentAssignment.quantity}</TableCell>
                      <TableCell>
                        {dims && (
                          <div className="text-sm space-y-1">
                            {dims.weight && (
                              <div>Peso: {dims.weight.value} {dims.weight.unit.abbreviation}</div>
                            )}
                            {(dims.width || dims.height || dims.length) && (
                              <div>
                                {dims.width?.value || '-'} × {dims.height?.value || '-'} × {dims.length?.value || '-'} {dims.width?.unit.abbreviation || ''}
                              </div>
                            )}
                          </div>
                        )}
                        {!dims && "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {eq.price ? (
                          <div>
                            {eq.price.currency.symbol}{eq.price.amount.toLocaleString('es-CL')}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={eq.status.isActive ? "default" : "secondary"}>
                          {eq.status.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setRemoveEquipmentDialog({ open: true, equipment: equipmentAssignment })
                            }
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Sección: Materiales */}
      {hasMaterials && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Materiales ({box.materials!.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-center">Peligroso</TableHead>
                  <TableHead>Categorías</TableHead>
                  <TableHead>Estado</TableHead>
                  {canEdit && <TableHead className="text-center">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {box.materials!.map((materialAssignment) => {
                  const mat = materialAssignment.material;
                  return (
                    <TableRow key={materialAssignment.id}>
                      <TableCell className="font-medium">
                        <button
                          onClick={() => router.push(`/products/material/${mat.id}`)}
                          className="text-primary hover:underline text-left"
                        >
                          {mat.name}
                        </button>
                      </TableCell>
                      <TableCell className="text-center">{materialAssignment.quantity}</TableCell>
                      <TableCell>{mat.unitOfMeasure?.abbreviation || mat.unitOfMeasure?.name || "-"}</TableCell>
                      <TableCell className="text-right">
                        {mat.price ? (
                          <div>
                            {mat.price.currency.symbol}{mat.price.amount.toLocaleString('es-CL')}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={mat.flags.isHazardous ? "destructive" : "secondary"}>
                          {mat.flags.isHazardous ? "Sí" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {mat.categories && mat.categories.length > 0
                          ? mat.categories.map(c => c.name).join(", ")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={mat.flags.isActive ? "default" : "secondary"}>
                          {mat.flags.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setRemoveMaterialDialog({ open: true, material: materialAssignment })
                            }
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog: Confirmar remover equipo */}
      <AlertDialog
        open={removeEquipmentDialog.open}
        onOpenChange={(open) =>
          setRemoveEquipmentDialog({ open, equipment: removeEquipmentDialog.equipment })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Remover equipo del inventario?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de remover el equipo{" "}
              <strong>{removeEquipmentDialog.equipment?.equipment.name}</strong> de esta caja.
              Esta acción quedará registrada en el historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveEquipment}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Confirmar remover material */}
      <AlertDialog
        open={removeMaterialDialog.open}
        onOpenChange={(open) =>
          setRemoveMaterialDialog({ open, material: removeMaterialDialog.material })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Remover material del inventario?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de remover el material{" "}
              <strong>{removeMaterialDialog.material?.material.name}</strong> de esta caja.
              Esta acción quedará registrada en el historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMaterial}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
