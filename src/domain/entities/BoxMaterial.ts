// Material asignado a una caja
export interface BoxMaterial {
  id: string;           // id de la asignación
  materialId: string;   // id del material en la base de datos
  name: string;
  quantity: number;
  unitOfMeasure: string;
  description?: string;
  monetaryValue?: number;
  currency?: string;    // CLP, USD, EUR, etc.
  isHazardous: boolean;
  categories?: string[];
  isActive: boolean;
}
