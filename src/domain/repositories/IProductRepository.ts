import { Product } from '../entities/Product';

export interface IProductRepository {
  findAll(tenantId: string): Promise<Product[]>;
  findById(id: string, tenantId: string): Promise<Product | null>;
  create(product: Omit<Product, 'id'>): Promise<Product>;
  update(id: string, product: Partial<Product>, tenantId: string): Promise<Product>;
}
