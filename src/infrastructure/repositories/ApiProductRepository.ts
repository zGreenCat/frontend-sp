import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { Product, ProductType, ProductStatus, Currency } from '@/domain/entities/Product';
import { apiClient } from '@/infrastructure/api/apiClient';

// Tipos del backend
interface BackendProduct {
  id: string;
  sku: string;
  description: string;
  type: string;
  status: string;
  uom?: string;
  unitCost?: number;
  currency?: string;
  providerId?: string;
  projectId?: string;
  tenantId: string;
  createdAt?: string;
  updatedAt?: string;
}

interface BackendProductListResponse {
  data: BackendProduct[];
  total?: number;
  page?: number;
  limit?: number;
}

export class ApiProductRepository implements IProductRepository {
  // Mapear Product del backend al dominio
  private mapBackendProduct(backendProduct: BackendProduct): Product {
    return {
      id: backendProduct.id,
      sku: backendProduct.sku,
      description: backendProduct.description,
      type: backendProduct.type as ProductType,
      status: backendProduct.status as ProductStatus,
      uom: backendProduct.uom,
      unitCost: backendProduct.unitCost,
      currency: backendProduct.currency as Currency | undefined,
      providerId: backendProduct.providerId,
      projectId: backendProduct.projectId,
      tenantId: backendProduct.tenantId,
    };
  }

  async findAll(tenantId: string): Promise<Product[]> {
    try {
      const response = await apiClient.get<any>('/products', true);
      console.log('📥 GET /products response:', response);

      // El backend puede devolver array directo o { data: [...] }
      let backendProducts: BackendProduct[];

      if (Array.isArray(response)) {
        backendProducts = response;
      } else if (response && Array.isArray(response.data)) {
        backendProducts = response.data;
      } else if (response && Array.isArray(response.products)) {
        backendProducts = response.products;
      } else {
        console.error('❌ Unexpected response structure from /products:', response);
        return [];
      }

      console.log('✅ Extracted', backendProducts.length, 'products');
      return backendProducts.map(p => this.mapBackendProduct(p));
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  async findById(id: string, tenantId: string): Promise<Product | null> {
    try {
      const response = await apiClient.get<any>(`/products/${id}`, true);

      // Manejar posibles estructuras de respuesta
      const backendProduct = response.data || response;
      return this.mapBackendProduct(backendProduct);
    } catch (error: any) {
      if (error?.statusCode === 404) {
        return null;
      }
      console.error('Error fetching product:', error);
      return null;
    }
  }

  async create(product: Omit<Product, 'id'>): Promise<Product> {
    try {
      const response = await apiClient.post<any>('/products', {
        sku: product.sku,
        description: product.description,
        type: product.type,
        status: product.status,
        uom: product.uom,
        unitCost: product.unitCost,
        currency: product.currency,
        providerId: product.providerId,
        projectId: product.projectId,
      }, true);

      const backendProduct = response.data || response;
      return this.mapBackendProduct(backendProduct);
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<Product>, tenantId: string): Promise<Product> {
    try {
      const payload: any = {};

      if (updates.sku !== undefined) payload.sku = updates.sku;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.type !== undefined) payload.type = updates.type;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.uom !== undefined) payload.uom = updates.uom;
      if (updates.unitCost !== undefined) payload.unitCost = updates.unitCost;
      if (updates.currency !== undefined) payload.currency = updates.currency;
      if (updates.providerId !== undefined) payload.providerId = updates.providerId;
      if (updates.projectId !== undefined) payload.projectId = updates.projectId;

      const response = await apiClient.patch<any>(`/products/${id}`, payload, true);

      const backendProduct = response.data || response;
      return this.mapBackendProduct(backendProduct);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }
}
