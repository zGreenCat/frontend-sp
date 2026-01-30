import { IProductRepository, ListProductsParams, CreateProductInput, UpdateProductInput } from '@/domain/repositories/IProductRepository';
import { Product, ProductKind } from '@/domain/entities/Product';
import { ProductHistoryEvent, ProductHistoryFilters } from '@/domain/entities/ProductHistory';
import { PaginatedResponse } from '@/shared/types/pagination.types';
import { apiClient } from '@/infrastructure/api/apiClient';
import { TENANT_ID } from '@/shared/constants';

// ====== Tipos del Backend ======

interface BackendEquipment {
  id: string;
  name: string;
  model?: string;
  description?: string;
  monetaryValue?: unknown; // Formato crudo { s, e, d }
  currency?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BackendMaterial {
  id: string;
  name: string;
  description?: string;
  unitOfMeasure: string; // LT, KG, UND, etc.
  monetaryValue?: unknown; // Formato crudo { s, e, d }
  currency?: string;
  isHazardous: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  categories?: Array<{
    id: string;
    materialId: string;
    categoryId: string;
    isActive: boolean;
  }>;
}

interface BackendSparePart {
  id: string;
  equipmentId?: string;
  name: string;
  model?: string;
  description?: string;
  category?: string; // COMPONENT | SPARE
  monetaryValue?: unknown; // Formato crudo { s, e, d }
  currency?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
    const { kind, page = 1, limit = 10, search, status } = params;

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
      if (status) queryParams.append('status', status);

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
        return `/equipments/${id}`;
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

  private mapEquipmentToProduct(equipment: BackendEquipment): Product {
    return {
      id: equipment.id,
      kind: 'EQUIPMENT',
      name: equipment.name,
      description: equipment.description,
      model: equipment.model,
      currency: equipment.currency,
      monetaryValueRaw: equipment.monetaryValue,
      isActive: equipment.isActive,
      createdAt: equipment.createdAt,
      updatedAt: equipment.updatedAt,
    };
  }

  private mapMaterialToProduct(material: BackendMaterial): Product {
    return {
      id: material.id,
      kind: 'MATERIAL',
      name: material.name,
      description: material.description,
      unitOfMeasure: material.unitOfMeasure,
      isHazardous: material.isHazardous,
      currency: material.currency,
      monetaryValueRaw: material.monetaryValue,
      isActive: material.isActive,
      createdAt: material.createdAt,
      updatedAt: material.updatedAt,
      categories: material.categories?.map(c => c.categoryId) ?? [],
    };
  }

  private mapSparePartToProduct(sparePart: BackendSparePart): Product {
    return {
      id: sparePart.id,
      kind: 'SPARE_PART',
      name: sparePart.name,
      description: sparePart.description,
      model: sparePart.model,
      currency: sparePart.currency,
      monetaryValueRaw: sparePart.monetaryValue,
      isActive: sparePart.isActive,
      createdAt: sparePart.createdAt,
      updatedAt: sparePart.updatedAt,
    };
  }

  /**
   * Mapea el input de creación al formato esperado por el backend
   * Cada tipo de producto tiene su propio formato
   */
  private mapInputToBackendPayload(input: CreateProductInput): any {
    // Campos comunes a todos los tipos
    const basePayload = {
      name: input.name,
      sku: input.sku,
      description: input.description || '',
      currency: input.currency,
      isActive: input.isActive,
      tenantId: TENANT_ID,
    };

    switch (input.kind) {
      case 'EQUIPMENT':
        return {
          ...basePayload,
          model: input.model || '',
        };

      case 'MATERIAL':
        return {
          ...basePayload,
          unitOfMeasure: input.unitOfMeasure || 'UNIT',
          isHazardous: input.isHazardous || false,
          // categories se manejarían después de crear el material si el backend lo requiere
        };

      case 'SPARE_PART':
        return {
          ...basePayload,
          model: input.model || '',
          category: 'SPARE', // Valor por defecto según backend
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
   * Mapea el input de actualización al formato esperado por el backend
   * Similar a mapInputToBackendPayload pero sin campos obligatorios y sin tenantId
   */
  private mapUpdateInputToBackendPayload(input: UpdateProductInput, kind: ProductKind): any {
    // Campos comunes opcionales (solo enviar si están presentes)
    const basePayload: any = {};
    
    if (input.name !== undefined) basePayload.name = input.name;
    if (input.sku !== undefined) basePayload.sku = input.sku;
    if (input.description !== undefined) basePayload.description = input.description;
    if (input.currency !== undefined) basePayload.currency = input.currency;
    if (input.isActive !== undefined) basePayload.isActive = input.isActive;

    switch (kind) {
      case 'EQUIPMENT':
        if (input.model !== undefined) basePayload.model = input.model;
        break;

      case 'MATERIAL':
        if (input.unitOfMeasure !== undefined) basePayload.unitOfMeasure = input.unitOfMeasure;
        if (input.isHazardous !== undefined) basePayload.isHazardous = input.isHazardous;
        // TODO: categories cuando backend lo soporte
        break;

      case 'SPARE_PART':
        if (input.model !== undefined) basePayload.model = input.model;
        break;
    }

    // TODO: Agregar justification cuando backend lo soporte
    // if (input.justification) basePayload.justification = input.justification;

    return basePayload;
  }

  /**
   * Obtiene el historial de cambios de un producto
   * 
   * NOTA IMPORTANTE: El backend actualmente NO expone endpoints de historial para productos individuales.
   * Los únicos endpoints de historial disponibles son para movimientos en cajas:
   * - GET /boxes/:id/equipment-history
   * - GET /boxes/:id/material-history
   * - GET /boxes/:id/spare-part-history
   * 
   * Este método está preparado para cuando el backend implemente:
   * - GET /equipment/:id/history
   * - GET /materials/:id/history
   * - GET /spare-parts/:id/history
   * 
   * Por ahora, lanza un error controlado para informar que la funcionalidad no está disponible.
   */
  async getHistory(
    id: string,
    kind: ProductKind,
    filters?: ProductHistoryFilters
  ): Promise<PaginatedResponse<ProductHistoryEvent>> {
    // TODO: Implementar cuando el backend exponga los endpoints de historial
    // Los endpoints esperados serían:
    // - GET /equipment/:id/history
    // - GET /materials/:id/history
    // - GET /spare-parts/:id/history
    
    throw new Error('PRODUCT_HISTORY_NOT_IMPLEMENTED: El backend aún no expone endpoints de historial para productos individuales. Esta funcionalidad estará disponible próximamente.');

    /* Implementación futura cuando el backend esté listo:
    
    try {
      const { page = 1, limit = 10, from, to, eventType, performedBy } = filters || {};
      
      // Construir query params
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      if (from) queryParams.append('from', from);
      if (to) queryParams.append('to', to);
      if (eventType) queryParams.append('eventType', eventType);
      if (performedBy) queryParams.append('performedBy', performedBy);
      
      // Determinar endpoint según el tipo
      const endpoint = this.getHistoryEndpointForKind(kind, id);
      const url = `${endpoint}?${queryParams.toString()}`;
      
      console.log(`[ApiProductRepository] Fetching history for ${kind} ${id}:`, url);
      
      const response = await apiClient.get<BackendPaginatedResponse<any>>(url, true);
      
      // Mapear respuesta del backend a entidades del dominio
      const events = response.data.map(item => this.mapBackendHistoryToEvent(item, kind));
      
      return {
        data: events,
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages || Math.ceil(response.total / response.limit),
      };
    } catch (error) {
      console.error(`[ApiProductRepository] Error fetching history for ${kind}:`, error);
      throw error;
    }
    */
  }

  /**
   * Helper para obtener el endpoint de historial según el tipo de producto
   * @private
   */
  /* Descomentar cuando se implemente
  private getHistoryEndpointForKind(kind: ProductKind, id: string): string {
    switch (kind) {
      case 'EQUIPMENT':
        return `/equipments/${id}/history`;
      case 'MATERIAL':
        return `/materials/${id}/history`;
      case 'SPARE_PART':
        return `/spare-parts/${id}/history`;
      default:
        throw new Error(`Unknown product kind: ${kind}`);
    }
  }
  */

  /**
   * Mapea el historial del backend a la entidad de dominio
   * @private
   */
  /* Descomentar cuando se implemente
  private mapBackendHistoryToEvent(data: any, kind: ProductKind): ProductHistoryEvent {
    return {
      id: data.id,
      productId: data.productId || data.equipmentId || data.materialId || data.sparePartId,
      kind,
      eventType: data.eventType || data.actionType || 'OTHER',
      performedBy: data.performedBy ? {
        id: data.performedBy.id || data.performedByUserId,
        name: data.performedBy.name || data.performedBy.fullName || 'Usuario Desconocido',
        email: data.performedBy.email || '',
      } : null,
      performedAt: data.performedAt || data.occurredAt || data.createdAt,
      previousValue: data.previousValue,
      newValue: data.newValue,
      justification: data.justification || data.reason,
      metadata: data.metadata,
    };
  }
  */
}

