// Spare Part (Repuesto) asociado a un equipo
export interface BoxEquipmentSparePart {
  id: string;           // id de la asignación del repuesto
  sparePartId: string;  // id del repuesto en la base de datos
  name: string;
  quantity: number;
  category: string;
  description?: string;
  monetaryValue?: number;
  currency?: string;    // CLP, USD, EUR, etc.
  isActive: boolean;
}

// Equipo asignado a una caja
export interface BoxEquipment {
  id: string;           // id de la asignación
  equipmentId: string;  // id del equipo en la base de datos
  name: string;
  model: string;
  quantity: number;
  description?: string;
  monetaryValue?: number;
  currency?: string;    // CLP, USD, EUR, etc.
  isActive: boolean;
  spareParts?: BoxEquipmentSparePart[];
}
