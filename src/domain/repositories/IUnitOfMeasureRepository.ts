import { UnitOfMeasure } from '../entities/UnitOfMeasure';

export interface IUnitOfMeasureRepository {
  findAll(): Promise<UnitOfMeasure[]>;
}
