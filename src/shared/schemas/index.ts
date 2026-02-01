import { z } from 'zod';
import { 
  USER_ROLES, 
  USER_STATUS, 
  PROVIDER_STATUS, 
  PROJECT_STATUS,
  PRODUCT_TYPES,
  CURRENCIES,
  BOX_TYPES,
  AREA_LEVELS
} from '../constants';
import { validateChileanRut } from '../utils/rutValidator';

// Validación personalizada de RUT con verificación de dígito verificador
const rutSchema = z.string()
  .min(9, 'RUT debe tener al menos 9 caracteres')
  .max(15, 'RUT no puede tener más de 15 caracteres')
  .regex(/^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}[-|‐]{1}[0-9kK]{1}$/, 'Formato de RUT inválido (Ej: 12.345.678-9)')
  .refine(validateChileanRut, {
    message: 'RUT chileno no válido (verificar dígito verificador)',
  });

// Validación de email
const emailSchema = z.string()
  .email('Email inválido')
  .min(5, 'Email debe tener al menos 5 caracteres')
  .max(100, 'Email no puede tener más de 100 caracteres');

// Validación de teléfono chileno
const phoneSchema = z.string()
  .regex(/^(\+?56)?[9]\d{8}$/, 'Teléfono inválido (Ej: +56912345678)')
  .or(z.string().length(0)); // Permite vacío si es opcional

// ────────────────────────────────────────────────────────────────
// USER SCHEMAS
// ────────────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(50),
  lastName: z.string().min(2, 'Apellido debe tener al menos 2 caracteres').max(50),
  email: emailSchema,
  rut: rutSchema,
  phone: phoneSchema,
  role: z.enum([USER_ROLES.ADMIN, USER_ROLES.JEFE, USER_ROLES.SUPERVISOR]),
  status: z.enum([USER_STATUS.HABILITADO, USER_STATUS.DESHABILITADO]).default(USER_STATUS.HABILITADO),
  areas: z.array(z.string()).default([]),
  warehouses: z.array(z.string()).default([]),
  tenantId: z.string().min(1),
});

export const updateUserSchema = createUserSchema.partial().extend({
  id: z.string().min(1),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ────────────────────────────────────────────────────────────────
// AREA SCHEMAS
// ────────────────────────────────────────────────────────────────

const areaBaseSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(100),
  level: z.number().min(0).max(10), // Backend usa 0 para principal
  parentId: z.string().optional(),
  status: z.enum(['ACTIVO', 'INACTIVO']).default('ACTIVO'),
  tenantId: z.string().min(1),
});

export const createAreaSchema = areaBaseSchema.refine(
  (data) => {
    // Backend: nivel 0 = principal, nivel > 0 = dependiente
    // Si tiene parentId, debe tener level > 0 (es dependiente)
    if (data.parentId) {
      return data.level > 0;
    }
    // Si NO tiene parentId, debe tener level === 0 (es principal)
    if (!data.parentId) {
      return data.level === 0;
    }
    return true;
  },
  {
    message: 'Las áreas principales (nivel 0 en BD) no deben tener padre. Las áreas dependientes (nivel > 0) deben tener un área padre.',
    path: ['parentId'],
  }
);

export const updateAreaSchema = areaBaseSchema.partial().extend({
  id: z.string().min(1),
});

export type CreateAreaInput = z.infer<typeof createAreaSchema>;
export type UpdateAreaInput = z.infer<typeof updateAreaSchema>;

// ────────────────────────────────────────────────────────────────
// WAREHOUSE SCHEMAS
// ────────────────────────────────────────────────────────────────

export const createWarehouseSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(100),
  maxCapacityKg: z.number().min(1, 'Capacidad debe ser mayor a 0').default(900),
  isEnabled: z.boolean().default(true),
});

export const updateWarehouseSchema = createWarehouseSchema.partial().extend({
  id: z.string().min(1),
});

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;

// ────────────────────────────────────────────────────────────────
// BOX SCHEMAS (campos reales del backend)
// ────────────────────────────────────────────────────────────────

export const createBoxSchema = z.object({
  qrCode: z.string()
    .min(1, 'Código QR es requerido')
    .max(100, 'Código QR no puede exceder 100 caracteres')
    .regex(/^[A-Za-z0-9_-]+$/, 'Solo letras, números, guiones y guiones bajos'),
  description: z.string()
    .max(500, 'Descripción no puede exceder 500 caracteres')
    .optional(),
  type: z.enum(['PEQUEÑA', 'NORMAL', 'GRANDE'] as const, {
    errorMap: () => ({ message: 'Tipo debe ser PEQUEÑA, NORMAL o GRANDE' }),
  }),
  currentWeightKg: z.number()
    .min(0, 'Peso debe ser mayor o igual a 0')
    .max(10000, 'Peso no puede exceder 10000 kg'),
  warehouseId: z.string()
    .min(1, 'Bodega es requerida'),
  status: z.enum(['DISPONIBLE', 'EN_REPARACION', 'DANADA', 'RETIRADA'] as const).default('DISPONIBLE'),
});

export const updateBoxSchema = z.object({
  description: z.string()
    .max(500, 'Descripción no puede exceder 500 caracteres')
    .optional(),
  type: z.enum(['PEQUEÑA', 'NORMAL', 'GRANDE'] as const).optional(),
  currentWeightKg: z.number()
    .min(0, 'Peso debe ser mayor o igual a 0')
    .max(10000, 'Peso no puede exceder 10000 kg')
    .optional(),
  status: z.enum(['DISPONIBLE', 'EN_REPARACION', 'DANADA', 'RETIRADA'] as const).optional(),
});

export const moveBoxSchema = z.object({
  warehouseId: z.string().min(1, 'Bodega destino es requerida'),
});

export const changeBoxStatusSchema = z.object({
  status: z.enum(['DISPONIBLE', 'EN_REPARACION', 'DANADA', 'RETIRADA'] as const, {
    errorMap: () => ({ message: 'Estado inválido' }),
  }),
});

export type CreateBoxInput = z.infer<typeof createBoxSchema>;
export type UpdateBoxInput = z.infer<typeof updateBoxSchema>;
export type MoveBoxInput = z.infer<typeof moveBoxSchema>;
export type ChangeBoxStatusInput = z.infer<typeof changeBoxStatusSchema>;

// ────────────────────────────────────────────────────────────────
// PRODUCT SCHEMAS
// ────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────
// PRODUCT SCHEMAS (Actualizado para entidad Product unificada)
// ────────────────────────────────────────────────────────────────

// Schema base sin validaciones condicionales
const productSchemaBase = z.object({
  kind: z.enum(['EQUIPMENT', 'MATERIAL', 'SPARE_PART'], {
    required_error: 'El tipo de producto es requerido',
  }),
  name: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  // ❌ SKU removido - lo genera el backend
  description: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  // ✅ currencyId y unitOfMeasureId ahora son IDs (UUIDs) no códigos
  currencyId: z.string()
    .min(1, 'La moneda es requerida'),
  monetaryValue: z.number()
    .min(0, 'El valor monetario debe ser mayor o igual a 0'),
  // ✅ isActive siempre es true en creación (el usuario no puede crear productos inactivos)
  isActive: z.boolean().optional().default(true),
  
  // Campos específicos de EQUIPMENT y SPARE_PART
  model: z.string()
    .max(100, 'El modelo no puede exceder 100 caracteres')
    .optional(),
  
  // Campos de dimensiones para EQUIPMENT
  weightValue: z.number().optional(),
  weightUnitId: z.string().optional(),
  widthValue: z.number().optional(),
  widthUnitId: z.string().optional(),
  heightValue: z.number().optional(),
  heightUnitId: z.string().optional(),
  lengthValue: z.number().optional(),
  lengthUnitId: z.string().optional(),
  
  // Campos específicos de MATERIAL
  unitOfMeasureId: z.string()
    .optional(),
  isHazardous: z.boolean().optional().default(false),
  categoryIds: z.array(z.string()).optional(),
  
  // Campos opcionales de negocio
  providerId: z.string().optional(),
  projectId: z.string().optional(),
});

// Schema de creación con validaciones condicionales
export const createProductSchema = productSchemaBase.refine(
  (data) => {
    // Validar que materiales tengan unitOfMeasureId
    if (data.kind === 'MATERIAL') {
      return !!data.unitOfMeasureId;
    }
    return true;
  },
  {
    message: 'La unidad de medida es requerida para materiales',
    path: ['unitOfMeasureId'],
  }
).refine(
  (data) => {
    // Validar que equipos y repuestos tengan model
    if (data.kind === 'EQUIPMENT' || data.kind === 'SPARE_PART') {
      return !!data.model;
    }
    return true;
  },
  {
    message: 'El modelo es requerido para equipos y repuestos',
    path: ['model'],
  }
).refine(
  (data) => {
    // Validar que equipos tengan dimensiones completas
    if (data.kind === 'EQUIPMENT') {
      const hasWeight = data.weightValue !== undefined && !!data.weightUnitId;
      const hasWidth = data.widthValue !== undefined && !!data.widthUnitId;
      const hasHeight = data.heightValue !== undefined && !!data.heightUnitId;
      const hasLength = data.lengthValue !== undefined && !!data.lengthUnitId;
      return hasWeight && hasWidth && hasHeight && hasLength;
    }
    return true;
  },
  {
    message: 'Los equipos requieren peso, ancho, alto y largo con sus unidades',
    path: ['weightValue'],
  }
);

// Schema de actualización (sin validaciones condicionales por ahora)
// ✅ El SKU sí existe en actualización (es readonly)
export const updateProductSchema = z.object({
  id: z.string().min(1),
  name: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim()
    .optional(),
  description: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  currencyId: z.string().optional(),
  monetaryValue: z.number()
    .min(0, 'El valor monetario debe ser mayor o igual a 0')
    .optional(),
  isActive: z.boolean().optional(),
  model: z.string()
    .max(100, 'El modelo no puede exceder 100 caracteres')
    .optional(),
  unitOfMeasureId: z.string().optional(),
  isHazardous: z.boolean().optional(),
  categoryIds: z.array(z.string()).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ────────────────────────────────────────────────────────────────
// PROVIDER SCHEMAS
// ────────────────────────────────────────────────────────────────

export const createProviderSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(100),
  status: z.enum([PROVIDER_STATUS.ACTIVO, PROVIDER_STATUS.INACTIVO]).default(PROVIDER_STATUS.ACTIVO),
  productsCount: z.number().default(0),
  tenantId: z.string().min(1),
});

export const updateProviderSchema = createProviderSchema.partial().extend({
  id: z.string().min(1),
});

export type CreateProviderInput = z.infer<typeof createProviderSchema>;
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;

// ────────────────────────────────────────────────────────────────
// PROJECT SCHEMAS
// ────────────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(100),
  code: z.string().min(1, 'Código es requerido').max(50),
  status: z.enum([PROJECT_STATUS.ACTIVO, PROJECT_STATUS.INACTIVO, PROJECT_STATUS.FINALIZADO])
    .default(PROJECT_STATUS.ACTIVO),
  productsCount: z.number().default(0),
  tenantId: z.string().min(1),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.string().min(1),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
