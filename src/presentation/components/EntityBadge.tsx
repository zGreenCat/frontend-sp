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
  
  // User roles
  ADMIN: { label: "Admin", className: "bg-primary text-primary-foreground" },
  JEFE: { label: "Jefe", className: "bg-accent text-accent-foreground" },
  SUPERVISOR: { label: "Supervisor", className: "bg-secondary text-secondary-foreground" },
  
  // Product types
  EQUIPO: { label: "Equipo", className: "bg-primary text-primary-foreground" },
  MATERIAL: { label: "Material", className: "bg-accent text-accent-foreground" },
  REPUESTO: { label: "Repuesto", className: "bg-secondary text-secondary-foreground" },
  
  // Box types
  ESTANDAR: { label: "Estándar", className: "bg-secondary text-secondary-foreground" },
  ESPECIAL: { label: "Especial", className: "bg-primary text-primary-foreground" },
  REFRIGERADO: { label: "Refrigerado", className: "bg-accent text-accent-foreground" },
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
