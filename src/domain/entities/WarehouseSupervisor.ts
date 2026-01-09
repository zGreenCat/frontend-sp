/**
 * Representa un supervisor asignado a una bodega
 * Datos obtenidos desde GET /warehouses/{warehouseId}/supervisors
 */
export interface WarehouseSupervisor {
  id: string; // ID del usuario
  fullName: string; // Nombre completo del supervisor
  email: string; // Email del supervisor
  role: string; // Rol del supervisor (ej: "SUPERVISOR", "MANAGER")
  assignedAt: string; // Fecha ISO de asignación
  assignmentId?: string; // ID de la asignación (para revocación)
  phoneNumber?: string; // Teléfono (opcional)
  status?: string; // Estado del usuario (ACTIVO/INACTIVO)
}
