import { useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/presentation/providers/RepositoryProvider';
import { UnitOfMeasure } from '@/domain/entities/UnitOfMeasure';
import { Currency } from '@/domain/entities/Currency';

// ============================================================================
// Query Keys
// ============================================================================

export const unitOfMeasureKeys = {
  all: ['units-of-measure'] as const,
};

export const currencyKeys = {
  all: ['currencies'] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook para obtener todas las unidades de medida activas
 */
export function useUnitsOfMeasure() {
  const { unitOfMeasureRepo } = useRepositories();

  return useQuery({
    queryKey: unitOfMeasureKeys.all,
    queryFn: (): Promise<UnitOfMeasure[]> => unitOfMeasureRepo.findAll(),
    staleTime: 10 * 60 * 1000, // 10 minutos (datos de catálogo)
  });
}

/**
 * Hook para obtener todas las monedas activas
 */
export function useCurrencies() {
  const { currencyRepo } = useRepositories();

  return useQuery({
    queryKey: currencyKeys.all,
    queryFn: (): Promise<Currency[]> => currencyRepo.findAll(),
    staleTime: 60 * 60 * 1000, // 1 hora (datos de catálogo)
  });
}

// ============================================================================
// Mappers para <Select> options
// ============================================================================

/**
 * Convierte unidades de medida a opciones de Select
 * Formato: "Kilogramo (kg)", "Litro (L)", "Unidad (un)"
 */
export function mapUnitsToOptions(units: UnitOfMeasure[]) {
  return units.map(u => ({
    value: u.code, // 'KG', 'LT', 'UNIT', etc.
    label: `${u.name} (${u.abbreviation})`,
  }));
}

/**
 * Convierte monedas a opciones de Select
 * Formato: "Chilean Peso (CLP)", "US Dollar (USD)"
 */
export function mapCurrenciesToOptions(currencies: Currency[]) {
  return currencies.map(c => ({
    value: c.code, // 'CLP', 'USD', 'EUR', etc.
    label: `${c.name} (${c.code})`,
  }));
}
