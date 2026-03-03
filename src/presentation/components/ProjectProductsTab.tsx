"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Trash2, Pencil, Check, X, Plus } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { EmptyState } from "@/presentation/components/EmptyState";
import { useToast } from "@/hooks/use-toast";

import {
  useProjectEquipments,
  useAssignProjectEquipment,
  useUpdateProjectEquipmentQty,
  useRemoveProjectEquipment,
  useProjectSpareParts,
  useAssignProjectSparePart,
  useUpdateProjectSparePartQty,
  useRemoveProjectSparePart,
  useProjectMaterials,
  useAssignProjectMaterial,
  useUpdateProjectMaterialQty,
  useRemoveProjectMaterial,
} from "@/hooks/useProjectProducts";

import { useEquipments, useSpareParts, useMaterials } from "@/hooks/useProducts";

import {
  ProjectEquipmentAssignment,
  ProjectSparePartAssignment,
  ProjectMaterialAssignment,
} from "@/domain/repositories/IProjectRepository";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const intQtySchema = z.object({
  productId: z.string().min(1, "Selecciona un ítem"),
  quantity: z
    .string()
    .min(1, "Requerido")
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1, {
      message: "Debe ser un entero ≥ 1",
    }),
});

const decimalQtySchema = z.object({
  productId: z.string().min(1, "Selecciona un ítem"),
  quantity: z
    .string()
    .min(1, "Requerido")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      message: "Debe ser un número > 0",
    }),
});

const editIntSchema = z.object({
  quantity: z
    .string()
    .min(1, "Requerido")
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1, {
      message: "Entero ≥ 1",
    }),
});

const editDecimalSchema = z.object({
  quantity: z
    .string()
    .min(1, "Requerido")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      message: "> 0",
    }),
});

type AssignFormValues = z.infer<typeof intQtySchema>;
type EditFormValues = z.infer<typeof editIntSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function duplicateMessage(err: unknown): string | null {
  const e = err as any;
  if (e?.message === "DUPLICATE") return "Este ítem ya está asignado al proyecto.";
  return null;
}

function formatQty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/\.?0+$/, "");
}

// ─── Inline edit row ──────────────────────────────────────────────────────────

interface EditRowProps {
  currentQty: number;
  isDecimal?: boolean;
  onSave: (qty: number) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

function EditQtyRow({ currentQty, isDecimal, onSave, onCancel, isSaving }: EditRowProps) {
  const schema = isDecimal ? editDecimalSchema : editIntSchema;
  const form = useForm<EditFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: String(currentQty) },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSave(isDecimal ? parseFloat(data.quantity) : parseInt(data.quantity));
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step={isDecimal ? "0.001" : "1"}
                  min={isDecimal ? "0.001" : "1"}
                  className="h-8 w-24"
                  autoFocus
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <Button type="submit" size="icon" variant="ghost" className="h-8 w-8 text-green-600" disabled={isSaving}>
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        </Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={onCancel} disabled={isSaving}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </form>
    </Form>
  );
}

// ─── Generic assignment table ─────────────────────────────────────────────────

interface AssignmentRow {
  id: string; // equipmentId / sparePartId / materialId
  code?: string;
  name?: string;
  quantity: number;
  unitPrice?: number;
  subtotal?: number;
}

interface AssignmentTableProps {
  rows: AssignmentRow[];
  isLoading: boolean;
  isDecimal?: boolean;
  onEditSave: (id: string, qty: number) => Promise<void>;
  onDelete: (id: string, label: string) => void;
  isUpdating: boolean;
}

function AssignmentTable({ rows, isLoading, isDecimal, onEditSave, onDelete, isUpdating }: AssignmentTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2 mt-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="py-6">
        <EmptyState message="No hay ítems asignados en esta categoría." />
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-md border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Código</th>
            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Nombre</th>
            <th className="px-4 py-2 text-right font-medium text-muted-foreground">Cantidad</th>
            {rows.some((r) => r.unitPrice != null) && (
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Subtotal</th>
            )}
            <th className="px-4 py-2 text-right font-medium text-muted-foreground">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                {row.code ?? "—"}
              </td>
              <td className="px-4 py-2 text-foreground">{row.name ?? row.id}</td>
              <td className="px-4 py-2 text-right">
                {editingId === row.id ? (
                  <EditQtyRow
                    currentQty={row.quantity}
                    isDecimal={isDecimal}
                    isSaving={isUpdating}
                    onSave={async (qty) => {
                      await onEditSave(row.id, qty);
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <Badge variant="secondary" className="font-mono">
                    {formatQty(row.quantity)}
                  </Badge>
                )}
              </td>
              {rows.some((r) => r.unitPrice != null) && (
                <td className="px-4 py-2 text-right text-muted-foreground text-xs">
                  {row.subtotal != null ? `$${row.subtotal.toLocaleString("es-CL")}` : "—"}
                </td>
              )}
              <td className="px-4 py-2">
                <div className="flex items-center justify-end gap-1">
                  {editingId !== row.id && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => setEditingId(row.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-red-600"
                    onClick={() => onDelete(row.id, row.name ?? row.code ?? row.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Assign form ──────────────────────────────────────────────────────────────

interface SelectOption { value: string; label: string }

interface AssignFormProps {
  options: SelectOption[];
  isLoadingOptions: boolean;
  isDecimal?: boolean;
  isAssigning: boolean;
  duplicateError: string | null;
  onAssign: (productId: string, quantity: number) => Promise<void>;
  onClearDuplicate: () => void;
}

function AssignForm({
  options,
  isLoadingOptions,
  isDecimal,
  isAssigning,
  duplicateError,
  onAssign,
  onClearDuplicate,
}: AssignFormProps) {
  const schema = isDecimal ? decimalQtySchema : intQtySchema;
  const form = useForm<AssignFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { productId: "", quantity: "" },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onAssign(
      data.productId,
      isDecimal ? parseFloat(data.quantity) : parseInt(data.quantity)
    );
    form.reset();
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end rounded-lg border bg-muted/30 p-4">
        {/* Select de producto */}
        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem className="flex-1 min-w-[200px]">
              <FormLabel className="text-xs font-medium">Ítem</FormLabel>
              <Select
                onValueChange={(val) => {
                  field.onChange(val);
                  onClearDuplicate();
                }}
                value={field.value}
                disabled={isLoadingOptions || isAssigning}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingOptions ? "Cargando…" : "Seleccionar…"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
              {duplicateError && (
                <p className="text-xs text-destructive mt-1">{duplicateError}</p>
              )}
            </FormItem>
          )}
        />

        {/* Input cantidad */}
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem className="w-28">
              <FormLabel className="text-xs font-medium">Cantidad</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step={isDecimal ? "0.001" : "1"}
                  min={isDecimal ? "0.001" : "1"}
                  placeholder={isDecimal ? "0.000" : "1"}
                  disabled={isAssigning}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isAssigning || isLoadingOptions} className="gap-1.5 self-end">
          {isAssigning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Asignar
        </Button>
      </form>
    </Form>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ProjectProductsTabProps {
  projectId: string;
  projectStatus: string;
}

export function ProjectProductsTab({ projectId, projectStatus }: ProjectProductsTabProps) {
  const { toast } = useToast();
  const isReadonly = projectStatus === "FINALIZADO";

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: equipments = [], isLoading: loadingEquipments } = useProjectEquipments(projectId);
  const { data: spareParts = [], isLoading: loadingSpareParts } = useProjectSpareParts(projectId);
  const { data: materials = [], isLoading: loadingMaterials } = useProjectMaterials(projectId);

  // Catálogos para selectors
  const { data: equipmentCatalog } = useEquipments({ limit: 200 });
  const { data: sparePartCatalog } = useSpareParts({ limit: 200 });
  const { data: materialCatalog } = useMaterials({ limit: 200 });

  // ── Mutations ────────────────────────────────────────────────────────────
  const assignEquipment = useAssignProjectEquipment();
  const updateEquipmentQty = useUpdateProjectEquipmentQty();
  const removeEquipment = useRemoveProjectEquipment();

  const assignSparePart = useAssignProjectSparePart();
  const updateSparePartQty = useUpdateProjectSparePartQty();
  const removeSparePart = useRemoveProjectSparePart();

  const assignMaterial = useAssignProjectMaterial();
  const updateMaterialQty = useUpdateProjectMaterialQty();
  const removeMaterial = useRemoveProjectMaterial();

  // ── Duplicate errors ─────────────────────────────────────────────────────
  const [dupErrorEq, setDupErrorEq] = useState<string | null>(null);
  const [dupErrorSp, setDupErrorSp] = useState<string | null>(null);
  const [dupErrorMat, setDupErrorMat] = useState<string | null>(null);

  // ── Confirm delete modal ─────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<{
    category: "equipment" | "sparePart" | "material";
    id: string;
    label: string;
  } | null>(null);

  // ── Options ──────────────────────────────────────────────────────────────
  const equipmentOptions: SelectOption[] = (equipmentCatalog?.data ?? []).map((p) => ({
    value: p.id,
    label: [p.sku, p.name].filter(Boolean).join(" – "),
  }));

  const sparePartOptions: SelectOption[] = (sparePartCatalog?.data ?? []).map((p) => ({
    value: p.id,
    label: [p.sku, p.name].filter(Boolean).join(" – "),
  }));

  const materialOptions: SelectOption[] = (materialCatalog?.data ?? []).map((p) => ({
    value: p.id,
    label: [p.sku, p.name].filter(Boolean).join(" – "),
  }));

  // ── Helpers ──────────────────────────────────────────────────────────────
  const toEquipmentRow = (a: ProjectEquipmentAssignment): AssignmentRow => ({
    id: a.equipmentId, code: a.code, name: a.name, quantity: a.quantity,
    unitPrice: a.unitPrice, subtotal: a.subtotal,
  });
  const toSparePartRow = (a: ProjectSparePartAssignment): AssignmentRow => ({
    id: a.sparePartId, code: a.code, name: a.name, quantity: a.quantity,
    unitPrice: a.unitPrice, subtotal: a.subtotal,
  });
  const toMaterialRow = (a: ProjectMaterialAssignment): AssignmentRow => ({
    id: a.materialId, code: a.code, name: a.name, quantity: a.quantity,
    unitPrice: a.unitPrice, subtotal: a.subtotal,
  });

  // ── Assign handlers ───────────────────────────────────────────────────────

  const handleAssignEquipment = async (productId: string, quantity: number) => {
    setDupErrorEq(null);
    try {
      await assignEquipment.mutateAsync({ projectId, dto: { equipmentId: productId, quantity } });
      toast({ title: "✅ Equipo asignado" });
    } catch (err: any) {
      const dup = duplicateMessage(err);
      if (dup) { setDupErrorEq(dup); return; }
      toast({ title: "Error al asignar equipo", description: err?.message, variant: "destructive" });
    }
  };

  const handleAssignSparePart = async (productId: string, quantity: number) => {
    setDupErrorSp(null);
    try {
      await assignSparePart.mutateAsync({ projectId, dto: { sparePartId: productId, quantity } });
      toast({ title: "✅ Repuesto asignado" });
    } catch (err: any) {
      const dup = duplicateMessage(err);
      if (dup) { setDupErrorSp(dup); return; }
      toast({ title: "Error al asignar repuesto", description: err?.message, variant: "destructive" });
    }
  };

  const handleAssignMaterial = async (productId: string, quantity: number) => {
    setDupErrorMat(null);
    try {
      await assignMaterial.mutateAsync({ projectId, dto: { materialId: productId, quantity } });
      toast({ title: "✅ Material asignado" });
    } catch (err: any) {
      const dup = duplicateMessage(err);
      if (dup) { setDupErrorMat(dup); return; }
      toast({ title: "Error al asignar material", description: err?.message, variant: "destructive" });
    }
  };

  // ── Update handlers ───────────────────────────────────────────────────────

  const handleUpdateEquipment = async (equipmentId: string, quantity: number) => {
    await updateEquipmentQty.mutateAsync({ projectId, equipmentId, dto: { quantity } });
    toast({ title: "✅ Cantidad actualizada" });
  };

  const handleUpdateSparePart = async (sparePartId: string, quantity: number) => {
    await updateSparePartQty.mutateAsync({ projectId, sparePartId, dto: { quantity } });
    toast({ title: "✅ Cantidad actualizada" });
  };

  const handleUpdateMaterial = async (materialId: string, quantity: number) => {
    await updateMaterialQty.mutateAsync({ projectId, materialId, dto: { quantity } });
    toast({ title: "✅ Cantidad actualizada" });
  };

  // ── Delete confirm ────────────────────────────────────────────────────────

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { category, id } = deleteTarget;
    try {
      if (category === "equipment") {
        await removeEquipment.mutateAsync({ projectId, equipmentId: id });
      } else if (category === "sparePart") {
        await removeSparePart.mutateAsync({ projectId, sparePartId: id });
      } else {
        await removeMaterial.mutateAsync({ projectId, materialId: id });
      }
      toast({ title: "✅ Ítem eliminado" });
    } catch (err: any) {
      toast({ title: "Error al eliminar", description: err?.message, variant: "destructive" });
    } finally {
      setDeleteTarget(null);
    }
  };

  const isDeleting =
    removeEquipment.isPending || removeSparePart.isPending || removeMaterial.isPending;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <Tabs defaultValue="equipments" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="equipments">
            Equipos
            {equipments.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-xs">
                {equipments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="spare-parts">
            Repuestos
            {spareParts.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-xs">
                {spareParts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="materials">
            Materiales
            {materials.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-xs">
                {materials.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Equipos ────────────────────────────────────────────────────── */}
        <TabsContent value="equipments" className="space-y-4">
          {!isReadonly && (
            <AssignForm
              options={equipmentOptions}
              isLoadingOptions={!equipmentCatalog}
              isDecimal={false}
              isAssigning={assignEquipment.isPending}
              duplicateError={dupErrorEq}
              onAssign={handleAssignEquipment}
              onClearDuplicate={() => setDupErrorEq(null)}
            />
          )}
          <AssignmentTable
            rows={equipments.map(toEquipmentRow)}
            isLoading={loadingEquipments}
            isDecimal={false}
            onEditSave={handleUpdateEquipment}
            onDelete={(id, label) => setDeleteTarget({ category: "equipment", id, label })}
            isUpdating={updateEquipmentQty.isPending}
          />
        </TabsContent>

        {/* ── Repuestos ───────────────────────────────────────────────────── */}
        <TabsContent value="spare-parts" className="space-y-4">
          {!isReadonly && (
            <AssignForm
              options={sparePartOptions}
              isLoadingOptions={!sparePartCatalog}
              isDecimal={false}
              isAssigning={assignSparePart.isPending}
              duplicateError={dupErrorSp}
              onAssign={handleAssignSparePart}
              onClearDuplicate={() => setDupErrorSp(null)}
            />
          )}
          <AssignmentTable
            rows={spareParts.map(toSparePartRow)}
            isLoading={loadingSpareParts}
            isDecimal={false}
            onEditSave={handleUpdateSparePart}
            onDelete={(id, label) => setDeleteTarget({ category: "sparePart", id, label })}
            isUpdating={updateSparePartQty.isPending}
          />
        </TabsContent>

        {/* ── Materiales ──────────────────────────────────────────────────── */}
        <TabsContent value="materials" className="space-y-4">
          {!isReadonly && (
            <AssignForm
              options={materialOptions}
              isLoadingOptions={!materialCatalog}
              isDecimal={true}
              isAssigning={assignMaterial.isPending}
              duplicateError={dupErrorMat}
              onAssign={handleAssignMaterial}
              onClearDuplicate={() => setDupErrorMat(null)}
            />
          )}
          <AssignmentTable
            rows={materials.map(toMaterialRow)}
            isLoading={loadingMaterials}
            isDecimal={true}
            onEditSave={handleUpdateMaterial}
            onDelete={(id, label) => setDeleteTarget({ category: "material", id, label })}
            isUpdating={updateMaterialQty.isPending}
          />
        </TabsContent>
      </Tabs>

      {/* ── Confirm delete modal ──────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar asignación?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará{" "}
              <span className="font-semibold text-foreground">
                "{deleteTarget?.label}"
              </span>{" "}
              de este proyecto. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirmDelete(); }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Eliminando…</>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
