import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EntityBadgeProps {
  status: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // User status
  HABILITADO: { label: "Habilitado", className: "bg-success text-success-foreground" },
  DESHABILITADO: { label: "Deshabilitado", className: "bg-destructive text-destructive-foreground" },
  
  // General status
  ACTIVO: { label: "Activo", className: "bg-success text-success-foreground" },
  INACTIVO: { label: "Inactivo", className: "bg-muted text-muted-foreground" },
  EN_USO: { label: "En Uso", className: "bg-primary text-primary-foreground" },
  FINALIZADO: { label: "Finalizado", className: "bg-secondary text-secondary-foreground" },
  
  // User roles (todos con estilo azul)
  ADMIN: { label: "Admin", className: "bg-primary text-primary-foreground" },
  JEFE: { label: "Jefe de Área", className: "bg-primary text-primary-foreground" },
  JEFE_AREA: { label: "Jefe de Área", className: "bg-primary text-primary-foreground" },
  SUPERVISOR: { label: "Supervisor", className: "bg-primary text-primary-foreground" },
  // Roles del backend mapeados
  AREA_MANAGER: { label: "Jefe de Área", className: "bg-primary text-primary-foreground" },
  WAREHOUSE_SUPERVISOR: { label: "Supervisor", className: "bg-primary text-primary-foreground" },
  
  // Product types
  EQUIPO: { label: "Equipo", className: "bg-primary text-primary-foreground" },
  MATERIAL: { label: "Material", className: "bg-accent text-accent-foreground" },
  REPUESTO: { label: "Repuesto", className: "bg-secondary text-secondary-foreground" },
  
  // Box types
  PEQUEÑA: { label: "Pequeña", className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400" },
  NORMAL: { label: "Normal", className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400" },
  GRANDE: { label: "Grande", className: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400" },
  
  // Box status (estados operativos reales del backend)
  DISPONIBLE: { label: "Disponible", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" },
  EN_REPARACION: { label: "En reparación", className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" },
  DANADA: { label: "Dañada", className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" },
  RETIRADA: { label: "Retirada", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

export function EntityBadge({ status, variant = "default" }: EntityBadgeProps) {
  const config = statusConfig[status] || { label: status, className: "" };

  return (
    <Badge
      variant={variant}
      className={cn("text-xs font-medium", config.className)}
    >
      {config.label}
    </Badge>
  );
}
