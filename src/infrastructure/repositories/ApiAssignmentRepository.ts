import { IAssignmentRepository } from '@/domain/repositories/IAssignmentRepository';
import { Assignment } from '@/domain/entities/Assignment';
import { apiClient } from '@/infrastructure/api/apiClient';

export class ApiAssignmentRepository implements IAssignmentRepository {
  async findByUser(userId: string): Promise<Assignment[]> {
    const assignments = await apiClient.get<any[]>('/assignments', true);
    return assignments
      .filter(a => a.userId === userId)
      .map(this.mapBackendAssignment);
  }

  async findByArea(areaId: string): Promise<Assignment[]> {
    const assignments = await apiClient.get<any[]>('/assignments', true);
    return assignments
      .filter(a => a.areaId === areaId)
      .map(this.mapBackendAssignment);
  }

  async findByWarehouse(warehouseId: string): Promise<Assignment[]> {
    const assignments = await apiClient.get<any[]>('/assignments', true);
    return assignments
      .filter(a => a.warehouseId === warehouseId)
      .map(this.mapBackendAssignment);
  }

  async assignManagerToArea(areaId: string, managerId: string): Promise<void> {
    await apiClient.post(`/areas/${areaId}/managers`, { managerId }, true);
  }


  async assignWarehouseToArea(areaId: string, warehouseId: string): Promise<void> {
    await apiClient.post(`/areas/${areaId}/warehouses`, { warehouseId }, true);
  }

  /**
   * ✅ NEW: Remove an assignment directly using its ID
   * This is the preferred method as it avoids the GET call to find the assignment
   */
  async removeAssignment(assignmentId: string): Promise<void> {
    await apiClient.delete(`/assignments/${assignmentId}`, true);
  }
 /**
   * ⚠️ DEPRECATED: Use removeAssignment(assignmentId) instead
   * This method does a GET to find the assignment ID, which is inefficient
   * The assignmentId is now available in API responses (managers[].assignmentId)
   */
  async removeManagerFromArea(
    areaId: string,
    userId: string
  ): Promise<void> {
    const response = await apiClient.get<any>("/assignments", true);
    const assignments: any[] = response.data ?? [];
    const assignment = assignments.find(
      (a) =>
        a.userId === userId &&
        a.areaId === areaId &&
        a.isActive === true
    );

    if (!assignment) {
      console.warn(
        `No active assignment found for user ${userId} in area ${areaId}`
      );
      return;
    }

    await apiClient.delete(`/assignments/${assignment.id}`, true);
  }

  async assignSupervisorToWarehouse(warehouseId: string, supervisorId: string): Promise<void> {
    await apiClient.post(`/warehouses/${warehouseId}/supervisors`, { supervisorId }, true);
  }

  /**
   * ⚠️ DEPRECATED: Use removeAssignment(assignmentId) instead
   * This method does a GET to find the assignment ID, which is inefficient
   * The assignmentId is now available in API responses (warehouseAssignments[].id)
   */
  async removeSupervisorFromWarehouse(warehouseId: string, supervisorId: string): Promise<void> {
   
    const response = await apiClient.get<any>("/assignments", true);
    const assignments: any[] = response.data ?? [];
    const assignment = assignments.find(
      (a) =>
        a.userId === supervisorId &&
        a.warehouseId === warehouseId &&
        a.isActive === true
    );

    if (!assignment) {
      console.warn(
        `No active assignment found for supervisor ${supervisorId} in warehouse ${warehouseId}`
      );
      return;
    }

    await apiClient.delete(`/assignments/${assignment.id}`, true);
  }
   /**
   * ⚠️ DEPRECATED: Use removeAssignment(assignmentId) instead
   * This method does a GET to find the assignment ID, which is inefficient
   * The assignmentId is now available in API responses (warehouses[].assignmentId)
   */
  async removeWarehouseFromArea(
    areaId: string,
    warehouseId: string
  ): Promise<void> {
    const response = await apiClient.get<any>("/assignments", true);
    const assignments: any[] = response.data ?? [];
    const assignment = assignments.find(
      (a) =>
        a.warehouseId === warehouseId &&
        a.areaId === areaId &&
        a.isActive === true
    );

    if (!assignment) {
      console.warn(
        `No active assignment found for warehouse ${warehouseId} in area ${areaId}`
      );
      return;
    }

    await apiClient.delete(`/assignments/${assignment.id}`, true);
  }


  async getAreaIdFromWarehouse(warehouseId: string): Promise<string | null> {
    const assignments = await apiClient.get<any[]>('/assignments', true);
    const a = assignments.find(x =>
      x.type === 'AREA_WAREHOUSE' &&
      x.warehouseId === warehouseId &&
      x.isActive === true
    );
    return a?.areaId || null;
  }

  async hasWarehousesInArea(warehouseIds: string[], areaId: string): Promise<boolean> {
    if (warehouseIds.length === 0) return false;

    const assignments = await apiClient.get<any[]>('/assignments', true);

    return warehouseIds.some(wid =>
      assignments.some(a =>
        a.type === 'AREA_WAREHOUSE' &&
        a.warehouseId === wid &&
        a.areaId === areaId &&
        a.isActive === true
      )
    );
  }

  private mapBackendAssignment(a: any): Assignment {
    return {
      id: a.id,
      type: a.type,
      userId: a.userId,
      areaId: a.areaId,
      warehouseId: a.warehouseId,
      assignedAt: a.assignedAt,
      revokedAt: a.revokedAt ?? null,
      isActive: a.isActive,
    };
  }
}
