export interface Currency {
  id: string;
  code: string;           // 'CLP', 'USD', 'EUR'
  name: string;           // 'Chilean Peso', 'US Dollar', etc.
  symbol: string;         // '$', 'US$', '€'
  countryCode?: string | null;
  description?: string | null;
  exchangeRateToUSD?: number | null;
  lastRateUpdateAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
