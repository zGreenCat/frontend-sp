import { Currency } from '../entities/Currency';

export interface ICurrencyRepository {
  findAll(): Promise<Currency[]>;
}
