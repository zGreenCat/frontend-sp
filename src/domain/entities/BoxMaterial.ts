// Estructuras compartidas del backend
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

export interface UnitOfMeasure {
  id: string;
  code: string;
  name: string;
  abbreviation: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Audit {
  createdAt: string;
  updatedAt: string;
}

// Material asignado a una caja
export interface BoxMaterial {
  id: string;           // id de la asignación
  boxId: string;        // id de la caja
  quantity: number;
  assignedAt: string;
  revokedAt: string | null;
  material: {
    id: string;
    name: string;
    description?: string;
    price?: Price;
    unitOfMeasure?: UnitOfMeasure;
    categories?: Category[];
    flags: {
      isHazardous: boolean;
      isActive: boolean;
    };
    audit: Audit;
  };
}
