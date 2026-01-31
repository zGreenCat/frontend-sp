export type UnitOfMeasureType = 'LENGTH' | 'WEIGHT' | 'VOLUME' | 'AREA' | 'QUANTITY' | string;

export interface UnitOfMeasure {
  id: string;
  code: string;           // 'KG', 'LT', 'UNIT', 'M', 'M2', etc.
  name: string;           // 'Kilogramo', 'Litro', 'Unidad', etc.
  abbreviation: string;   // 'kg', 'L', 'un', 'm', 'm²'
  description?: string | null;
  type: UnitOfMeasureType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
