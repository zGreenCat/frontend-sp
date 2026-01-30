# Auditoría Completa del Módulo de Productos - SmartPack Backend

**Fecha de Auditoría:** 2024  
**Realizado por:** Backend Developer Senior  
**Stack Tecnológico:** NestJS + Prisma ORM + PostgreSQL

---

## Resumen Ejecutivo

El módulo de productos de SmartPack está completamente implementado y consta de **3 módulos principales** (Equipment, Materials, Spare Parts) respaldados por **3 módulos auxiliares** (Currencies, Units of Measure, Inventory History). El sistema incluye:

- **16 modelos de base de datos** interrelacionados
- **6 controladores REST** con 56+ endpoints
- **Sistema de auditoría dual**: cambios de catálogo + movimientos de inventario
- **Sistema multi-moneda** con tasas de cambio
- **Sistema multi-unidad** con clasificación por tipo (WEIGHT, VOLUME, LENGTH, etc.)
- **Gestión de inventario en cajas** con tracking completo
- **Categorización jerárquica** para materiales (padre/hijo)

---

## 1. Modelos y Entidades (Prisma Schema)

### 1.1 Equipment (Equipos)

**Ubicación:** `prisma/schema.prisma` (líneas 352-403)

```prisma
model Equipment {
  id                String   @id @default(uuid())
  name              String   @unique
  model             String?
  description       String?
  
  // Sistema de dimensiones con unidades
  weightValue       Decimal?
  weightUnitId      String?
  widthValue        Decimal?
  widthUnitId       String?
  heightValue       Decimal?
  heightUnitId      String?
  lengthValue       Decimal?
  lengthUnitId      String?
  
  // Sistema monetario
  monetaryValue     Decimal?
  currencyId        String
  
  // Flags de control
  isActive          Boolean  @default(true)
  
  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relaciones
  currency          Currency @relation(fields: [currencyId])
  spareParts        SparePart[]
  boxEquipment      BoxEquipment[]
  boxEquipmentSpareParts BoxEquipmentSparePart[]
  histories         EquipmentHistory[]
  weightUnit        UnitOfMeasure? @relation("EquipmentWeight")
  widthUnit         UnitOfMeasure? @relation("EquipmentWidth")
  heightUnit        UnitOfMeasure? @relation("EquipmentHeight")
  lengthUnit        UnitOfMeasure? @relation("EquipmentLength")
}
```

**Reglas de Negocio:**
- Nombre debe ser único
- Todas las dimensiones son **obligatorias** (weight, width, height, length) con sus respectivas unidades
- `monetaryValue` es opcional pero `currencyId` es obligatorio
- `isActive = false` representa baja lógica (soft delete)
- Relación 1:N con SparePart (un equipo puede tener múltiples repuestos)

---

### 1.2 Material (Materiales)

**Ubicación:** `prisma/schema.prisma` (líneas 545-582)

```prisma
model Material {
  id                     String   @id @default(uuid())
  name                   String   @unique
  description            String?
  
  // Unidad de medida principal
  unitOfMeasureId        String
  
  // Dimensiones opcionales
  weightValue            Decimal?
  weightUnitId           String?
  
  // Sistema monetario
  monetaryValue          Decimal?
  currencyId             String
  
  // Flags especiales
  isHazardous            Boolean  @default(false)
  isActive               Boolean  @default(true)
  
  // Timestamps
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  
  // Relaciones
  currency               Currency @relation(fields: [currencyId])
  unitOfMeasure          UnitOfMeasure @relation(fields: [unitOfMeasureId])
  weightUnit             UnitOfMeasure? @relation("MaterialWeight")
  categoryAssignments    MaterialCategoryAssignment[]
  boxMaterials           BoxMaterial[]
  histories              MaterialHistory[]
}
```

**Reglas de Negocio:**
- Nombre debe ser único
- `isHazardous` indica si el material es peligroso (importante para seguridad y regulaciones)
- Peso es **opcional** a diferencia de Equipment
- Relación N:N con MaterialCategory mediante tabla intermedia
- Endpoint especial para listar materiales peligrosos

---

### 1.3 SparePart (Repuestos)

**Ubicación:** `prisma/schema.prisma` (líneas 448-501)

```prisma
model SparePart {
  id                String   @id @default(uuid())
  name              String
  description       String?
  
  // Relación con Equipment
  equipmentId       String
  
  // Clasificación
  category          SparePartCategoryEnum
  
  // Dimensiones opcionales
  weightValue       Decimal?
  weightUnitId      String?
  widthValue        Decimal?
  widthUnitId       String?
  heightValue       Decimal?
  heightUnitId      String?
  lengthValue       Decimal?
  lengthUnitId      String?
  
  // Sistema monetario
  monetaryValue     Decimal?
  currencyId        String
  
  // Control
  isActive          Boolean  @default(true)
  
  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relaciones
  equipment         Equipment @relation(fields: [equipmentId])
  currency          Currency @relation(fields: [currencyId])
  boxEquipmentSpareParts BoxEquipmentSparePart[]
  histories         SparePartHistory[]
}

enum SparePartCategoryEnum {
  COMPONENT  // Componente del equipo
  SPARE      // Repuesto de reemplazo
}
```

**Reglas de Negocio:**
- Debe estar asociado a un Equipment (relación obligatoria)
- Todas las dimensiones son **opcionales**
- Categorización COMPONENT vs SPARE para diferenciar tipo de repuesto
- Nombre NO tiene constraint de unicidad global (puede repetirse entre equipos diferentes)

---

### 1.4 MaterialCategory (Categorías Jerárquicas)

**Ubicación:** `prisma/schema.prisma` (líneas 584-604)

```prisma
model MaterialCategory {
  id                String   @id @default(uuid())
  name              String   @unique
  description       String?
  
  // Jerarquía padre-hijo
  parentCategoryId  String?
  
  // Control
  isActive          Boolean  @default(true)
  
  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relaciones
  parentCategory    MaterialCategory? @relation("CategoryHierarchy", fields: [parentCategoryId])
  subcategories     MaterialCategory[] @relation("CategoryHierarchy")
  materialAssignments MaterialCategoryAssignment[]
}
```

**Reglas de Negocio:**
- Soporta estructura jerárquica multinivel (categorías y subcategorías)
- Un material puede pertenecer a múltiples categorías
- Endpoint especial `/material-categories/:parentCategoryId/subcategories` para navegar jerarquía

---

### 1.5 Sistema de Inventario en Cajas

#### BoxEquipment (Inventario de Equipos)

```prisma
model BoxEquipment {
  id              String   @id @default(uuid())
  boxId           String
  equipmentId     String
  quantity        Int      @default(1)
  isActive        Boolean  @default(true)
  assignedAt      DateTime @default(now())
  assignedByUserId String
  revokedAt       DateTime?
  
  // Relaciones
  box             Box @relation(fields: [boxId])
  equipment       Equipment @relation(fields: [equipmentId])
  assignedBy      User @relation(fields: [assignedByUserId])
  histories       BoxEquipmentHistory[]
}
```

#### BoxMaterial (Inventario de Materiales)

```prisma
model BoxMaterial {
  id              String   @id @default(uuid())
  boxId           String
  materialId      String
  quantity        Decimal  // Permite decimales para cantidades fraccionarias
  isActive        Boolean  @default(true)
  assignedAt      DateTime @default(now())
  assignedByUserId String
  revokedAt       DateTime?
  
  // Relaciones
  box             Box @relation(fields: [boxId])
  material        Material @relation(fields: [materialId])
  assignedBy      User @relation(fields: [assignedByUserId])
  histories       BoxMaterialHistory[]
}
```

**Reglas de Negocio:**
- `quantity` es Integer para Equipment, Decimal para Material (permite fracciones)
- `isActive = false` + `revokedAt` indican remoción del inventario
- Cada asignación/remoción genera registro en tabla History correspondiente
- El servicio `boxes.service.ts` recalcula el peso total de la caja automáticamente

---

### 1.6 Sistema de Auditoría (History Models)

El sistema implementa **6 tablas de auditoría**:

1. **EquipmentHistory** - Cambios en catálogo de equipos
2. **MaterialHistory** - Cambios en catálogo de materiales  
3. **SparePartHistory** - Cambios en catálogo de repuestos
4. **BoxEquipmentHistory** - Movimientos de equipos en cajas
5. **BoxMaterialHistory** - Movimientos de materiales en cajas
6. **BoxEquipmentSparePartHistory** - Movimientos de repuestos en cajas

**Estructura común:**

```prisma
model BoxEquipmentHistory {
  id                 String   @id @default(uuid())
  boxEquipmentId     String
  boxId              String
  equipmentId        String
  
  // Tracking de cambios
  actionType         InventoryActionType
  previousQuantity   Int?
  newQuantity        Int?
  
  // Auditoría
  performedByUserId  String
  reason             String?
  metadata           Json?     // Campos adicionales flexibles
  occurredAt         DateTime  @default(now())
  
  // Relación opcional con historial de caja
  boxHistoryId       String?
  boxHistory         BoxHistory? @relation(fields: [boxHistoryId])
}

enum InventoryActionType {
  ADD      // Agregar al inventario
  REMOVE   // Remover del inventario
  CONSUME  // Consumir (uso en operación)
  ADJUST   // Ajuste manual
  REVOKE   // Revocar asignación
}
```

**Reglas de Negocio:**
- Cada movimiento de inventario debe tener `reason` (opcional pero recomendado)
- `metadata` permite almacenar información adicional en formato JSON
- `actionType` define el tipo de movimiento
- `performedByUserId` registra quién realizó la acción
- Inmutabilidad: los registros de history nunca se eliminan

---

### 1.7 Módulos Auxiliares

#### Currency (Monedas)

```prisma
model Currency {
  id                  String   @id @default(uuid())
  code                String   @unique  // "USD", "CLP", "EUR"
  name                String
  symbol              String              // "$", "€", "£"
  countryCode         String?
  exchangeRateToUSD   Decimal  @default(1.0)
  isActive            Boolean  @default(true)
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  // Relaciones inversas
  equipment           Equipment[]
  materials           Material[]
  spareParts          SparePart[]
}
```

**Reglas de Negocio:**
- `code` debe ser único (ISO 4217)
- `exchangeRateToUSD` permite conversiones (base USD)
- Soft delete con `isActive`

#### UnitOfMeasure (Unidades de Medida)

```prisma
model UnitOfMeasure {
  id           String   @id @default(uuid())
  code         String   @unique  // "KG", "M", "L"
  name         String
  abbreviation String
  type         UnitTypeEnum
  isActive     Boolean  @default(true)
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

enum UnitTypeEnum {
  WEIGHT
  VOLUME
  LENGTH
  AREA
  TIME
  TEMPERATURE
  QUANTITY
}
```

**Reglas de Negocio:**
- Clasificación por tipo para evitar mezclar unidades incompatibles
- Usado en todas las dimensiones de Equipment/Material/SparePart

---

## 2. DTOs y Reglas de Validación

### 2.1 Equipment DTOs

#### CreateEquipmentDto

```typescript
export class CreateEquipmentDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  name: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // TODAS las dimensiones son OBLIGATORIAS
  @IsNotEmpty()
  @IsDecimal() // Stored as string for precision
  weightValue: string;

  @IsNotEmpty()
  @IsUUID('4')
  weightUnitId: string;

  @IsNotEmpty()
  @IsDecimal()
  widthValue: string;

  @IsNotEmpty()
  @IsUUID('4')
  widthUnitId: string;

  @IsNotEmpty()
  @IsDecimal()
  heightValue: string;

  @IsNotEmpty()
  @IsUUID('4')
  heightUnitId: string;

  @IsNotEmpty()
  @IsDecimal()
  lengthValue: string;

  @IsNotEmpty()
  @IsUUID('4')
  lengthUnitId: string;

  @IsOptional()
  @IsDecimal()
  monetaryValue?: string;

  @IsNotEmpty()
  @IsUUID('4')
  currencyId: string;
}
```

**Validaciones:**
- Todos los valores numéricos usan `@IsDecimal()` y se almacenan como strings para evitar pérdida de precisión
- Todas las UUIDs deben ser versión 4
- Nombre mínimo 3 caracteres
- Dimensiones son campos requeridos (no opcional)

---

### 2.2 Material DTOs

#### CreateMaterialDto

```typescript
export class CreateMaterialDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsUUID('4')
  unitOfMeasureId: string;

  // Peso es OPCIONAL para materiales
  @IsOptional()
  @IsDecimal()
  weightValue?: string;

  @IsOptional()
  @IsUUID('4')
  weightUnitId?: string;

  @IsOptional()
  @IsDecimal()
  monetaryValue?: string;

  @IsNotEmpty()
  @IsUUID('4')
  currencyId: string;

  // Flag especial para materiales peligrosos
  @IsNotEmpty()
  @IsBoolean()
  isHazardous: boolean;

  // Múltiples categorías permitidas
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];
}
```

**Validaciones:**
- `isHazardous` es campo requerido (boolean)
- `categoryIds` es array de UUIDs validado con `{ each: true }`
- Peso es opcional (a diferencia de Equipment)

---

### 2.3 SparePart DTOs

#### CreateSparePartDto

```typescript
export class CreateSparePartDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  // OBLIGATORIO: debe asociarse a un equipo
  @IsNotEmpty()
  @IsUUID('4')
  equipmentId: string;

  // OBLIGATORIO: categorización del repuesto
  @IsNotEmpty()
  @IsEnum(SparePartCategoryEnum)
  category: SparePartCategoryEnum;

  // TODAS las dimensiones son OPCIONALES
  @IsOptional()
  @IsDecimal()
  weightValue?: string;

  @IsOptional()
  @IsUUID('4')
  weightUnitId?: string;

  @IsOptional()
  @IsDecimal()
  widthValue?: string;

  @IsOptional()
  @IsUUID('4')
  widthUnitId?: string;

  @IsOptional()
  @IsDecimal()
  heightValue?: string;

  @IsOptional()
  @IsUUID('4')
  heightUnitId?: string;

  @IsOptional()
  @IsDecimal()
  lengthValue?: string;

  @IsOptional()
  @IsUUID('4')
  lengthUnitId?: string;

  @IsOptional()
  @IsDecimal()
  monetaryValue?: string;

  @IsNotEmpty()
  @IsUUID('4')
  currencyId: string;
}
```

**Validaciones:**
- `@IsEnum` para validar COMPONENT vs SPARE
- Todas las dimensiones son opcionales
- `equipmentId` obligatorio (debe existir el equipo)

---

### 2.4 Inventory DTOs (Boxes)

#### AddBoxEquipmentDto

```typescript
export class AddBoxEquipmentDto {
  @IsUUID()
  @IsNotEmpty()
  equipmentId: string;

  @IsNumber()
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  @IsNotEmpty()
  quantity: number; // Integer

  @IsOptional()
  @IsString()
  reason?: string;
}
```

#### AddBoxMaterialDto

```typescript
export class AddBoxMaterialDto {
  @IsUUID()
  @IsNotEmpty()
  materialId: string;

  @IsNumber()
  @Min(0.01, { message: 'La cantidad debe ser mayor a 0' })
  @IsNotEmpty()
  quantity: number; // Decimal (permite fracciones)

  @IsOptional()
  @IsString()
  reason?: string;
}
```

**Diferencias Clave:**
- Equipment: `@Min(1)` - cantidad entera mínima 1
- Material: `@Min(0.01)` - permite cantidades decimales (0.5 kg, 2.75 L, etc.)
- `reason` es opcional pero muy recomendado para auditoría

---

## 3. Lógica de Servicios y Reglas de Negocio

### 3.1 EquipmentService

**Ubicación:** `src/modules/equipment/services/equipment.service.ts`

**Validaciones en create():**
1. Verificar que el nombre sea único (`BadRequestException` si ya existe)
2. Validar que `currencyId` exista en la BD
3. Crear registro con todas las dimensiones requeridas

**Validaciones en update():**
1. Verificar que el equipment exista (`NotFoundException`)
2. Si se cambia el nombre, validar unicidad (excluyendo el ID actual)
3. Si se cambia `currencyId`, validar que exista

**Método remove():**
- Baja lógica: llama a `repository.deactivate(id)` que setea `isActive = false`
- NO elimina físicamente el registro

---

### 3.2 MaterialService

**Ubicación:** `src/modules/materials/services/material.service.ts`

**Validaciones en create():**
1. Nombre único
2. Validar `unitOfMeasureId` existe
3. Validar `currencyId` existe
4. **Validar TODAS las categorías** en `categoryIds` (loop que verifica cada una)
5. Crear relaciones N:N con categorías en tabla `MaterialCategoryAssignment`

**Métodos especiales:**
- `findHazardous()`: Retorna materiales con `isHazardous = true`
- `findByCategoryId()`: Busca materiales por categoría específica

**Validaciones en update():**
- Mismo flujo que create pero valida que el material exista primero
- Si se actualizan `categoryIds`, valida TODAS las nuevas categorías

---

### 3.3 SparePartService

**Ubicación:** `src/modules/spare-parts/services/spare-part.service.ts`

**Validaciones en create():**
1. Validar que `equipmentId` exista (llamada a `equipmentRepository.findOne`)
2. Validar que `currencyId` exista
3. Crear asociación con Equipment

**Método especial:**
- `findByEquipmentId()`: Retorna todos los repuestos de un equipo específico
  - Valida primero que el equipment exista
  - Muy útil para pantallas de detalle de equipment

---

### 3.4 BoxesService (Inventory Management)

**Ubicación:** `src/modules/boxes/services/boxes.service.ts`

**Método addEquipment():**
```typescript
async addEquipment(
  boxId: string,
  equipmentId: string,
  quantity: number,
  userId: string,
  reason?: string,
) {
  // 1. Validar que la caja exista
  // 2. Validar que el equipment exista
  // 3. Crear registro en BoxEquipment con cantidad
  // 4. Calcular peso total del equipment (weightValue * quantity)
  // 5. Actualizar peso total de la caja
  // 6. Crear registro en BoxEquipmentHistory con actionType = ADD
  // 7. Retornar caja actualizada
}
```

**Método removeEquipment():**
```typescript
async removeEquipment(
  boxId: string,
  boxEquipmentId: string,
  userId: string,
  reason?: string,
) {
  // 1. Buscar registro en BoxEquipment
  // 2. Validar que pertenezca a la caja correcta
  // 3. Setear isActive = false, revokedAt = now()
  // 4. Restar peso del equipment del peso total de la caja
  // 5. Crear registro en BoxEquipmentHistory con actionType = REMOVE
  // 6. Retornar caja actualizada
}
```

**Métodos similares:**
- `addMaterial()` - Igual lógica pero con Decimal quantity
- `removeMaterial()` - Igual lógica pero para materiales

**Reglas de Negocio Importantes:**
- Recalcula automáticamente el peso total de la caja
- Genera historial inmutable de cada operación
- Requiere `userId` para auditoría
- `reason` es opcional pero muy recomendado

---

### 3.5 MaterialCategoryService

**Ubicación:** `src/modules/materials/services/material-category.service.ts`

**Método findByParentId():**
- Busca todas las subcategorías de una categoría padre
- Permite navegar la jerarquía de categorías

**Validaciones:**
- Nombre único
- Si se especifica `parentCategoryId`, valida que exista
- Baja lógica con `isActive = false`

---

## 4. Endpoints del Módulo de Productos

### 4.1 Equipment Endpoints

**Controller:** `src/modules/equipment/controllers/equipment.controller.ts`

| Método | Ruta | Descripción | DTOs | Guards | Respuesta |
|--------|------|-------------|------|--------|-----------|
| POST | `/equipment` | Crear equipo | CreateEquipmentDto | JwtAuthGuard | EquipmentEntity |
| GET | `/equipment` | Listar equipos con filtros | GetEquipmentQueryDto | JwtAuthGuard | PaginatedResult\<EquipmentEntity\> |
| GET | `/equipment/:id` | Detalle de equipo | - | JwtAuthGuard | EquipmentEntity |
| PATCH | `/equipment/:id` | Actualizar equipo | UpdateEquipmentDto | JwtAuthGuard | EquipmentEntity |
| DELETE | `/equipment/:id` | Desactivar equipo (soft delete) | - | JwtAuthGuard | EquipmentEntity |

**Query Parameters en GET /equipment:**
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10)
- `search`: Búsqueda por nombre o modelo (case-insensitive)
- `isActive`: Filtrar por activos/inactivos
- `currencyId`: Filtrar por moneda

---

### 4.2 Material Endpoints

**Controller:** `src/modules/materials/controllers/material.controller.ts`

| Método | Ruta | Descripción | DTOs | Guards | Respuesta |
|--------|------|-------------|------|--------|-----------|
| POST | `/materials` | Crear material | CreateMaterialDto | JwtAuthGuard + **AdminGuard** | MaterialEntity |
| GET | `/materials` | Listar materiales con filtros | GetMaterialQueryDto | JwtAuthGuard | PaginatedResult\<MaterialEntity\> |
| GET | `/materials/hazardous` | Listar materiales peligrosos | PaginationDto | JwtAuthGuard | PaginatedResult\<MaterialEntity\> |
| GET | `/materials/:id` | Detalle de material | - | JwtAuthGuard | MaterialEntity |
| GET | `/materials/category/:categoryId` | Materiales por categoría | - | JwtAuthGuard | MaterialEntity[] |
| PATCH | `/materials/:id` | Actualizar material | UpdateMaterialDto | JwtAuthGuard | MaterialEntity |
| DELETE | `/materials/:id` | Desactivar material | - | JwtAuthGuard | MaterialEntity |

**Nota importante:** Solo ADMIN puede crear materiales (POST requiere AdminGuard adicional)

**Query Parameters en GET /materials:**
- `page`, `limit`: Paginación
- `search`: Búsqueda por nombre o descripción
- `unitOfMeasureId`: Filtrar por unidad de medida
- `currencyId`: Filtrar por moneda
- `isHazardous`: true/false
- `isActive`: true/false

---

### 4.3 SparePart Endpoints

**Controller:** `src/modules/spare-parts/controllers/spare-part.controller.ts`

| Método | Ruta | Descripción | DTOs | Guards | Respuesta |
|--------|------|-------------|------|--------|-----------|
| POST | `/spare-parts` | Crear repuesto | CreateSparePartDto | JwtAuthGuard | SparePartEntity |
| GET | `/spare-parts` | Listar repuestos con filtros | GetSparePartQueryDto | JwtAuthGuard | PaginatedResult\<SparePartEntity\> |
| GET | `/spare-parts/:id` | Detalle de repuesto | - | JwtAuthGuard | SparePartEntity |
| GET | `/spare-parts/equipment/:equipmentId` | Repuestos de un equipo | - | JwtAuthGuard | SparePartEntity[] |
| PATCH | `/spare-parts/:id` | Actualizar repuesto | UpdateSparePartDto | JwtAuthGuard | SparePartEntity |
| DELETE | `/spare-parts/:id` | Desactivar repuesto | - | JwtAuthGuard | SparePartEntity |

**Query Parameters en GET /spare-parts:**
- `page`, `limit`: Paginación
- `search`: Búsqueda por nombre o descripción
- `equipmentId`: Filtrar por equipo
- `category`: COMPONENT o SPARE
- `currencyId`: Filtrar por moneda
- `isActive`: true/false

---

### 4.4 Material Category Endpoints

**Controller:** `src/modules/materials/controllers/material-category.controller.ts`

| Método | Ruta | Descripción | DTOs | Guards | Respuesta |
|--------|------|-------------|------|--------|-----------|
| POST | `/material-categories` | Crear categoría | CreateMaterialCategoryDto | JwtAuthGuard | MaterialCategoryEntity |
| GET | `/material-categories` | Listar categorías | PaginationDto | JwtAuthGuard | PaginatedResult\<MaterialCategoryEntity\> |
| GET | `/material-categories/:id` | Detalle de categoría | - | JwtAuthGuard | MaterialCategoryEntity |
| GET | `/material-categories/:parentCategoryId/subcategories` | Subcategorías | - | JwtAuthGuard | MaterialCategoryEntity[] |
| PATCH | `/material-categories/:id` | Actualizar categoría | UpdateMaterialCategoryDto | JwtAuthGuard | MaterialCategoryEntity |
| DELETE | `/material-categories/:id` | Desactivar categoría | - | JwtAuthGuard | MaterialCategoryEntity |

---

### 4.5 Inventory Management Endpoints (Boxes)

**Controller:** `src/modules/boxes/controllers/boxes.controller.ts`

#### Gestión de Equipos en Cajas

| Método | Ruta | Descripción | DTOs | Guards | Respuesta |
|--------|------|-------------|------|--------|-----------|
| POST | `/boxes/:id/equipments` | Agregar equipo a caja | AddBoxEquipmentDto | JwtAuthGuard + RolesGuard (ADMIN, JEFE_AREA, SUPERVISOR) | BoxResponseDto |
| DELETE | `/boxes/:id/equipments/:equipmentAssignmentId` | Remover equipo de caja | RemoveBoxEquipmentDto | JwtAuthGuard + RolesGuard | BoxResponseDto |
| GET | `/boxes/:id/equipment-history` | Historial de equipos en caja | page, limit | JwtAuthGuard + RolesGuard | PaginatedResult\<BoxEquipmentHistory\> |

#### Gestión de Materiales en Cajas

| Método | Ruta | Descripción | DTOs | Guards | Respuesta |
|--------|------|-------------|------|--------|-----------|
| POST | `/boxes/:id/materials` | Agregar material a caja | AddBoxMaterialDto | JwtAuthGuard + RolesGuard (ADMIN, JEFE_AREA, SUPERVISOR) | BoxResponseDto |
| DELETE | `/boxes/:id/materials/:materialAssignmentId` | Remover material de caja | RemoveBoxMaterialDto | JwtAuthGuard + RolesGuard | BoxResponseDto |
| GET | `/boxes/:id/material-history` | Historial de materiales en caja | page, limit | JwtAuthGuard + RolesGuard | PaginatedResult\<BoxMaterialHistory\> |

#### Otros Endpoints de Boxes

| Método | Ruta | Descripción | DTOs | Guards | Respuesta |
|--------|------|-------------|------|--------|-----------|
| GET | `/boxes` | Listar cajas con filtros | BoxPaginationDto | JwtAuthGuard + RolesGuard | PaginatedResult\<BoxResponseDto\> |
| GET | `/boxes/qr/:qrCode` | Buscar caja por QR | - | JwtAuthGuard + RolesGuard | BoxResponseDto |
| GET | `/boxes/:id` | Detalle de caja con historial | - | JwtAuthGuard + RolesGuard | BoxDetailResponseDto |
| GET | `/boxes/:id/history` | Historial de modificaciones | page, limit, eventType | JwtAuthGuard + RolesGuard | PaginatedResult\<BoxHistoryResponseDto\> |
| GET | `/boxes/:id/spare-part-history` | Historial de repuestos | page, limit | JwtAuthGuard + RolesGuard | PaginatedResult\<BoxEquipmentSparePartHistory\> |
| POST | `/boxes` | Crear caja | CreateBoxDto | JwtAuthGuard + RolesGuard (ADMIN, JEFE_AREA) | BoxResponseDto |
| PATCH | `/boxes/:id` | Actualizar caja | UpdateBoxDto | JwtAuthGuard + RolesGuard (ADMIN, JEFE_AREA) | BoxResponseDto |
| PATCH | `/boxes/:id/move` | Mover caja a otra bodega | MoveBoxDto | JwtAuthGuard + RolesGuard (ADMIN, JEFE_AREA) | BoxResponseDto |
| PATCH | `/boxes/:id/status` | Cambiar estado de caja | UpdateStatusDto | JwtAuthGuard + RolesGuard | BoxResponseDto |
| PATCH | `/boxes/:id/deactivate` | Desactivar caja | - | JwtAuthGuard + RolesGuard (ADMIN, JEFE_AREA) | BoxResponseDto |

**Roles Permitidos:**
- **ADMIN**: Acceso total
- **JEFE_AREA**: CRUD de cajas + gestión de inventario
- **SUPERVISOR**: Solo lectura + agregar/remover items

---

### 4.6 Currency Endpoints (Módulo Auxiliar)

**Controller:** `src/modules/currencies/controllers/currency.controller.ts`

| Método | Ruta | Descripción | DTOs | Guards | Respuesta |
|--------|------|-------------|------|--------|-----------|
| POST | `/currencies` | Crear moneda | CreateCurrencyDto | JwtAuthGuard + AdminGuard | CurrencyEntity |
| GET | `/currencies` | Listar monedas | PaginationDto | Ninguno (público) | PaginatedResult\<CurrencyEntity\> |
| GET | `/currencies/:id` | Detalle de moneda | - | Ninguno (público) | CurrencyEntity |
| PATCH | `/currencies/:id` | Actualizar moneda | UpdateCurrencyDto | JwtAuthGuard + AdminGuard | CurrencyEntity |
| DELETE | `/currencies/:id` | Eliminar moneda | - | JwtAuthGuard + AdminGuard | CurrencyEntity |

**Nota:** GET endpoints son públicos (sin guards)

---

### 4.7 Unit of Measure Endpoints (Módulo Auxiliar)

**Controller:** `src/modules/units-of-measure/controllers/unit-of-measure.controller.ts`

| Método | Ruta | Descripción | DTOs | Guards | Respuesta |
|--------|------|-------------|------|--------|-----------|
| POST | `/units-of-measure` | Crear unidad | CreateUnitOfMeasureDto | JwtAuthGuard + AdminGuard | UnitOfMeasureEntity |
| GET | `/units-of-measure` | Listar unidades | GetUnitsOfMeasureQueryDto | Ninguno (público) | PaginatedResult\<UnitOfMeasureEntity\> |
| GET | `/units-of-measure/:id` | Detalle de unidad | - | Ninguno (público) | UnitOfMeasureEntity |
| PATCH | `/units-of-measure/:id` | Actualizar unidad | UpdateUnitOfMeasureDto | JwtAuthGuard + AdminGuard | UnitOfMeasureEntity |
| DELETE | `/units-of-measure/:id` | Eliminar unidad | - | JwtAuthGuard + AdminGuard | UnitOfMeasureEntity |

**Query Parameters en GET /units-of-measure:**
- `page`, `limit`: Paginación
- `type`: Filtrar por tipo (WEIGHT, VOLUME, LENGTH, etc.)

**Nota:** GET endpoints son públicos (sin guards)

---

## 5. Relaciones con Otros Módulos

### 5.1 Módulo Users

**Relaciones:**
- `BoxEquipment.assignedByUserId` → User
- `BoxMaterial.assignedByUserId` → User
- `BoxEquipmentHistory.performedByUserId` → User
- `BoxMaterialHistory.performedByUserId` → User
- Todos los History models registran el usuario que realizó la acción

**Guards utilizados:**
- `JwtAuthGuard`: Valida token JWT del usuario
- `AdminGuard`: Valida que el usuario tenga rol ADMIN
- `RolesGuard`: Valida roles específicos (ADMIN, JEFE_AREA, SUPERVISOR)

---

### 5.2 Módulo Boxes (Warehouses)

**Integración bidireccional:**
- Boxes contiene referencias a Equipment, Material, SparePart
- BoxesService gestiona el inventario de productos
- Cada caja tiene:
  - `boxEquipment[]`: Equipos asignados
  - `boxMaterial[]`: Materiales asignados
  - `boxEquipmentSparePart[]`: Repuestos asignados
  - Peso total calculado automáticamente

**Flujo típico:**
1. Usuario crea Equipment/Material/SparePart en catálogo
2. Usuario asigna productos a una caja específica mediante `/boxes/:id/equipments` o `/boxes/:id/materials`
3. Sistema registra movimiento en tablas History
4. Sistema actualiza peso total de la caja

---

### 5.3 Módulo Warehouses (Bodegas)

**Relación indirecta:**
- Box pertenece a Warehouse
- Products se almacenan en Boxes
- Por transitividad: Products → Box → Warehouse

**Consultas típicas:**
- "¿Qué equipos hay en la Bodega A?" → JOIN Box → BoxEquipment → Equipment WHERE Box.warehouseId = 'A'

---

## 6. Sistema de Auditoría y Trazabilidad

### 6.1 Tipos de Auditoría

#### Auditoría de Catálogo (3 tablas)
- **EquipmentHistory**: Cambios en equipos (create, update, delete)
- **MaterialHistory**: Cambios en materiales
- **SparePartHistory**: Cambios en repuestos

**Campos comunes:**
- `actionType`: CREATE, UPDATE, DELETE
- `changedFields`: JSON con campos modificados
- `previousValues`: JSON con valores anteriores
- `newValues`: JSON con valores nuevos
- `performedByUserId`: Quién hizo el cambio
- `occurredAt`: Timestamp del cambio

#### Auditoría de Inventario (3 tablas)
- **BoxEquipmentHistory**: Movimientos de equipos en cajas
- **BoxMaterialHistory**: Movimientos de materiales en cajas
- **BoxEquipmentSparePartHistory**: Movimientos de repuestos en cajas

**Campos comunes:**
- `actionType`: ADD, REMOVE, CONSUME, ADJUST, REVOKE
- `previousQuantity`: Cantidad anterior
- `newQuantity`: Cantidad nueva
- `performedByUserId`: Quién hizo el movimiento
- `reason`: Motivo del movimiento (opcional)
- `metadata`: JSON con datos adicionales
- `occurredAt`: Timestamp del movimiento

### 6.2 Endpoints de Consulta de Historial

| Endpoint | Descripción | Filtros |
|----------|-------------|---------|
| GET `/boxes/:id/history` | Historial general de la caja | eventType, page, limit |
| GET `/boxes/:id/equipment-history` | Movimientos de equipos | page, limit |
| GET `/boxes/:id/material-history` | Movimientos de materiales | page, limit |
| GET `/boxes/:id/spare-part-history` | Movimientos de repuestos | page, limit |

**Nota:** No existen endpoints para historial de catálogo (Equipment/Material/SparePart individual) en los controladores actuales, solo para movimientos de inventario en cajas.

---

## 7. Observaciones y Cambios Recientes

### 7.1 Sistema de Dimensiones

**Diseño actual:**
- Cada dimensión tiene 2 campos: `value` (Decimal) + `unitId` (UUID)
- Ejemplo: `weightValue` + `weightUnitId`
- Permite flexibilidad total: diferentes equipos pueden usar diferentes unidades

**Ventaja:** Precisión y flexibilidad  
**Desventaja:** Complejidad en queries (necesita JOIN con UnitOfMeasure para mostrar abreviación)

### 7.2 Sistema Multi-Moneda

**Características:**
- Todas las entidades de producto tienen `monetaryValue` + `currencyId`
- Currency tiene `exchangeRateToUSD` para conversiones
- No hay conversión automática en endpoints (debe hacerse en frontend/BFF)

**Recomendación:** Si se necesitan reportes consolidados en una sola moneda, implementar endpoint de conversión en backend.

### 7.3 Soft Delete vs Hard Delete

**Implementación actual:**
- Todos los endpoints DELETE hacen soft delete (`isActive = false`)
- Los registros nunca se eliminan físicamente
- Queries por defecto **NO filtran** por `isActive` automáticamente

**Recomendación:** En frontend, siempre filtrar por `isActive: true` a menos que se quiera mostrar items desactivados.

### 7.4 Validación de Referencias

**Muy importante:**
- Todos los servicios validan que las foreign keys existan antes de crear/actualizar
- Si un `currencyId`, `unitOfMeasureId`, `equipmentId`, o `categoryId` no existe, se lanza `BadRequestException`
- Esto garantiza integridad referencial más allá de las constraints de BD

### 7.5 Sistema de Categorías Jerárquicas

**Implementación:**
- MaterialCategory soporta jerarquía infinita mediante `parentCategoryId`
- Un Material puede tener múltiples categorías (N:N)
- Endpoint especial `/material-categories/:id/subcategories` para navegar jerarquía

**Caso de uso:**
```
Materiales Eléctricos (padre)
  ├── Cables (hijo nivel 1)
  │   ├── Cable de Cobre (hijo nivel 2)
  │   └── Cable de Aluminio (hijo nivel 2)
  └── Conectores (hijo nivel 1)
```

### 7.6 Gestión de Materiales Peligrosos

**Flag especial:** `isHazardous`
- Endpoint dedicado: GET `/materials/hazardous`
- Importante para cumplimiento de regulaciones de seguridad
- Debe mostrarse con warning en UI

### 7.7 Sistema de Repuestos vs Componentes

**Enum SparePartCategoryEnum:**
- **COMPONENT**: Parte integral del equipo (viene de fábrica)
- **SPARE**: Repuesto de reemplazo (se compra aparte)

**Uso:** Permite diferenciar entre inventario de componentes instalados vs repuestos en stock.

---

## 8. Recomendaciones para el Frontend

### 8.1 Formularios de Creación

**Equipment:**
- Requiere TODAS las dimensiones (weight, width, height, length) con selector de unidad
- Selector de moneda obligatorio
- Validar que las unidades seleccionadas sean del tipo correcto (WEIGHT para peso, LENGTH para ancho/alto/largo)

**Material:**
- Checkbox para `isHazardous` (obligatorio)
- Selector múltiple para categorías (opcional)
- Peso es opcional (a diferencia de Equipment)

**SparePart:**
- Selector de Equipment (obligatorio)
- Radio buttons para COMPONENT vs SPARE
- Todas las dimensiones opcionales

### 8.2 Listados con Filtros

**Filtros comunes a implementar:**
- Búsqueda por texto (name, description)
- Filtro por moneda
- Filtro por activo/inactivo
- Paginación (page, limit)

**Filtros específicos:**
- Material: `isHazardous`, `unitOfMeasureId`, `categoryId`
- SparePart: `equipmentId`, `category`
- Equipment: `currencyId`

### 8.3 Gestión de Inventario

**Flujo recomendado para agregar producto a caja:**
1. Mostrar lista de productos disponibles (Equipment/Material/SparePart)
2. Permitir seleccionar producto y especificar cantidad
3. Solicitar `reason` (campo de texto opcional pero recomendado)
4. Llamar a POST `/boxes/:id/equipments` o `/boxes/:id/materials`
5. Mostrar éxito y actualizar tabla de inventario de la caja

**Flujo para remover producto de caja:**
1. Mostrar productos asignados a la caja (BoxEquipment/BoxMaterial)
2. Botón "Remover" en cada item
3. Solicitar `reason` en modal de confirmación
4. Llamar a DELETE `/boxes/:id/equipments/:assignmentId` con `boxEquipmentId` en body
5. Actualizar tabla

### 8.4 Visualización de Historial

**Pantalla de auditoría de caja:**
- Tab "Historial General": GET `/boxes/:id/history`
- Tab "Equipos": GET `/boxes/:id/equipment-history`
- Tab "Materiales": GET `/boxes/:id/material-history`
- Tab "Repuestos": GET `/boxes/:id/spare-part-history`

**Campos a mostrar:**
- Fecha/hora (occurredAt)
- Usuario (performedByUserId → join con User)
- Acción (actionType: ADD, REMOVE, etc.)
- Cantidad anterior → Cantidad nueva
- Razón (reason)

### 8.5 Conversión de Unidades y Monedas

**Importante:**
- Backend NO realiza conversiones automáticas
- Frontend debe obtener lista de monedas (GET `/currencies`) y usar `exchangeRateToUSD`
- Para mostrar en moneda local: `valorUSD * moneda.exchangeRateToUSD`
- Para unidades de medida: implementar tabla de conversión en frontend o crear servicio de conversión en backend

### 8.6 Validaciones de Frontend

**Validar antes de enviar:**
- Números decimales con precisión correcta (usar strings en JSON para evitar pérdida de precisión)
- UUIDs válidos en selects
- Cantidades mínimas: Equipment >= 1, Material > 0
- Dimensiones opcionales vs obligatorias según tipo de producto

---

## 9. Estructura de Archivos

```
src/modules/
├── equipment/
│   ├── controllers/equipment.controller.ts
│   ├── services/equipment.service.ts
│   ├── repositories/equipment.repository.ts
│   ├── entities/equipment.entity.ts
│   ├── dto/
│   │   ├── create-equipment.dto.ts
│   │   ├── update-equipment.dto.ts
│   │   ├── get-equipment-query.dto.ts
│   │   └── index.ts
│   ├── types/equipment-types.ts
│   └── equipment.module.ts
│
├── materials/
│   ├── controllers/
│   │   ├── material.controller.ts
│   │   └── material-category.controller.ts
│   ├── services/
│   │   ├── material.service.ts
│   │   └── material-category.service.ts
│   ├── repositories/
│   │   ├── material.repository.ts
│   │   └── material-category.repository.ts
│   ├── entities/material.entity.ts
│   ├── dto/ (6 archivos)
│   ├── types/material-types.ts
│   └── materials.module.ts
│
├── spare-parts/
│   ├── controllers/spare-part.controller.ts
│   ├── services/spare-part.service.ts
│   ├── repositories/spare-part.repository.ts
│   ├── entities/spare-part.entity.ts
│   ├── dto/ (4 archivos)
│   ├── types/spare-part-types.ts
│   └── spare-parts.module.ts
│
├── boxes/ (gestión de inventario)
│   ├── controllers/boxes.controller.ts
│   ├── services/boxes.service.ts
│   ├── dto/ (12 archivos incluyen add-box-inventory.dto.ts)
│   └── boxes.module.ts
│
├── currencies/
│   ├── controllers/currency.controller.ts
│   ├── services/currency.service.ts
│   ├── repositories/currency.repository.ts
│   └── dto/
│
└── units-of-measure/
    ├── controllers/unit-of-measure.controller.ts
    ├── services/unit-of-measure.service.ts
    ├── repositories/unit-of-measure.repository.ts
    └── dto/
```

---

## 10. Conclusiones

### ✅ Fortalezas del Sistema

1. **Arquitectura sólida:** Separación clara en capas (Controller → Service → Repository)
2. **Validaciones robustas:** Uso extensivo de class-validator con mensajes claros
3. **Auditoría completa:** Sistema dual de historial (catálogo + inventario) con inmutabilidad
4. **Flexibilidad:** Sistema multi-moneda y multi-unidad permite internacionalización
5. **Integridad referencial:** Validaciones a nivel de servicio además de BD
6. **Soft delete:** Permite recuperación de datos y auditoría histórica

### ⚠️ Áreas de Mejora

1. **Endpoints de historial de catálogo:** No existen endpoints para consultar EquipmentHistory/MaterialHistory/SparePartHistory individuales
2. **Conversión automática:** No hay endpoint para convertir valores entre monedas
3. **Búsqueda avanzada:** No hay endpoint de búsqueda global por productos (requiere consultas a 3 endpoints separados)
4. **Validación de unidades:** No se valida que las unidades seleccionadas sean del tipo correcto (ej: usar WEIGHT unit para peso, no LENGTH)
5. **Documentación API:** Falta documentación Swagger más detallada con ejemplos de request/response

### 📊 Métricas del Sistema

- **Modelos de base de datos:** 16
- **Controladores REST:** 6
- **Endpoints totales:** 56+
- **DTOs:** 25+
- **Servicios:** 7
- **Módulos NestJS:** 6

---

## Apéndice A: Enums y Tipos

### SparePartCategoryEnum
```typescript
enum SparePartCategoryEnum {
  COMPONENT = 'COMPONENT',  // Componente del equipo
  SPARE = 'SPARE'           // Repuesto de reemplazo
}
```

### InventoryActionType
```typescript
enum InventoryActionType {
  ADD = 'ADD',           // Agregar al inventario
  REMOVE = 'REMOVE',     // Remover del inventario
  CONSUME = 'CONSUME',   // Consumir (uso en operación)
  ADJUST = 'ADJUST',     // Ajuste manual
  REVOKE = 'REVOKE'      // Revocar asignación
}
```

### UnitTypeEnum
```typescript
enum UnitTypeEnum {
  WEIGHT = 'WEIGHT',           // Peso: kg, g, lb, oz
  VOLUME = 'VOLUME',           // Volumen: L, mL, gal
  LENGTH = 'LENGTH',           // Longitud: m, cm, ft, in
  AREA = 'AREA',               // Área: m², ft²
  TIME = 'TIME',               // Tiempo: h, min, s
  TEMPERATURE = 'TEMPERATURE', // Temperatura: °C, °F
  QUANTITY = 'QUANTITY'        // Cantidad: unidades, piezas
}
```

---

## Apéndice B: Ejemplos de Requests

### Crear Equipment
```json
POST /equipment
{
  "name": "Compresor Industrial XYZ",
  "model": "CI-2024-PRO",
  "description": "Compresor de alta capacidad para uso industrial",
  "weightValue": "450.50",
  "weightUnitId": "uuid-kg",
  "widthValue": "120.0",
  "widthUnitId": "uuid-cm",
  "heightValue": "180.0",
  "heightUnitId": "uuid-cm",
  "lengthValue": "100.0",
  "lengthUnitId": "uuid-cm",
  "monetaryValue": "15000.00",
  "currencyId": "uuid-usd"
}
```

### Crear Material
```json
POST /materials
{
  "name": "Ácido Sulfúrico",
  "description": "Ácido concentrado al 98%",
  "unitOfMeasureId": "uuid-litro",
  "weightValue": "1.84",
  "weightUnitId": "uuid-kg",
  "monetaryValue": "50.00",
  "currencyId": "uuid-clp",
  "isHazardous": true,
  "categoryIds": [
    "uuid-categoria-quimicos",
    "uuid-categoria-acidos"
  ]
}
```

### Agregar Equipment a Caja
```json
POST /boxes/:boxId/equipments
{
  "equipmentId": "uuid-compresor",
  "quantity": 2,
  "reason": "Asignación para proyecto construcción Fase 1"
}
```

### Remover Material de Caja
```json
DELETE /boxes/:boxId/materials/:assignmentId
{
  "boxMaterialId": "uuid-asignacion",
  "reason": "Consumido en operación de mantenimiento preventivo"
}
```

---

## Apéndice C: Verificación de Coherencia Código vs Auditoría

**Fecha de Verificación:** 30 de Enero, 2026  
**Verificado por:** Backend Developer Senior

### ✅ Coherencia Confirmada

#### Modelos Prisma
- **Equipment**: Modelo en `schema.prisma` líneas 352-403 coincide con la documentación
  - ⚠️ **Diferencia detectada**: Campo `name` NO tiene constraint `@unique` en el schema actual
  - Campo `model` es **obligatorio** (no nullable) en schema, pero la auditoría lo marca como opcional
  - Campo `monetaryValue` tiene `@default(0)` en lugar de ser completamente opcional
  
- **Material**: Modelo en líneas 545-582 coincide
  - ⚠️ **Diferencia detectada**: Campo `name` NO tiene constraint `@unique` en el schema actual
  - Campo `monetaryValue` tiene `@default(0)` en lugar de ser opcional
  
- **SparePart**: Modelo en líneas 448-501 coincide
  - Todas las dimensiones son opcionales ✓
  - Campo `monetaryValue` tiene `@default(0)`

- **Currency**: Modelo en líneas 289-312 coincide
  - ✅ Campos adicionales detectados: `lastRateUpdateAt` (no documentado en auditoría)
  - `exchangeRateToUSD` es **opcional** (puede ser NULL)

- **UnitOfMeasure**: Modelo en líneas 318-350 coincide
  - ⚠️ Campo `type` es String en lugar de Enum `UnitTypeEnum` (el enum no existe en Prisma)

#### DTOs
- **CreateEquipmentDto**: Coincide 100% con el código
  - Todas las dimensiones (weight, width, height, length) son **obligatorias** ✓
  - Campo `model` es **obligatorio** ✓
  - `monetaryValue` es **opcional** ✓

- **CreateMaterialDto**: Coincide 100%
  - `isHazardous` es obligatorio ✓
  - `categoryIds` es array opcional ✓
  - Peso es opcional ✓

- **CreateSparePartDto**: Coincide 100%
  - Todas las dimensiones son **opcionales** ✓
  - `category` enum es obligatorio ✓

#### Controladores y Endpoints
Todos los endpoints documentados existen en el código:

**Equipment Controller** (`/equipment`):
- ✅ POST `/equipment` - Crear equipo
- ✅ GET `/equipment` - Listar con filtros
- ✅ GET `/equipment/:id` - Detalle
- ✅ PATCH `/equipment/:id` - Actualizar
- ✅ DELETE `/equipment/:id` - Desactivar (soft delete)

**Material Controller** (`/materials`):
- ✅ POST `/materials` - Crear material (requiere AdminGuard)
- ✅ GET `/materials` - Listar con filtros
- ✅ GET `/materials/hazardous` - Materiales peligrosos
- ✅ GET `/materials/:id` - Detalle
- ✅ GET `/materials/category/:categoryId` - Por categoría
- ✅ PATCH `/materials/:id` - Actualizar
- ✅ DELETE `/materials/:id` - Desactivar

**SparePart Controller** (`/spare-parts`):
- ✅ POST `/spare-parts` - Crear repuesto
- ✅ GET `/spare-parts` - Listar con filtros
- ✅ GET `/spare-parts/:id` - Detalle
- ✅ GET `/spare-parts/equipment/:equipmentId` - Por equipo
- ✅ PATCH `/spare-parts/:id` - Actualizar
- ✅ DELETE `/spare-parts/:id` - Desactivar

**Material Category Controller** (`/material-categories`):
- ✅ Todos los endpoints documentados existen

**Boxes Controller** (inventario):
- ✅ Todos los endpoints de inventario documentados existen

#### Servicios y Reglas de Negocio

**EquipmentService**:
- ✅ Valida que `currencyId` exista
- ⚠️ **Diferencia**: El servicio valida unicidad de `name` pero el schema NO tiene constraint `@unique`
- ✅ Soft delete con `isActive = false`

**MaterialService**:
- ✅ Valida `unitOfMeasureId`, `currencyId`, y todas las `categoryIds`
- ⚠️ **Diferencia**: El servicio valida unicidad de `name` pero el schema NO tiene constraint `@unique`
- ✅ Método `findHazardous()` implementado
- ✅ Método `findByCategoryId()` implementado

**SparePartService**:
- ✅ Valida que `equipmentId` exista
- ✅ Valida que `currencyId` exista
- ✅ Método `findByEquipmentId()` implementado

### 🔴 Diferencias Críticas Detectadas

#### 1. Constraint de Unicidad en Nombres
**Ubicación**: `prisma/schema.prisma`  
**Impacto**: Alto - Afecta integridad de datos

**Estado actual del schema:**
```prisma
model Equipment {
  id   String @id @default(uuid())
  name String  // NO tiene @unique
  ...
}

model Material {
  id   String @id @default(uuid())
  name String  // NO tiene @unique
  ...
}
```

**Lo que hace el servicio:**
- `EquipmentService.create()` llama a `repository.findByName()` y lanza `BadRequestException` si existe
- `MaterialService.create()` hace lo mismo

**Problema**: La validación de unicidad solo existe en capa de servicio, NO en base de datos. Esto permite:
- Race conditions (2 requests simultáneas pueden crear nombres duplicados)
- Inconsistencia si se insertan datos directamente en BD

**Recomendación**: Agregar constraint `@unique` en schema:
```prisma
name String @unique
```

#### 2. Campo Model Obligatorio en Equipment
**Ubicación**: `prisma/schema.prisma` línea ~354  
**Impacto**: Medio

**Schema actual:**
```prisma
model String  // NO nullable
```

**Auditoría decía:**
```prisma
model String?  // Optional
```

**DTO actual** (correcto):
```typescript
@IsString()
@MinLength(1)
model: string;  // Obligatorio
```

**Estado**: El código está correcto, la auditoría estaba desactualizada.

#### 3. MonetaryValue con Default en lugar de Opcional
**Ubicación**: Todos los modelos de productos  
**Impacto**: Bajo - Solo semántico

**Schema actual:**
```prisma
monetaryValue Decimal @default(0)
```

**Auditoría decía:**
```prisma
monetaryValue Decimal?  // Opcional (nullable)
```

**Estado**: El schema usa default 0 en lugar de NULL. El DTO lo maneja como opcional y el repository asigna "0" si no viene.

#### 4. Enum UnitTypeEnum no Existe
**Ubicación**: `prisma/schema.prisma`  
**Impacto**: Bajo

**Schema actual:**
```prisma
type String  // Simple string
```

**Auditoría mencionaba:**
```prisma
type UnitTypeEnum  // Enum con WEIGHT, VOLUME, LENGTH, etc.
```

**Estado**: El tipo es String libre, no hay validación a nivel de BD. La validación debe hacerse en capa de aplicación.

#### 5. Campo lastRateUpdateAt en Currency
**Ubicación**: `prisma/schema.prisma` línea ~298  
**Impacto**: Bajo - Campo adicional no documentado

**Schema actual:**
```prisma
model Currency {
  ...
  exchangeRateToUSD  Decimal?
  lastRateUpdateAt   DateTime?  // ← NO estaba en auditoría
  ...
}
```

**Estado**: Campo adicional para tracking de actualizaciones de tasas de cambio.

#### 6. MaterialCategory.level
**Ubicación**: `prisma/schema.prisma`  
**Impacto**: Bajo

**Schema actual:**
```prisma
model MaterialCategory {
  ...
  level Int @default(1)  // ← NO estaba en auditoría
  ...
}
```

**Estado**: Campo para indicar nivel de profundidad en jerarquía (1 = root, 2 = hijo, etc.).

### 📋 Lista de Endpoints Completa y Verificada

#### Equipment (5 endpoints)
| Método | Ruta | Body/Query | Guards | Respuesta |
|--------|------|------------|--------|-----------|
| POST | `/equipment` | CreateEquipmentDto | JwtAuthGuard | EquipmentEntity |
| GET | `/equipment` | GetEquipmentQueryDto (page, limit, search, isActive, currencyId) | JwtAuthGuard | PaginatedResult |
| GET | `/equipment/:id` | - | JwtAuthGuard | EquipmentEntity |
| PATCH | `/equipment/:id` | UpdateEquipmentDto | JwtAuthGuard | EquipmentEntity |
| DELETE | `/equipment/:id` | - | JwtAuthGuard | EquipmentEntity |

#### Materials (7 endpoints)
| Método | Ruta | Body/Query | Guards | Respuesta |
|--------|------|------------|--------|-----------|
| POST | `/materials` | CreateMaterialDto | JwtAuthGuard + **AdminGuard** | MaterialEntity |
| GET | `/materials` | GetMaterialQueryDto | JwtAuthGuard | PaginatedResult |
| GET | `/materials/hazardous` | PaginationDto | JwtAuthGuard | PaginatedResult |
| GET | `/materials/:id` | - | JwtAuthGuard | MaterialEntity |
| GET | `/materials/category/:categoryId` | - | JwtAuthGuard | MaterialEntity[] |
| PATCH | `/materials/:id` | UpdateMaterialDto | JwtAuthGuard | MaterialEntity |
| DELETE | `/materials/:id` | - | JwtAuthGuard | MaterialEntity |

#### Spare Parts (6 endpoints)
| Método | Ruta | Body/Query | Guards | Respuesta |
|--------|------|------------|--------|-----------|
| POST | `/spare-parts` | CreateSparePartDto | JwtAuthGuard | SparePartEntity |
| GET | `/spare-parts` | GetSparePartQueryDto | JwtAuthGuard | PaginatedResult |
| GET | `/spare-parts/:id` | - | JwtAuthGuard | SparePartEntity |
| GET | `/spare-parts/equipment/:equipmentId` | - | JwtAuthGuard | SparePartEntity[] |
| PATCH | `/spare-parts/:id` | UpdateSparePartDto | JwtAuthGuard | SparePartEntity |
| DELETE | `/spare-parts/:id` | - | JwtAuthGuard | SparePartEntity |

#### Material Categories (6 endpoints)
| Método | Ruta | Body/Query | Guards | Respuesta |
|--------|------|------------|--------|-----------|
| POST | `/material-categories` | CreateMaterialCategoryDto | JwtAuthGuard | MaterialCategoryEntity |
| GET | `/material-categories` | PaginationDto | JwtAuthGuard | PaginatedResult |
| GET | `/material-categories/:id` | - | JwtAuthGuard | MaterialCategoryEntity |
| GET | `/material-categories/:parentCategoryId/subcategories` | - | JwtAuthGuard | MaterialCategoryEntity[] |
| PATCH | `/material-categories/:id` | UpdateMaterialCategoryDto | JwtAuthGuard | MaterialCategoryEntity |
| DELETE | `/material-categories/:id` | - | JwtAuthGuard | MaterialCategoryEntity |

#### Boxes - Inventory Management (14 endpoints)
| Método | Ruta | Body/Query | Guards | Respuesta |
|--------|------|------------|--------|-----------|
| POST | `/boxes/:id/equipments` | AddBoxEquipmentDto | JwtAuthGuard + RolesGuard (ADMIN, JEFE_AREA, SUPERVISOR) | BoxResponseDto |
| POST | `/boxes/:id/materials` | AddBoxMaterialDto | JwtAuthGuard + RolesGuard | BoxResponseDto |
| DELETE | `/boxes/:id/equipments/:equipmentAssignmentId` | RemoveBoxEquipmentDto | JwtAuthGuard + RolesGuard | BoxResponseDto |
| DELETE | `/boxes/:id/materials/:materialAssignmentId` | RemoveBoxMaterialDto | JwtAuthGuard + RolesGuard | BoxResponseDto |
| GET | `/boxes/:id/equipment-history` | page, limit | JwtAuthGuard + RolesGuard | PaginatedResult |
| GET | `/boxes/:id/material-history` | page, limit | JwtAuthGuard + RolesGuard | PaginatedResult |
| GET | `/boxes/:id/spare-part-history` | page, limit | JwtAuthGuard + RolesGuard | PaginatedResult |
| GET | `/boxes` | BoxPaginationDto | JwtAuthGuard + RolesGuard | PaginatedResult |
| GET | `/boxes/qr/:qrCode` | - | JwtAuthGuard + RolesGuard | BoxResponseDto |
| GET | `/boxes/:id` | - | JwtAuthGuard + RolesGuard | BoxDetailResponseDto |
| GET | `/boxes/:id/history` | page, limit, eventType | JwtAuthGuard + RolesGuard | PaginatedResult |
| POST | `/boxes` | CreateBoxDto | JwtAuthGuard + RolesGuard (ADMIN, JEFE_AREA) | BoxResponseDto |
| PATCH | `/boxes/:id` | UpdateBoxDto | JwtAuthGuard + RolesGuard (ADMIN, JEFE_AREA) | BoxResponseDto |
| PATCH | `/boxes/:id/deactivate` | - | JwtAuthGuard + RolesGuard (ADMIN, JEFE_AREA) | BoxResponseDto |

#### Currencies (5 endpoints)
| Método | Ruta | Body/Query | Guards | Respuesta |
|--------|------|------------|--------|-----------|
| POST | `/currencies` | CreateCurrencyDto | JwtAuthGuard + AdminGuard | CurrencyEntity |
| GET | `/currencies` | PaginationDto | **Ninguno** (público) | PaginatedResult |
| GET | `/currencies/:id` | - | **Ninguno** (público) | CurrencyEntity |
| PATCH | `/currencies/:id` | UpdateCurrencyDto | JwtAuthGuard + AdminGuard | CurrencyEntity |
| DELETE | `/currencies/:id` | - | JwtAuthGuard + AdminGuard | CurrencyEntity |

#### Units of Measure (5 endpoints)
| Método | Ruta | Body/Query | Guards | Respuesta |
|--------|------|------------|--------|-----------|
| POST | `/units-of-measure` | CreateUnitOfMeasureDto | JwtAuthGuard + AdminGuard | UnitOfMeasureEntity |
| GET | `/units-of-measure` | GetUnitsOfMeasureQueryDto (type) | **Ninguno** (público) | PaginatedResult |
| GET | `/units-of-measure/:id` | - | **Ninguno** (público) | UnitOfMeasureEntity |
| PATCH | `/units-of-measure/:id` | UpdateUnitOfMeasureDto | JwtAuthGuard + AdminGuard | UnitOfMeasureEntity |
| DELETE | `/units-of-measure/:id` | - | JwtAuthGuard + AdminGuard | UnitOfMeasureEntity |

**Total: 48 endpoints** (no 56+ como se indicaba originalmente)

---

## 🎯 RESUMEN PARA FRONTEND

### Concepto de "Producto" en SmartPack

En SmartPack, **NO existe una entidad única llamada "Producto"**. En su lugar, el sistema maneja **3 tipos de entidades de inventario**:

#### 1. **Equipment (Equipos)** 🔧
- Bienes durables, activos físicos de alto valor
- **Características únicas**:
  - Todas las dimensiones son **obligatorias** (peso, ancho, alto, largo)
  - Campo `model` es **obligatorio**
  - Pueden tener **SpareParts** asociados (relación 1:N)
  - Se rastrean por unidad (cantidad entera)
- **Casos de uso**: Compresores, generadores, maquinaria pesada, vehículos

#### 2. **Material (Materiales)** 🧪
- Consumibles, insumos, materia prima
- **Características únicas**:
  - Flag `isHazardous` **obligatorio** (materiales peligrosos)
  - Endpoint especial para listar solo peligrosos: `GET /materials/hazardous`
  - Puede tener **múltiples categorías** (N:N)
  - Dimensiones son **opcionales**
  - Se rastrean por cantidad **decimal** (permite fracciones: 2.5 kg, 10.75 L)
  - Requiere `unitOfMeasureId` obligatorio (kg, L, m³, etc.)
- **Casos de uso**: Dinamita, combustibles, lubricantes, químicos, pinturas

#### 3. **SparePart (Repuestos)** ⚙️
- Componentes o repuestos de equipos
- **Características únicas**:
  - Siempre asociado a un `Equipment` específico (campo obligatorio)
  - Categorización: `COMPONENT` (viene con equipo) vs `SPARE` (repuesto de reemplazo)
  - Todas las dimensiones son **opcionales**
  - Endpoint especial: `GET /spare-parts/equipment/:equipmentId`
- **Casos de uso**: Válvulas, filtros, correas, baterías, neumáticos

### Arquitectura de Soporte

#### **Currency (Monedas)** 💱
- Catálogo de monedas con tasas de cambio
- Campo `exchangeRateToUSD` para conversiones (base USD)
- Campo `lastRateUpdateAt` indica última actualización de tasa
- **Endpoints son públicos** (GET sin autenticación)
- Uso: Todos los productos tienen `currencyId` obligatorio + `monetaryValue` (default 0)

#### **UnitOfMeasure (Unidades de Medida)** 📏
- Catálogo de unidades: kg, L, m, cm, un, etc.
- Campo `type` indica categoría: "WEIGHT", "VOLUME", "LENGTH", "QUANTITY", etc.
- **Endpoints son públicos** (GET sin autenticación)
- Uso: Equipment/Material/SparePart referencian unidades para dimensiones

#### **MaterialCategory (Categorías de Materiales)** 📂
- Jerarquía multinivel (padre → hijos → nietos...)
- Campo `level` indica profundidad (1 = raíz)
- Campo `parentCategoryId` apunta al padre (NULL si es raíz)
- Endpoint especial: `GET /material-categories/:id/subcategories`
- Un material puede estar en múltiples categorías simultáneamente

### Flujos Principales para Frontend

#### 🔹 Flujo 1: Crear un Equipo
```typescript
// 1. Obtener catálogos necesarios (solo 1 vez, cachear en app)
GET /currencies              // Sin auth
GET /units-of-measure        // Sin auth, filtrar por type: WEIGHT, LENGTH

// 2. Crear equipo
POST /equipment
Authorization: Bearer {token}
{
  "name": "Compresor Industrial",
  "model": "CAT-2500X",          // OBLIGATORIO
  "description": "...",
  "weightValue": "450.5",        // OBLIGATORIO
  "weightUnitId": "uuid-kg",     // OBLIGATORIO
  "widthValue": "120",           // OBLIGATORIO
  "widthUnitId": "uuid-cm",      // OBLIGATORIO
  "heightValue": "180",          // OBLIGATORIO
  "heightUnitId": "uuid-cm",     // OBLIGATORIO
  "lengthValue": "100",          // OBLIGATORIO
  "lengthUnitId": "uuid-cm",     // OBLIGATORIO
  "monetaryValue": "15000",      // OPCIONAL
  "currencyId": "uuid-usd"       // OBLIGATORIO
}

// 3. Crear repuestos asociados (opcional)
POST /spare-parts
{
  "equipmentId": "{id del equipo creado}",
  "name": "Filtro de aire",
  "category": "SPARE",           // COMPONENT o SPARE
  "currencyId": "uuid-usd",
  // dimensiones todas opcionales
}
```

#### 🔹 Flujo 2: Crear un Material
```typescript
// 1. Obtener catálogos
GET /currencies
GET /units-of-measure        // Para peso y unidad de medida principal
GET /material-categories     // Para asignar categorías

// 2. Crear material
POST /materials
Authorization: Bearer {token} + ADMIN role required!
{
  "name": "Ácido Sulfúrico",
  "description": "Ácido concentrado 98%",
  "unitOfMeasureId": "uuid-litro",  // OBLIGATORIO
  "weightValue": "1.84",            // OPCIONAL
  "weightUnitId": "uuid-kg",        // OPCIONAL (si se da weightValue)
  "monetaryValue": "50",            // OPCIONAL
  "currencyId": "uuid-clp",         // OBLIGATORIO
  "isHazardous": true,              // OBLIGATORIO ⚠️
  "categoryIds": [                   // OPCIONAL (array)
    "uuid-categoria-quimicos",
    "uuid-categoria-acidos"
  ]
}
```

⚠️ **IMPORTANTE**: Solo usuarios con rol **ADMIN** pueden crear materiales (guard adicional).

#### 🔹 Flujo 3: Listar Productos con Filtros
```typescript
// Equipos
GET /equipment?page=1&limit=20&search=compresor&isActive=true&currencyId={uuid}
Authorization: Bearer {token}

// Materiales peligrosos (caso especial)
GET /materials/hazardous?page=1&limit=20
Authorization: Bearer {token}

// Materiales por categoría
GET /materials/category/{categoryId}
Authorization: Bearer {token}

// Repuestos de un equipo específico
GET /spare-parts/equipment/{equipmentId}
Authorization: Bearer {token}
```

#### 🔹 Flujo 4: Gestión de Inventario en Cajas
```typescript
// Agregar equipo a caja
POST /boxes/{boxId}/equipments
Authorization: Bearer {token}
Roles: ADMIN, JEFE_AREA, SUPERVISOR
{
  "equipmentId": "uuid-equipo",
  "quantity": 2,                  // Entero >= 1
  "reason": "Asignación proyecto X"  // OPCIONAL pero recomendado
}

// Agregar material a caja
POST /boxes/{boxId}/materials
{
  "materialId": "uuid-material",
  "quantity": 10.5,               // Decimal > 0
  "reason": "Stock inicial"
}

// Remover equipo
DELETE /boxes/{boxId}/equipments/{assignmentId}
Body: {
  "boxEquipmentId": "uuid-asignacion",
  "reason": "Equipo enviado a reparación"
}

// Ver historial de movimientos
GET /boxes/{boxId}/equipment-history?page=1&limit=10
GET /boxes/{boxId}/material-history?page=1&limit=10
GET /boxes/{boxId}/spare-part-history?page=1&limit=10
```

### Campos Obligatorios en UI

#### 📋 Listados (Tablas)
Mostrar como mínimo:
- **Nombre** (name)
- **Estado** (isActive) → Badge: "Activo" / "Inactivo"
- **Valor monetario** (monetaryValue + currency.symbol)
- **Específicos por tipo**:
  - Equipment: `model`
  - Material: `isHazardous` → Badge rojo si es true ⚠️
  - SparePart: `category`, `equipment.name`

#### 📄 Detalle
Mostrar:
- Todos los campos del listado
- **Dimensiones completas** con unidades (ej: "450.5 kg", "120 cm")
- **Moneda**: Símbolo + Código (ej: "USD $15,000.00")
- **Timestamps**: createdAt, updatedAt
- **Relaciones**:
  - Equipment → Botón "Ver repuestos" → Lista de SpareParts
  - Material → Chips con categorías
  - SparePart → Link al Equipment padre
- **Acciones**:
  - Botón "Agregar a caja" → Modal con selector de caja + cantidad + reason
  - Botón "Editar"
  - Botón "Desactivar" (soft delete)

#### ⚠️ Validaciones en Formularios
```typescript
// Equipment
- name: min 3 chars
- model: required, min 1 char
- ALL dimensions: required (weight, width, height, length) + unitId
- currencyId: required

// Material
- name: min 3 chars
- unitOfMeasureId: required
- currencyId: required
- isHazardous: required (checkbox/toggle)
- categoryIds: optional array
- weight: optional (pero si se da, weightUnitId es required)

// SparePart
- equipmentId: required (select)
- name: min 3 chars
- category: required (radio: COMPONENT / SPARE)
- currencyId: required
- ALL dimensions: optional
```

### 🔐 Permisos y Guards

| Acción | Guard Requerido | Roles Permitidos |
|--------|----------------|------------------|
| Listar productos | JwtAuthGuard | Todos autenticados |
| Ver detalle | JwtAuthGuard | Todos autenticados |
| Crear Equipment | JwtAuthGuard | Todos autenticados |
| Crear Material | JwtAuthGuard + **AdminGuard** | Solo ADMIN |
| Crear SparePart | JwtAuthGuard | Todos autenticados |
| Actualizar productos | JwtAuthGuard | Todos autenticados |
| Desactivar productos | JwtAuthGuard | Todos autenticados |
| Agregar a caja | JwtAuthGuard + RolesGuard | ADMIN, JEFE_AREA, SUPERVISOR |
| Remover de caja | JwtAuthGuard + RolesGuard | ADMIN, JEFE_AREA, SUPERVISOR |
| Ver historial | JwtAuthGuard + RolesGuard | ADMIN, JEFE_AREA, SUPERVISOR |
| Crear categorías | JwtAuthGuard | Todos autenticados |
| CRUD Currencies | JwtAuthGuard + AdminGuard (POST/PATCH/DELETE) | Solo ADMIN (crear/editar), GET público |
| CRUD Units | JwtAuthGuard + AdminGuard (POST/PATCH/DELETE) | Solo ADMIN (crear/editar), GET público |

### 🎨 Recomendaciones de UX

#### Badges y Visual Cues
- **isActive = false** → Badge gris "Inactivo"
- **isHazardous = true** → Badge rojo con ícono ⚠️ "Peligroso"
- **Material category** → Chips de colores
- **SparePart COMPONENT** → Badge azul "Componente"
- **SparePart SPARE** → Badge verde "Repuesto"

#### Pantallas Recomendadas
1. **Inventario General** (tab switcher)
   - Tab "Equipos" → GET /equipment
   - Tab "Materiales" → GET /materials
   - Tab "Repuestos" → GET /spare-parts
   - Filtros compartidos: búsqueda, estado, moneda

2. **Detalle de Equipo**
   - Datos del equipo
   - Sección "Repuestos" → GET /spare-parts/equipment/:id
   - Sección "Historial" → Movimientos en cajas
   - Botón "Agregar a caja"

3. **Detalle de Material**
   - Datos del material
   - Badge grande si es peligroso
   - Categorías (con navegación a otros materiales de misma categoría)
   - Sección "Historial"
   - Botón "Agregar a caja"

4. **Gestión de Caja**
   - Inventario actual (equipos + materiales + repuestos)
   - Botones "Agregar equipo", "Agregar material"
   - Para cada item: botón "Remover" con modal de confirmación + campo reason
   - Tabs de historial (equipos, materiales, repuestos)

### 📊 Conversión de Monedas
El backend **NO hace conversión automática**. Para mostrar valores en moneda local:

```typescript
// 1. Cargar todas las monedas
const currencies = await fetch('/currencies').then(r => r.json());

// 2. Para convertir un producto
function convertToLocal(product, targetCurrencyCode) {
  const sourceCurrency = currencies.find(c => c.id === product.currencyId);
  const targetCurrency = currencies.find(c => c.code === targetCurrencyCode);
  
  // Convertir a USD primero
  const valueInUSD = product.monetaryValue / sourceCurrency.exchangeRateToUSD;
  
  // Luego a moneda objetivo
  const valueInTarget = valueInUSD * targetCurrency.exchangeRateToUSD;
  
  return {
    value: valueInTarget,
    symbol: targetCurrency.symbol,
    code: targetCurrency.code
  };
}
```

### 🚨 Consideraciones Importantes

1. **Nombres NO son únicos en BD**: La validación solo existe en capa de servicio. Si 2 requests simultáneas crean el mismo nombre, puede haber duplicados. El frontend debe mostrar error del backend.

2. **Soft Delete**: Los registros con `isActive = false` siguen en BD. Filtrar siempre por `isActive: true` en queries a menos que quieras mostrar items desactivados.

3. **Historial Inmutable**: Todas las tablas `*History` son append-only (nunca se editan ni eliminan). Usar para auditoría y compliance.

4. **Cantidad en Inventario**:
   - Equipment: Integer (1, 2, 3...)
   - Material: Decimal (0.5, 10.75, 100...)
   - Validar en frontend antes de enviar

5. **Field `reason` en Inventory**: Opcional pero muy recomendado para auditoría. Pedir siempre al usuario.

6. **Moneda default 0**: Si no se envía `monetaryValue`, el backend guarda 0 (no NULL). Considerar esto en UI.

---

**Fin de Auditoría Verificada**

Este documento ha sido verificado contra el código fuente actual (30 de Enero, 2026). Para implementar el frontend, seguir los flujos y validaciones descritos en el "RESUMEN PARA FRONTEND".
