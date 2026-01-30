import { useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/presentation/providers/RepositoryProvider';
import { ProductKind, Product } from '@/domain/entities/Product';
import { PaginatedResponse } from '@/shared/types/pagination.types';
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

