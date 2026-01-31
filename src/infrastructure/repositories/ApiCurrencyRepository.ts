import { ICurrencyRepository } from '@/domain/repositories/ICurrencyRepository';
import { Currency } from '@/domain/entities/Currency';
import { apiClient } from '@/infrastructure/api/apiClient';

interface BackendCurrency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  countryCode: string | null;
  description: string | null;
  exchangeRateToUSD: number | null;
  lastRateUpdateAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CurrenciesResponse {
  data: BackendCurrency[];
  total: number;
}

export class ApiCurrencyRepository implements ICurrencyRepository {
  async findAll(): Promise<Currency[]> {
    const response = await apiClient.get<CurrenciesResponse>('/currencies');

    return response.data
      .filter((c: BackendCurrency) => c.isActive)
      .map(this.mapBackendToDomain);
  }

  private mapBackendToDomain(c: BackendCurrency): Currency {
    return {
      id: c.id,
      code: c.code,
      name: c.name,
      symbol: c.symbol,
      countryCode: c.countryCode ?? undefined,
      description: c.description ?? undefined,
      exchangeRateToUSD: c.exchangeRateToUSD ?? undefined,
      lastRateUpdateAt: c.lastRateUpdateAt ?? undefined,
      isActive: c.isActive,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }
}
