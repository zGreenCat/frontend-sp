import { IProductRepository, ListProductsParams } from '@/domain/repositories/IProductRepository';
import { CreateProductInput, UpdateProductInput } from '@/shared/schemas';
import { Product, ProductKind } from '@/domain/entities/Product';
import { ProductHistoryEvent, ProductHistoryFilters } from '@/domain/entities/ProductHistory';
import { PaginatedResponse } from '@/shared/types/pagination.types';
import { apiClient } from '@/infrastructure/api/apiClient';
import { TENANT_ID } from '@/shared/constants';

// ====== Tipos del Backend ======

// Nueva estructura del backend (v2)
interface BackendPrice {
  amount: number;
  currency: {
    id: string;
    code: string;
    name: string;
    symbol: string;
  };
}

interface BackendUnitOfMeasure {
  id: string;
  code: string;
  name: string;
  abbreviation: string;
}

interface BackendCategory {
  id: string;
  name: string;
}

interface BackendFlags {
  isHazardous?: boolean;
  isActive: boolean;
}

interface BackendAudit {
  createdAt: string;
  updatedAt: string;
}

interface BackendEquipment {
  id: string;
  name: string;
  model?: string;
  description?: string;
  price?: BackendPrice;
  unitOfMeasure?: BackendUnitOfMeasure;
  categories?: BackendCategory[];
  flags?: BackendFlags; // Opcional para retrocompatibilidad
  audit?: BackendAudit; // Opcional para retrocompatibilidad
  // Campos legacy (estructura antigua)
  monetaryValue?: unknown;
  currency?: string | { id: string; code: string; name: string; abbreviation: string };
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface BackendMaterial {
  id: string;
  name: string;
  description?: string;
  price?: BackendPrice;
  unitOfMeasure?: BackendUnitOfMeasure | string;
  categories?: BackendCategory[];
  flags?: BackendFlags; // Opcional para retrocompatibilidad
  audit?: BackendAudit; // Opcional para retrocompatibilidad
  // Campos legacy (estructura antigua)
  monetaryValue?: unknown;
  currency?: string | { id: string; code: string; name: string; abbreviation: string };
  isHazardous?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface BackendSparePart {
  id: string;
  equipmentId?: string;
  name: string;
  model?: string;
  description?: string;
  category?: string; // COMPONENT | SPARE
  price?: BackendPrice;
  unitOfMeasure?: BackendUnitOfMeasure;
  flags?: BackendFlags; // Opcional para retrocompatibilidad
  audit?: BackendAudit; // Opcional para retrocompatibilidad
  // Campos legacy (estructura antigua)
  monetaryValue?: unknown;
  currency?: string | { id: string; code: string; name: string; abbreviation: string };
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface BackendPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

/**
 * Repositorio de productos unificado
 * Actúa como fachada sobre los endpoints reales del backend
 */
export class ApiProductRepository implements IProductRepository {
  
  /**
   * Lista productos según el tipo especificado
   */
  async list(params: ListProductsParams): Promise<PaginatedResponse<Product>> {
    const { kind, page = 1, limit = 10, search, isActive } = params;

    // Si no se especifica kind, retornamos error controlado
    if (!kind) {
      console.warn('[ApiProductRepository] Se requiere especificar kind (EQUIPMENT, MATERIAL o SPARE_PART)');
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    try {
      // Construir query params
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      if (search) queryParams.append('search', search);
      if (isActive !== undefined) queryParams.append('isActive', isActive.toString());

      // Determinar endpoint según el tipo
      const endpoint = this.getEndpointForKind(kind);
      const url = `${endpoint}?${queryParams.toString()}`;

      console.log(`[ApiProductRepository] Fetching ${kind}:`, url);

      const response = await apiClient.get<BackendPaginatedResponse<any>>(url, true);

      // Mapear según el tipo
      const products = this.mapResponseToProducts(response.data || [], kind);

      const totalPages = response.totalPages || Math.ceil((response.total || 0) / limit);

      console.log(`[ApiProductRepository] Loaded ${products.length} ${kind}(s)`);

      return {
        data: products,
        total: response.total || 0,
        page: response.page || page,
        limit: response.limit || limit,
        totalPages,
      };
    } catch (error) {
      console.error(`[ApiProductRepository] Error fetching ${kind}:`, error);
      throw error;
    }
  }

  /**
   * Busca un producto por ID y tipo
   */
  async findById(id: string, kind: ProductKind): Promise<Product | null> {
    try {
      const endpoint = this.getDetailEndpointForKind(kind, id);
      
      console.log(`[ApiProductRepository] Fetching product detail:`, endpoint);
      
      const response = await apiClient.get<any>(endpoint, true);

      if (!response) {
        return null;
      }

      // Mapear según el tipo
      return this.mapSingleToProduct(response, kind);
    } catch (error: any) {
      // Si es 404, retornar null
      if (error?.status === 404 || error?.response?.status === 404) {
        console.log('[ApiProductRepository] Product not found');
        return null;
      }
      
      console.error('[ApiProductRepository] Error fetching product detail:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo producto
   * Enruta al endpoint correcto según el tipo de producto
   */
  async create(input: CreateProductInput): Promise<Product> {
    try {
      const endpoint = this.getEndpointForKind(input.kind);
      
      // Preparar payload según el tipo de producto
      const payload = this.mapInputToBackendPayload(input);
      
      console.log(`[ApiProductRepository] Creating ${input.kind}:`, endpoint, payload);
      
      const response = await apiClient.post<any>(endpoint, payload, true);

      if (!response) {
        throw new Error('No response from server');
      }

      // Mapear respuesta a Product unificado
      const product = this.mapSingleToProduct(response, input.kind);
      
      console.log(`[ApiProductRepository] Product created successfully:`, product.id);
      
      return product;
    } catch (error) {
      console.error('[ApiProductRepository] Error creating product:', error);
      throw error;
    }
  }

  // ====== Métodos privados de mapeo ======

  private getEndpointForKind(kind: ProductKind): string {
    switch (kind) {
      case 'EQUIPMENT':
        return '/equipment';
      case 'MATERIAL':
        return '/materials';
      case 'SPARE_PART':
        return '/spare-parts';
      default:
        throw new Error(`Unknown product kind: ${kind}`);
    }
  }

  private getDetailEndpointForKind(kind: ProductKind, id: string): string {
    switch (kind) {
      case 'EQUIPMENT':
        return `/equipment/${id}`;
      case 'MATERIAL':
        return `/materials/${id}`;
      case 'SPARE_PART':
        return `/spare-parts/${id}`;
      default:
        throw new Error(`Unknown product kind: ${kind}`);
    }
  }

  private mapResponseToProducts(data: any[], kind: ProductKind): Product[] {
    switch (kind) {
      case 'EQUIPMENT':
        return data.map(item => this.mapEquipmentToProduct(item as BackendEquipment));
      case 'MATERIAL':
        return data.map(item => this.mapMaterialToProduct(item as BackendMaterial));
      case 'SPARE_PART':
        return data.map(item => this.mapSparePartToProduct(item as BackendSparePart));
      default:
        return [];
    }
  }

  private mapSingleToProduct(data: any, kind: ProductKind): Product {
    switch (kind) {
      case 'EQUIPMENT':
        return this.mapEquipmentToProduct(data as BackendEquipment);
      case 'MATERIAL':
        return this.mapMaterialToProduct(data as BackendMaterial);
      case 'SPARE_PART':
        return this.mapSparePartToProduct(data as BackendSparePart);
      default:
        throw new Error(`Unknown product kind: ${kind}`);
    }
  }

  /**
   * Helper para extraer string de campos que pueden ser string u objeto
   * El backend a veces envía objetos completos (con id, code, name, abbreviation)
   */
  private extractStringValue(value: string | { code?: string; abbreviation?: string; name?: string } | undefined | null): string | undefined {
    if (!value) return undefined;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      return value.abbreviation || value.code || value.name;
    }
    return undefined;
  }

  private mapEquipmentToProduct(equipment: BackendEquipment): Product {
    return {
      id: equipment.id,
      kind: 'EQUIPMENT',
      name: equipment.name,
      description: equipment.description,
      model: equipment.model,
      // Soportar ambas estructuras: nueva (price.currency) y antigua (currency directo)
      currency: equipment.price?.currency.code || (equipment as any).currency,
      currencyId: equipment.price?.currency.id,
      currencySymbol: equipment.price?.currency.symbol,
      price: equipment.price?.amount,
      monetaryValue: equipment.price?.amount?.toString(),
      monetaryValueRaw: equipment.price?.amount || (equipment as any).monetaryValue,
      unitOfMeasure: equipment.unitOfMeasure?.abbreviation || equipment.unitOfMeasure?.code,
      unitOfMeasureId: equipment.unitOfMeasure?.id,
      categories: equipment.categories?.map(c => ({ id: c.id, name: c.name })),
      categoryIds: equipment.categories?.map(c => c.id),
      // Dimensiones del backend
      dimensions: (equipment as any).dimensions,
      // Soportar ambas estructuras: nueva (status.isActive), antigua (flags.isActive) y legacy (isActive directo)
      isActive: (equipment as any).status?.isActive ?? equipment.flags?.isActive ?? (equipment as any).isActive ?? true,
      createdAt: equipment.audit?.createdAt || (equipment as any).createdAt,
      updatedAt: equipment.audit?.updatedAt || (equipment as any).updatedAt,
    };
  }

  private mapMaterialToProduct(material: BackendMaterial): Product {
    return {
      id: material.id,
      kind: 'MATERIAL',
      name: material.name,
      description: material.description,
      unitOfMeasure: material.unitOfMeasure?.abbreviation || material.unitOfMeasure?.code || (material as any).unitOfMeasure,
      unitOfMeasureId: typeof material.unitOfMeasure === 'object' ? material.unitOfMeasure?.id : undefined,
      // Soportar ambas estructuras
      isHazardous: material.flags?.isHazardous ?? (material as any).isHazardous ?? false,
      currency: material.price?.currency.code || (material as any).currency,
      currencyId: material.price?.currency.id,
      currencySymbol: material.price?.currency.symbol,
      price: material.price?.amount,
      monetaryValue: material.price?.amount?.toString(),
      monetaryValueRaw: material.price?.amount || (material as any).monetaryValue,
      isActive: material.flags?.isActive ?? (material as any).isActive ?? true,
      createdAt: material.audit?.createdAt || (material as any).createdAt,
      updatedAt: material.audit?.updatedAt || (material as any).updatedAt,
      categories: material.categories?.map(c => ({ id: c.id, name: c.name })) || (material as any).categories,
      categoryIds: material.categories?.map(c => c.id),
    };
  }

  private mapSparePartToProduct(sparePart: BackendSparePart): Product {
    return {
      id: sparePart.id,
      kind: 'SPARE_PART',
      name: sparePart.name,
      description: sparePart.description,
      model: sparePart.model,
      equipmentId: (sparePart as any).equipmentId,
      category: (sparePart as any).category,
      // Soportar ambas estructuras
      currency: sparePart.price?.currency.code || (sparePart as any).currency,
      currencyId: sparePart.price?.currency.id,
      currencySymbol: sparePart.price?.currency.symbol,
      price: sparePart.price?.amount,
      monetaryValue: sparePart.price?.amount?.toString(),
      monetaryValueRaw: sparePart.price?.amount || (sparePart as any).monetaryValue,
      unitOfMeasure: sparePart.unitOfMeasure?.abbreviation || sparePart.unitOfMeasure?.code,
      unitOfMeasureId: sparePart.unitOfMeasure?.id,
      // Dimensiones del backend
      dimensions: (sparePart as any).dimensions,
      isActive: sparePart.status?.isActive ?? sparePart.flags?.isActive ?? (sparePart as any).isActive ?? true,
      createdAt: sparePart.audit?.createdAt || (sparePart as any).createdAt,
      updatedAt: sparePart.audit?.updatedAt || (sparePart as any).updatedAt,
    };
  }

  /**
   * Mapea el input de creación al formato esperado por el backend
   * Cada tipo de producto tiene su propio formato
   */
  private mapInputToBackendPayload(input: CreateProductInput): any {
    // Campos comunes a todos los tipos
    // ⚠️ El backend NO acepta isActive ni tenantId en creación
    const basePayload = {
      name: input.name,
      description: input.description || '',
      monetaryValue: input.monetaryValue,
      currencyId: input.currencyId,
    };

    switch (input.kind) {
      case 'EQUIPMENT':
        return {
          ...basePayload,
          model: input.model || '',
          weightValue: input.weightValue,
          weightUnitId: input.weightUnitId,
          widthValue: input.widthValue,
          widthUnitId: input.widthUnitId,
          heightValue: input.heightValue,
          heightUnitId: input.heightUnitId,
          lengthValue: input.lengthValue,
          lengthUnitId: input.lengthUnitId,
        };

      case 'MATERIAL':
        return {
          ...basePayload,
          unitOfMeasureId: input.unitOfMeasureId,
          isHazardous: input.isHazardous || false,
          categoryIds: input.categoryIds || [], // Array de categorías
        };

      case 'SPARE_PART':
        return {
          ...basePayload,
          equipmentId: input.equipmentId,
          category: input.category || 'COMPONENT', // COMPONENT o SPARE
          weightValue: input.weightValue,
          weightUnitId: input.weightUnitId,
          widthValue: input.widthValue,
          widthUnitId: input.widthUnitId,
          heightValue: input.heightValue,
          heightUnitId: input.heightUnitId,
          lengthValue: input.lengthValue,
          lengthUnitId: input.lengthUnitId,
        };

      default:
        throw new Error(`Unknown product kind: ${input.kind}`);
    }
  }

  /**
   * Actualiza un producto existente
   */
  async update(id: string, kind: ProductKind, input: UpdateProductInput): Promise<Product> {
    try {
      const endpoint = this.getDetailEndpointForKind(kind, id);
      const payload = this.mapUpdateInputToBackendPayload(input, kind);

      console.log(`[ApiProductRepository] Updating ${kind} ${id}:`, payload);

      const response = await apiClient.patch<any>(endpoint, payload, true);

      console.log(`[ApiProductRepository] Updated ${kind}:`, response);

      return this.mapSingleToProduct(response, kind);
    } catch (error) {
      console.error(`[ApiProductRepository] Error updating ${kind}:`, error);
      throw error;
    }
  }

  /**
   * Elimina un producto (soft delete)
   */
  async delete(id: string, kind: ProductKind): Promise<void> {
    try {
      const endpoint = this.getDetailEndpointForKind(kind, id);
      
      console.log(`[ApiProductRepository] Deleting ${kind}:`, endpoint);
      
      await apiClient.delete(endpoint, true);
      
      console.log(`[ApiProductRepository] Product deleted successfully:`, id);
    } catch (error) {
      console.error('[ApiProductRepository] Error deleting product:', error);
      throw error;
    }
  }

  /**
   * Helper: Agrega un campo al payload solo si tiene un valor válido
   * Excluye: undefined, null, string vacío
   */
  private addIfValid(payload: any, key: string, value: any): void {
    if (value !== undefined && value !== null && value !== '') {
      payload[key] = value;
    }
  }

  /**
   * Mapea el input de actualización al formato esperado por el backend
   * Solo envía los campos que han sido modificados y tienen valores válidos
   * Similar a mapInputToBackendPayload pero sin campos obligatorios y sin tenantId
   */
  private mapUpdateInputToBackendPayload(input: UpdateProductInput, kind: ProductKind): any {
    const basePayload: any = {};
    
    // Campos comunes (excluir isActive - el backend no lo acepta en PATCH)
    this.addIfValid(basePayload, 'name', input.name);
    this.addIfValid(basePayload, 'description', input.description);
    this.addIfValid(basePayload, 'currencyId', input.currencyId);
    this.addIfValid(basePayload, 'monetaryValue', input.monetaryValue);
    // NO enviar isActive en actualizaciones

    switch (kind) {
      case 'EQUIPMENT':
        this.addIfValid(basePayload, 'model', input.model);
        
        // Dimensiones
        this.addIfValid(basePayload, 'weightValue', input.weightValue);
        this.addIfValid(basePayload, 'weightUnitId', input.weightUnitId);
        this.addIfValid(basePayload, 'widthValue', input.widthValue);
        this.addIfValid(basePayload, 'widthUnitId', input.widthUnitId);
        this.addIfValid(basePayload, 'heightValue', input.heightValue);
        this.addIfValid(basePayload, 'heightUnitId', input.heightUnitId);
        this.addIfValid(basePayload, 'lengthValue', input.lengthValue);
        this.addIfValid(basePayload, 'lengthUnitId', input.lengthUnitId);
        break;

      case 'MATERIAL':
        this.addIfValid(basePayload, 'unitOfMeasureId', input.unitOfMeasureId);
        this.addIfValid(basePayload, 'isHazardous', input.isHazardous);
        this.addIfValid(basePayload, 'categoryIds', input.categoryIds);
        
        // Weight para materiales
        this.addIfValid(basePayload, 'weightValue', input.weightValue);
        this.addIfValid(basePayload, 'weightUnitId', input.weightUnitId);
        break;

      case 'SPARE_PART':
        this.addIfValid(basePayload, 'equipmentId', input.equipmentId);
        this.addIfValid(basePayload, 'category', input.category);
        
        // Dimensiones
        this.addIfValid(basePayload, 'weightValue', input.weightValue);
        this.addIfValid(basePayload, 'weightUnitId', input.weightUnitId);
        this.addIfValid(basePayload, 'widthValue', input.widthValue);
        this.addIfValid(basePayload, 'widthUnitId', input.widthUnitId);
        this.addIfValid(basePayload, 'heightValue', input.heightValue);
        this.addIfValid(basePayload, 'heightUnitId', input.heightUnitId);
        this.addIfValid(basePayload, 'lengthValue', input.lengthValue);
        this.addIfValid(basePayload, 'lengthUnitId', input.lengthUnitId);
        break;
    }

    return basePayload;
  }

  /**
   * Obtiene el historial de cambios de un producto
   * Endpoints disponibles:
   * - GET /equipment/:id/history
   * - GET /materials/:id/history
   * - GET /spare-parts/:id/history
   */
  async getHistory(
    id: string,
    kind: ProductKind,
    filters?: ProductHistoryFilters
  ): Promise<PaginatedResponse<ProductHistoryEvent>> {
    try {
      // Determinar endpoint según el tipo
      const endpoint = this.getHistoryEndpointForKind(kind, id);
      
      console.log(`[ApiProductRepository] Fetching history for ${kind} ${id}:`, endpoint);
      
      // El backend devuelve un objeto paginado: { data: [], total, page, limit, totalPages }
      const response = await apiClient.get<any>(endpoint, true);
      
      console.log(`[ApiProductRepository] History response:`, response);
      
      // Extraer el array de eventos
      const historyArray = response?.data || [];
      
      // Mapear respuesta del backend a entidades del dominio
      const events = historyArray.map((item: any) => this.mapBackendHistoryToEvent(item, kind));
      
      // Usar la paginación que devuelve el backend
      return {
        data: events,
        total: response?.total || events.length,
        page: response?.page || 1,
        limit: response?.limit || 10,
        totalPages: response?.totalPages || Math.ceil((response?.total || events.length) / (response?.limit || 10)),
      };
    } catch (error) {
      console.error(`[ApiProductRepository] Error fetching history for ${kind}:`, error);
      throw error;
    }
  }

  /**
   * Helper para obtener el endpoint de historial según el tipo de producto
   * @private
   */
  private getHistoryEndpointForKind(kind: ProductKind, id: string): string {
    switch (kind) {
      case 'EQUIPMENT':
        return `/equipment/${id}/history`;
      case 'MATERIAL':
        return `/materials/${id}/history`;
      case 'SPARE_PART':
        return `/spare-parts/${id}/history`;
      default:
        throw new Error(`Unknown product kind: ${kind}`);
    }
  }

  /**
   * Mapea el historial del backend a la entidad de dominio
   * @private
   */
  private mapBackendHistoryToEvent(data: any, kind: ProductKind): ProductHistoryEvent {
    // Construir nombre completo del usuario
    const performerName = data.performer 
      ? `${data.performer.firstName || ''} ${data.performer.lastName || ''}`.trim() || 'Usuario Desconocido'
      : 'Usuario Desconocido';

    return {
      id: data.id,
      productId: data.productId || data.equipmentId || data.materialId || data.sparePartId,
      kind,
      eventType: data.eventType || data.actionType || 'OTHER',
      performedBy: data.performer ? {
        id: data.performer.id || data.performedById,
        name: performerName,
        email: data.performer.email || '',
      } : null,
      performedAt: data.performedAt || data.occurredAt || data.createdAt,
      previousValue: data.previousValue || data.oldValue,
      newValue: data.newValue,
      justification: data.justification || data.reason,
      metadata: data.metadata,
    };
  }
}

