import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '@/presentation/providers/RepositoryProvider';
import { ProductKind, Product } from '@/domain/entities/Product';
import { PaginatedResponse } from '@/shared/types/pagination.types';
import { CreateProductInput, UpdateProductInput } from '@/domain/repositories/IProductRepository';
import { CreateProduct } from '@/application/usecases/product/CreateProduct';
import { UpdateProduct } from '@/application/usecases/product/UpdateProduct';
import { TENANT_ID } from '@/shared/constants';

// Query Keys
export const productKeys = {
  all: (kind?: ProductKind, filters?: any) => ['products', TENANT_ID, kind, filters] as const,
  detail: (id: string, kind: ProductKind) => ['products', TENANT_ID, kind, id] as const,
};

export interface UseProductsParams {
  kind: ProductKind; // Requerido: EQUIPMENT, MATERIAL, SPARE_PART
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

/**
 * Hook para obtener lista de productos con filtros y paginación
 * @param params - Parámetros de filtrado (kind es obligatorio)
 */
export const useProducts = (params: UseProductsParams) => {
  const { productRepo } = useRepositories();

  return useQuery({
    queryKey: productKeys.all(params.kind, params),
    queryFn: async (): Promise<PaginatedResponse<Product>> => {
      return await productRepo.list(params);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para obtener detalle de un producto por ID y tipo
 * @param id - ID del producto
 * @param kind - Tipo de producto (EQUIPMENT, MATERIAL, SPARE_PART)
 */
export const useProductDetail = (id: string | undefined, kind: ProductKind) => {
  const { productRepo } = useRepositories();

  return useQuery({
    queryKey: productKeys.detail(id || '', kind),
    queryFn: async (): Promise<Product | null> => {
      if (!id) return null;
      return await productRepo.findById(id, kind);
    },
    enabled: !!id && !!kind,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// ====== Hooks de conveniencia (wrappers) ======

export interface UseEquipmentsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

/**
 * Hook de conveniencia para listar equipos
 */
export const useEquipments = (params: UseEquipmentsParams = {}) =>
  useProducts({ ...params, kind: 'EQUIPMENT' });

/**
 * Hook de conveniencia para obtener detalle de un equipo
 */
export const useEquipmentById = (id: string | undefined) =>
  useProductDetail(id, 'EQUIPMENT');

export interface UseMaterialsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

/**
 * Hook de conveniencia para listar materiales
 */
export const useMaterials = (params: UseMaterialsParams = {}) =>
  useProducts({ ...params, kind: 'MATERIAL' });

/**
 * Hook de conveniencia para obtener detalle de un material
 */
export const useMaterialById = (id: string | undefined) =>
  useProductDetail(id, 'MATERIAL');

export interface UseSparePartsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

/**
 * Hook de conveniencia para listar repuestos
 */
export const useSpareParts = (params: UseSparePartsParams = {}) =>
  useProducts({ ...params, kind: 'SPARE_PART' });

/**
 * Hook de conveniencia para obtener detalle de un repuesto
 */
export const useSparePartById = (id: string | undefined) =>
  useProductDetail(id, 'SPARE_PART');

// ====== Mutations (Create, Update, Delete) ======

/**
 * Mutation para crear un nuevo producto
 * Invalida las queries del tipo de producto creado
 */
export const useCreateProduct = () => {
  const { productRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProductInput): Promise<Product> => {
      const useCase = new CreateProduct(productRepo);
      const result = await useCase.execute(input);
      
      if (!result.ok) {
        throw new Error(result.error);
      }
      
      return result.value;
    },
    onSuccess: (product) => {
      // Invalidar queries del tipo de producto creado
      queryClient.invalidateQueries({ 
        queryKey: productKeys.all(product.kind, undefined) 
      });
    },
  });
};

/**
 * Mutation para actualizar un producto existente
 * Invalida las queries de detalle y listado del tipo de producto actualizado
 */
export const useUpdateProduct = () => {
  const { productRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      kind, 
      input 
    }: { 
      id: string; 
      kind: ProductKind; 
      input: UpdateProductInput 
    }): Promise<Product> => {
      const useCase = new UpdateProduct(productRepo);
      const result = await useCase.execute(id, kind, input);
      
      if (!result.ok) {
        throw new Error(result.error);
      }
      
      return result.value;
    },
    onSuccess: (product) => {
      // Invalidar query de detalle del producto actualizado
      queryClient.invalidateQueries({ 
        queryKey: productKeys.detail(product.id, product.kind) 
      });
      
      // Invalidar queries de listado del tipo de producto actualizado
      queryClient.invalidateQueries({ 
        queryKey: productKeys.all(product.kind, undefined) 
      });
    },
  });
};
