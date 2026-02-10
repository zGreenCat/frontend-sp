import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '@/presentation/providers/RepositoryProvider';
import { ProductKind, Product } from '@/domain/entities/Product';
import { ProductHistoryEvent, ProductHistoryFilters } from '@/domain/entities/ProductHistory';
import { PaginatedResponse } from '@/shared/types/pagination.types';
import { CreateProductInput, UpdateProductInput } from '@/shared/schemas';
import { CreateProduct } from '@/application/usecases/product/CreateProduct';
import { UpdateProduct } from '@/application/usecases/product/UpdateProduct';
import { DeleteProduct } from '@/application/usecases/product/DeleteProduct';
import { GetProductHistory } from '@/application/usecases/product/GetProductHistory';
import { TENANT_ID } from '@/shared/constants';
import { 
  EquipmentQuery, 
  MaterialQuery, 
  SparePartQuery 
} from '@/shared/types/product-filters.types';

// Query Keys
export const productKeys = {
  all: (kind?: ProductKind, filters?: any) => ['products', TENANT_ID, kind, filters] as const,
  detail: (id: string, kind: ProductKind) => ['products', TENANT_ID, kind, id] as const,
  history: (id: string, kind: ProductKind, filters?: ProductHistoryFilters) => 
    ['products', TENANT_ID, kind, id, 'history', filters] as const,
};

export interface UseProductsParams {
  kind: ProductKind; // Requerido: EQUIPMENT, MATERIAL, SPARE_PART
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  isActive?: boolean;
  currencyId?: string;
  
  // Spare part specific
  category?: 'COMPONENT' | 'SPARE';
  equipmentId?: string;
  
  // Material specific
  unitOfMeasureId?: string;
  isHazardous?: boolean;
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

/**
 * Params específicos para equipos
 */
export interface UseEquipmentsParams extends Omit<EquipmentQuery, 'kind'> {}

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

/**
 * Params específicos para materiales
 */
export interface UseMaterialsParams extends Omit<MaterialQuery, 'kind'> {}

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

/**
 * Params específicos para repuestos
 */
export interface UseSparePartsParams extends Omit<SparePartQuery, 'kind'> {}

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
      // Invalidar todas las queries de listado del tipo de producto creado
      queryClient.invalidateQueries({ 
        queryKey: ['products', TENANT_ID, product.kind]
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
      
      // Invalidar todas las queries de listado del tipo de producto actualizado
      queryClient.invalidateQueries({ 
        queryKey: ['products', TENANT_ID, product.kind]
      });
    },
  });
};

/**
 * Mutation para eliminar un producto (soft delete)
 * Invalida las queries de listado del tipo de producto eliminado
 */
export const useDeleteProduct = () => {
  const { productRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      kind 
    }: { 
      id: string; 
      kind: ProductKind; 
    }): Promise<void> => {
      const useCase = new DeleteProduct(productRepo);
      const result = await useCase.execute(id, kind);
      
      if (!result.ok) {
        throw new Error(result.error);
      }
    },
    onSuccess: (_, variables) => {
      // Invalidar query de detalle del producto eliminado
      queryClient.invalidateQueries({ 
        queryKey: productKeys.detail(variables.id, variables.kind) 
      });
      
      // Invalidar todas las queries de listado del tipo de producto eliminado
      queryClient.invalidateQueries({ 
        queryKey: ['products', TENANT_ID, variables.kind]
      });
    },
  });
};

/**
 * Hook para obtener el historial de cambios de un producto
 * @param id - ID del producto
 * @param kind - Tipo de producto (EQUIPMENT, MATERIAL, SPARE_PART)
 * @param filters - Filtros opcionales (paginación, rango de fechas, tipo de evento)
 * 
 * NOTA: Actualmente el backend no expone endpoints de historial para productos.
 * Este hook manejará el error de forma controlada mostrando un mensaje al usuario.
 */
export const useProductHistory = (
  id: string | undefined,
  kind: ProductKind,
  filters?: ProductHistoryFilters
) => {
  const { productRepo } = useRepositories();

  return useQuery({
    queryKey: productKeys.history(id || '', kind, filters),
    queryFn: async (): Promise<PaginatedResponse<ProductHistoryEvent>> => {
      if (!id) {
        return {
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        };
      }

      const useCase = new GetProductHistory(productRepo);
      const result = await useCase.execute(id, kind, filters);
      
      if (!result.ok) {
        throw new Error(result.error);
      }
      
      return result.value;
    },
    enabled: !!id, // Solo ejecutar si hay ID
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: false, // No reintentar automáticamente en caso de error
  });
};
