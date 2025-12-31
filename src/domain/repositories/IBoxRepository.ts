import { Box, HistoryEvent } from '../entities/Box';

export interface BoxListFilters {
  page?: number;
  limit?: number;
  search?: string; // Busca por qrCode
  status?: string; // Filtro por estado
}

export interface BoxListResponse {
  data: Box[];
  total: number;
  page: number;
  limit: number;
}

export interface HistoryFilters {
  page?: number;
  limit?: number;
  eventType?: string; // CREATED, UPDATED, MOVED, STATUS_CHANGED, DEACTIVATED
}

export interface HistoryResponse {
  data: HistoryEvent[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateBoxDTO {
  qrCode: string;
  description?: string;
  type: string;
  currentWeightKg: number;
  warehouseId: string;
}

export interface UpdateBoxDTO {
  description?: string;
  type?: string;
  currentWeightKg?: number;
  status?: string;
}

export interface MoveBoxDTO {
  warehouseId: string;
}

export interface ChangeStatusDTO {
  status: string;
}

export interface IBoxRepository {
  // Listado con filtros y paginación
  findAll(tenantId: string, filters?: BoxListFilters): Promise<BoxListResponse>;
  
  // Detalle de caja
  findById(id: string, tenantId: string): Promise<Box | null>;
  
  // Buscar por QR
  findByQrCode(qrCode: string, tenantId: string): Promise<Box | null>;
  
  // Crear caja
  create(data: CreateBoxDTO, tenantId: string): Promise<Box>;
  
  // Editar caja
  update(id: string, data: UpdateBoxDTO, tenantId: string): Promise<Box>;
  
  // Mover caja entre bodegas
  move(id: string, data: MoveBoxDTO, tenantId: string): Promise<Box>;
  
  // Cambiar estado
  changeStatus(id: string, data: ChangeStatusDTO, tenantId: string): Promise<Box>;
  
  // Desactivar (baja lógica)
  deactivate(id: string, tenantId: string): Promise<Box>;
  
  // Obtener historial
  getHistory(id: string, tenantId: string, filters?: HistoryFilters): Promise<HistoryResponse>;
}
