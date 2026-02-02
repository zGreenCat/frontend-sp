// Estructuras de dimensiones y precio del backend
export interface DimensionUnit {
  id: string;
  code: string;
  name: string;
  abbreviation: string;
  type: 'WEIGHT' | 'LENGTH';
}

export interface Dimension {
  value: number;
  unit: DimensionUnit;
}

export interface ProductDimensions {
  weight?: Dimension;
  width?: Dimension;
  height?: Dimension;
  length?: Dimension;
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
}

export interface Price {
  amount: number;
  currency: Currency;
}

export interface Audit {
  createdAt: string;
  updatedAt: string;
}

// Spare Part (Repuesto) asociado a un equipo
export interface BoxEquipmentSparePart {
  id: string;           // id de la asignación del repuesto
  boxEquipmentId: string; // id del box-equipment al que pertenece
  quantity: number;
  assignedAt: string;
  revokedAt: string | null;
  sparePart: {
    id: string;
    name: string;
    description?: string;
    category: 'COMPONENT' | 'SPARE';
    equipmentId: string;
    dimensions?: ProductDimensions;
    price?: Price;
    status: {
      isActive: boolean;
    };
    audit: Audit;
  };
}

// Equipo asignado a una caja
export interface BoxEquipment {
  id: string;           // id de la asignación
  boxId: string;        // id de la caja
  quantity: number;
  assignedAt: string;
  revokedAt: string | null;
  equipment: {
    id: string;
    name: string;
    model?: string;
    description?: string;
    dimensions?: ProductDimensions;
    price?: Price;
    status: {
      isActive: boolean;
    };
    audit: Audit;
  };
  spareParts?: BoxEquipmentSparePart[];
}
