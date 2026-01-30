import { IProductRepository, ListProductsParams, CreateProductInput } from '@/domain/repositories/IProductRepository';
import { Product, ProductKind } from '@/domain/entities/Product';
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
}
