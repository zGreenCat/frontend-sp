// domain/repositories/IAssignmentRepository.ts
import { Assignment } from '@/domain/entities/Assignment';

export interface IAssignmentRepository {
  // Lecturas genéricas (por si las necesitas después)
  findByUser(userId: string): Promise<Assignment[]>;
  findByArea(areaId: string): Promise<Assignment[]>;
  findByWarehouse(warehouseId: string): Promise<Assignment[]>;

  // Comandos específicos que ya usas
  assignManagerToArea(areaId: string, managerId: string): Promise<void>;
  assignWarehouseToArea(areaId: string, warehouseId: string): Promise<void>
  assignSupervisorToWarehouse(warehouseId: string, supervisorId: string): Promise<void>;
  
  // ⚠️ DEPRECATED: Use removeAssignment(assignmentId) instead
  // These methods are kept for backward compatibility but will do a GET before DELETE
  removeSupervisorFromWarehouse(warehouseId: string, supervisorId: string): Promise<void>;
  removeWarehouseFromArea(areaId: string, warehouseId: string): Promise<void>;
  removeManagerFromArea(areaId: string, userId: string): Promise<void>;

  // ✅ NEW: Direct assignment removal using assignmentId (no GET needed)
  removeAssignment(assignmentId: string): Promise<void>;

  // Si quieres modelar directamente el link área–bodega
  getAreaIdFromWarehouse(warehouseId: string): Promise<string | null>;
  hasWarehousesInArea(warehouseIds: string[], areaId: string): Promise<boolean>;
}
