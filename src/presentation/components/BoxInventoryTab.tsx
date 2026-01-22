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
        description: `El equipo "${removeEquipmentDialog.equipment.name}" ha sido removido del inventario.`,
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
        description: `El material "${removeMaterialDialog.material.name}" ha sido removido del inventario.`,
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
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Moneda</TableHead>
                  <TableHead>Estado</TableHead>
                  {canEdit && <TableHead className="text-center">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {box.equipments!.map((equipment) => (
                  <TableRow key={equipment.id}>
                    <TableCell className="font-medium">{equipment.name}</TableCell>
                    <TableCell>{equipment.model}</TableCell>
                    <TableCell className="text-center">{equipment.quantity}</TableCell>
                    <TableCell className="text-right">
                      {equipment.monetaryValue
                        ? equipment.monetaryValue.toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell>{equipment.currency || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={equipment.isActive ? "default" : "secondary"}>
                        {equipment.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setRemoveEquipmentDialog({ open: true, equipment })
                          }
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
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
                  <TableHead className="text-center">Peligroso</TableHead>
                  <TableHead>Categorías</TableHead>
                  <TableHead>Estado</TableHead>
                  {canEdit && <TableHead className="text-center">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {box.materials!.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell className="text-center">{material.quantity}</TableCell>
                    <TableCell>{material.unitOfMeasure}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={material.isHazardous ? "destructive" : "secondary"}>
                        {material.isHazardous ? "Sí" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {material.categories && material.categories.length > 0
                        ? material.categories.join(", ")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={material.isActive ? "default" : "secondary"}>
                        {material.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setRemoveMaterialDialog({ open: true, material })
                          }
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
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
              <strong>{removeEquipmentDialog.equipment?.name}</strong> de esta caja.
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
              <strong>{removeMaterialDialog.material?.name}</strong> de esta caja.
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
