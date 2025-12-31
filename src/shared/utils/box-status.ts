/**
 * Utilidades para estados de Box (Caja)
 * Centraliza labels y estilos para mantener consistencia visual
 */

import { BoxStatus } from "@/domain/entities/Box";

/**
 * Mapeo de estados a etiquetas legibles
 */
export const BOX_STATUS_LABEL: Record<BoxStatus, string> = {
  DISPONIBLE: "Disponible",
  EN_REPARACION: "En reparación",
  DANADA: "Dañada",
  RETIRADA: "Retirada",
};

/**
 * Mapeo de estados a clases de Tailwind para badges
 * Sigue la paleta visual del proyecto:
 * - DISPONIBLE: Verde (lista para uso)
 * - EN_REPARACION: Amarillo/ámbar (en mantenimiento)
 * - DANADA: Rojo (no funcional)
 * - RETIRADA: Gris (fuera de servicio)
 */
export const BOX_STATUS_CLASS: Record<BoxStatus, string> = {
  DISPONIBLE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  EN_REPARACION: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  DANADA: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  RETIRADA: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

/**
 * Obtener label del estado con fallback
 */
export const getBoxStatusLabel = (status: BoxStatus): string => {
  return BOX_STATUS_LABEL[status] ?? status;
};

/**
 * Obtener clases CSS del estado con fallback
 */
export const getBoxStatusClass = (status: BoxStatus): string => {
  return BOX_STATUS_CLASS[status] ?? "bg-slate-100 text-slate-700";
};
