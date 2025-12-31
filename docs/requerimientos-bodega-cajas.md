# Módulo: Bodega

## BODEGA-001 – Crear bodega o lugar de almacenamiento

- **ID:** BODEGA-001  
- **Módulo:** Bodega  
- **Usuario:** Administrador  
- **Nombre del requerimiento:** Crear bodega o lugar de almacenamiento  

### Descripción

El sistema debe permitir al usuario crear una nueva bodega o lugar de almacenamiento válida y
debe mantener la información de:

- Nombre  
- Capacidad máxima (por ahora en kg)  
- Estado operativo (habilitado/inhabilitado)  
- Opcionalmente, un Área asociada  
- Opcionalmente, un Usuario con rol de supervisor a cargo  

Si no se ingresa capacidad máxima, la predeterminada debe ser **900 kg**.  
El estado por defecto es **Habilitado**.  
El nombre debe ser **único** dentro de su ámbito.

### Validación

- El área debe estar **activa** al momento de asociarse la bodega en ella.


---

## BODEGA-002 – Historial y Trazabilidad de bodega

- **ID:** BODEGA-002  
- **Módulo:** Bodega  
- **Usuario:** Supervisor  
- **Nombre del requerimiento:** Historial y Trazabilidad de bodega  

### Descripción

El sistema debe permitir registrar cada movimiento que afecte a una bodega y permitir al usuario
consultarlo con filtros.

Los movimientos considerados son:

- Entradas  
- Salidas  
- Ajustes  
- Conteos  

Cada registro debe almacenar, al menos:

- Fecha y hora  
- Usuario que hace el movimiento  
- Tipo de movimiento  
- Bodega afectada  
- Identificación de las cajas afectadas  
- Cantidad afectada  
- Documento de referencia (según aplique)  
- Notas o descripción  

### Validación

- (Implícito en el texto) Debe existir un registro en el historial por cada movimiento válido.
- Debe permitir consultas filtrando por criterios como fechas, tipo de movimiento, usuario, etc.  
  (los filtros detallados se explicitan más adelante en el documento, pero este requerimiento fija la base).


---

## BODEGA-003 – Editar bodega o lugar de almacenamiento

- **ID:** BODEGA-003  
- **Módulo:** Bodega  
- **Usuario:** Jefe de área  
- **Nombre del requerimiento:** Editar Bodega o lugar de almacenamiento  

### Descripción

El sistema debe permitir editar datos de una bodega existente:

- Nombre  
- Capacidad máxima (kg)  
- Estado operativo  
- Área asociada  
- Usuario asociado  

La edición debe:

- Preservar la **trazabilidad** (quién, cuándo y qué cambió).  
- Aplicar las mismas reglas de negocio que en la creación.  
- Validar impactos sobre **stock** y operaciones en curso.

### Validación

- El nombre debe ser **único**.  
- La capacidad máxima debe cambiarse en concordancia con el cálculo total del peso del stock actual al cambiarse (no puede quedar por debajo de lo almacenado).  
- El estado operativo puede ser solo **habilitado** o **deshabilitado**.  
- Si se asigna una nueva área a la bodega, debe ser un área **existente y activa**.


---

# Módulo: Caja

> Nota: el documento reutiliza el ID **CAJA-002** para dos requerimientos diferentes  
> (Historial/Trazabilidad y Visualización). Aquí se muestran tal como están.

## CAJA-001 – Registro y Edición Caja

- **ID:** CAJA-001  
- **Módulo:** Caja  
- **Usuario:** (no especificado expresamente, pero orientado a usuarios con permisos sobre cajas)  
- **Nombre del requerimiento:** Registro y Edición Caja  

### Descripción

El sistema debe permitir la **gestión completa** de las Cajas, incluyendo:

- Creación  
- Consulta  
- Actualización  
- Baja lógica  

Para cada Caja se debe mantener:

- Información de identificación  
- Descripción  
- Tipo  
- Estado  
- Costo unitario  
- Moneda asociada  

Además:

- Debe mantener, para cada Caja, el **tiempo transcurrido entre cada movimiento de materiales** (ingreso/salida).  
- Debe reflejar el **stock disponible** de cada Caja y su distribución en distintas ubicaciones operativas.  
- Debe registrar en un **historial** todas las acciones relevantes asociadas a las Cajas para trazabilidad y auditoría.  
- Debe impedir la **eliminación física** de Cajas y, en su lugar, soportar la **baja lógica**.

### Validación

- El sistema debe mantener, en el inventario y asociado al historial, los **tiempos transcurridos** entre cada alta, modificación, movimiento de inventario, ajuste de stock o baja lógica de una caja.  
- El sistema **no** debe permitir dar de baja lógicamente una Caja que mantenga stock disponible en cualquier ubicación.  
- El sistema **no** debe permitir la modificación del **código identificador principal** de la Caja una vez creada.  
- El sistema debe exigir **justificación** cuando se modifique el costo unitario o la moneda de una Caja.  
- Antes de guardar los cambios, debe mostrar un **Modal de confirmación** con el mensaje:  
  - “¿Está seguro de realizar la modificación?”  
- El sistema debe mantener el historial de eventos como información **no editable** por usuarios estándar.


---

## CAJA-002 – Historial y Trazabilidad de Modificaciones de Cajas

- **ID:** CAJA-002  
- **Módulo:** Caja  
- **Usuario:** (orientado a usuarios con permisos de auditoría / supervisión)  
- **Nombre del requerimiento:** Historial y Trazabilidad de Modificaciones de Cajas  

### Descripción

El sistema debe registrar de forma automática **todas las modificaciones** realizadas sobre una Caja.

Para cada evento debe almacenar:

- Usuario responsable  
- Fecha y hora  
- Tipo de evento  
- Valor anterior  
- Valor nuevo  

(incorporando la medición del tiempo transcurrido entre acciones asociadas al movimiento de materiales del inventario).

Debe:

- Registrar cambios en datos maestros (descripción, tipo, costo unitario, moneda, estado).  
- Registrar movimientos y ajustes de inventario.  
- Permitir la **consulta del historial** filtrando por:
  - Caja  
  - Rango de fechas  
  - Usuario responsable  
  - Tipo de evento  
  - Ubicación involucrada  
- Permitir la **exportación** del historial a archivo descargable (por ejemplo, Excel o CSV) para fines de auditoría.

### Validación

- El sistema debe generar un evento de historial para las siguientes acciones:
  - Creación de Caja  
  - Actualización de datos maestros  
  - Movimiento de stock  
  - Ajuste de stock  
  - Baja lógica  
- El sistema debe exigir el ingreso de una **justificación** cuando el evento implique:
  - Modificación de stock  
  - Modificación de costo unitario / moneda  
- El sistema debe impedir la **eliminación directa** de los registros históricos.  
- Debe permitir la consulta del historial asociado a una Caja específica en **orden cronológico**.  
- Debe permitir a usuarios autorizados obtener una **vista consolidada** de todos los ajustes de stock ejecutados en un periodo.


---

## CAJA-003 – Visualización de Caja  
_(segunda tarjeta con el mismo ID en el ERS)_

- **ID:** CAJA-003
- **Módulo:** Caja  
- **Usuario:** (usuarios que consultan detalle de cajas)  
- **Nombre del requerimiento:** Visualización de Caja  

### Descripción

El sistema debe permitir la **visualización completa** de una Caja mediante una ficha detallada.

Al consultar una Caja, el sistema debe mostrar en una sola vista:

1. Datos maestros de la Caja.  
2. Inventario actual por ubicación.  
3. Costo total calculado de la Caja en base a su contenido.  
4. Historial de modificaciones y movimientos asociados a esa Caja.  
5. Tiempos asociados a los movimientos de inventario de la caja.  

Objetivo: que el usuario pueda entender el **estado actual**, el **valor económico** y la
**trazabilidad operacional** de la Caja sin tener que navegar por múltiples pantallas.

### Validación

- El sistema debe permitir buscar y seleccionar una Caja por **código, descripción o categoría**.  
- Debe poder mostrar el **costo total consolidado** aplicando conversión de moneda y presentando el valor en una **moneda base** definida por la empresa.  
- Debe permitir visualizar el **desglose de costo** por ítem contenido en la Caja (ítem, cantidad, costo unitario, subtotal convertido).  
- Debe mostrar el **historial** de la Caja ordenado cronológicamente (más reciente primero), indicando para cada evento:
  - Fecha y hora del evento (y el tiempo entre cambios de inventario)  
  - Usuario responsable  
  - Tipo de evento (creación de Caja, modificación de datos, movimiento de stock, ajuste de inventario, baja lógica, etc.).  
