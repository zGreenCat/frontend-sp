# Módulo: Bodega

## BODEGA-001 – Crear bodega o lugar de almacenamiento

- **ID:** BODEGA-001  
- **Módulo:** Bodega  
- **Usuario:** Administrador  
- **Nombre del requerimiento:** Crear bodega o lugar de almacenamiento  

### Descripción

El sistema debe permitir registrar una nueva bodega o lugar de almacenamiento, guardando al menos:

- Nombre  
- Capacidad máxima (en kg; por defecto 900 kg si no se indica)  
- Estado operativo (habilitado / deshabilitado; por defecto habilitado)  
- Opcionalmente, un Área asociada  
- Opcionalmente, un usuario con rol de Supervisor a cargo  

El nombre de la bodega debe ser único dentro de su contexto.

### Validación

- Solo se puede asociar una bodega a un área que esté activa.  
- La capacidad máxima no puede ser negativa ni cero.  
- El estado inicial debe ser “habilitado” si no se indica lo contrario.  


---

## BODEGA-002 – Historial y trazabilidad de bodega

- **ID:** BODEGA-002  
- **Módulo:** Bodega  
- **Usuario:** Supervisor  
- **Nombre del requerimiento:** Historial y trazabilidad de bodega  

### Descripción

El sistema debe registrar cada movimiento que afecte a una bodega y permitir su consulta con filtros.  
Los movimientos considerados incluyen, entre otros:

- Entradas  
- Salidas  
- Ajustes  
- Conteos  

Cada registro de movimiento debe almacenar como mínimo:

- Fecha y hora  
- Usuario que ejecuta el movimiento  
- Tipo de movimiento  
- Bodega afectada  
- Identificación de las cajas implicadas  
- Cantidad afectada  
- Documento de referencia (si aplica)  
- Notas o descripción  

La vista de consulta del historial debe:

- Mostrar el detalle de los movimientos  
- Permitir filtros por:
  - Rango de fechas  
  - Tipo de movimiento  
  - Usuario  
  - Área/Bodega  
  - Documento  
  - Texto libre  
- Permitir ordenar por fecha y cantidad  
- Incluir paginación  
- Permitir exportar el historial a CSV y XLSX  

El registro del movimiento debe generarse automáticamente cuando ocurre el movimiento.

### Validación

- Se debe mantener la trazabilidad completa de cada movimiento, incluyendo la marca de tiempo.  
- Solo se consideran válidos los movimientos realizados cuando área, bodega y usuario están activos.  
- Cada movimiento válido genera exactamente un registro en la tabla de historial.  
- Si ocurre un problema durante la transacción:
  - No se debe modificar el estado real de la bodega.
  - Se debe registrar como movimiento fallido o manejar el error evitando inconsistencias.  


---

## BODEGA-003 – Editar bodega o lugar de almacenamiento

- **ID:** BODEGA-003  
- **Módulo:** Bodega  
- **Usuario:** Jefe de área  
- **Nombre del requerimiento:** Editar bodega o lugar de almacenamiento  

### Descripción

El sistema debe permitir modificar una bodega existente, incluyendo:

- Nombre  
- Capacidad máxima (kg)  
- Estado operativo  
- Área asociada  
- Usuario asociado (Supervisor u otro rol autorizado)  

La edición debe:

- Mantener trazabilidad de quién hizo el cambio, cuándo y qué valores se modificaron.  
- Respetar las mismas reglas de negocio utilizadas en la creación de bodega.  
- Considerar los impactos sobre el stock y las operaciones en curso.  

### Validación

- El nombre de la bodega debe seguir siendo único.  
- Si se modifica la capacidad máxima, el nuevo valor debe ser consistente con el peso total del stock actual (no puede quedar por debajo de lo que ya está almacenado).  
- El estado operativo solo puede ser “habilitado” o “deshabilitado”.  
- Si se cambia el Área asociada:
  - El Área nueva debe existir y estar activa.  
- Debe registrarse auditoría del cambio (usuario que modifica, fecha/hora y valores antes/después).  


---

# Módulo: Proyecto

## PROY-001 – Crear proyecto

- **ID:** PROY-001  
- **Módulo:** Proyecto  
- **Usuario:** Administrador / Jefe de área  
- **Nombre del requerimiento:** Crear proyecto  

### Descripción

El sistema debe permitir registrar un nuevo proyecto indicando como obligatorios:

- Nombre  
- Código  

Al crear un proyecto:

- El proyecto queda en estado **Activo** por defecto.  
- Se aplica validación reactiva, mostrando errores en color rojo cuando falten campos o sean inválidos.  
- Si el código está duplicado, se muestra el mensaje:  
  - **“El código ingresado ya existe”**  
- Ante creación exitosa, se muestra un Toast:  
  - **“Proyecto creado exitosamente”**  
- Ante error de servidor, se muestra un Toast en rojo:  
  - **“Error al procesar la operación de proyecto”**  
- Se guarda el usuario que creó el proyecto.

### Validación

- No se puede crear un proyecto sin nombre ni código.  
- El código debe ser único (normalizando mayúsculas/minúsculas y espacios).  
- El estado inicial siempre debe ser **Activo**.  
- No se debe permitir eliminar físicamente el registro del proyecto ( sólo baja lógica / cambio de estado ).  


---

## PROY-002 – Listar proyectos

- **ID:** PROY-002  
- **Módulo:** Proyecto  
- **Usuario:** Administrador / Jefe de área / Supervisor  
- **Nombre del requerimiento:** Listar proyectos  

### Descripción

El sistema debe listar los proyectos existentes y permitir:

- Búsqueda por texto libre (nombre o código).  
- Filtros por estado:
  - **Activo**
  - **Inactivo**
  - **Finalizado**  
- Tabla con paginación y barra de búsqueda.  
- Filtros de estado combinables entre sí.  

Acciones disponibles:

- Botones de acción (crear, editar, finalizar, inactivar) visibles solo para **Administrador** y **Jefe de área**.  
- Proyectos en estado **Inactivo** o **Finalizado** solo se muestran cuando están incluidos en los filtros.  
- Ante errores, se muestra un Toast rojo:  
  - **“Error al procesar la operación de proyecto”**  

Permisos:

- **Administrador / Jefe de área:** acceso completo (incluye acciones).  
- **Supervisor:** solo lectura (sin acceso a acciones de creación/edición/estado).  

### Validación

- La búsqueda debe ser insensible a mayúsculas y minúsculas.  
- Los filtros de estado deben combinarse correctamente (ej: “Activo + Finalizado”).  
- Proyectos en estado **Inactivo** o **Finalizado**:
  - No pueden editarse sus datos principales, solo reactivarse (volver a **Activo**) cuando las reglas de negocio lo permitan.  


---

## PROY-003 – Ver detalle de proyecto

- **ID:** PROY-003  
- **Módulo:** Proyecto  
- **Usuario:** Administrador / Jefe de área / Supervisor  
- **Nombre del requerimiento:** Ver detalle de proyecto  

### Descripción

El sistema debe mostrar el detalle de un proyecto específico, incluyendo:

- ID del proyecto  
- Nombre  
- Código  
- Estado (Activo / Inactivo / Finalizado)  
- Fecha de creación  
- Fecha de última modificación  
- Usuario que creó el proyecto  
- Usuario que realizó la última modificación  
- Cantidad de productos asociados  

La vista de detalle debe ser principalmente de solo lectura y:

- Usar pestañas, por ejemplo:
  - **Información general**
  - **Productos asociados**
  - **Historial de cambios**  
- Mostrar el estado con un color distintivo:
  - Verde: **Activo**  
  - Gris: **Inactivo**  
  - Azul: **Finalizado**  
- Cuando el ID no exista, mostrar un Toast rojo:  
  - **“Proyecto no encontrado”**  

Permisos:

- Todos los roles (Administrador, Jefe de área, Supervisor) pueden ver el detalle.  
- Las acciones como editar / finalizar / inactivar solo se muestran para **Administrador** y **Jefe de área**.  

### Validación

- Se debe verificar que el ID del proyecto exista antes de mostrar información.  
- Si el proyecto tiene productos asociados en uso, debe mostrarse una advertencia en la vista (por ejemplo, un banner o mensaje destacado).  


---

## PROY-004 – Editar proyecto

- **ID:** PROY-004  
- **Módulo:** Proyecto  
- **Usuario:** Administrador / Jefe de área  
- **Nombre del requerimiento:** Editar proyecto  

### Descripción

El sistema debe permitir modificar datos de un proyecto y su estado.  
Acciones posibles:

- Editar:
  - Nombre  
  - Código  
- Cambiar estado:
  - **Activo**  
  - **Inactivo**  
  - **Finalizado**  

El formulario de edición debe incluir validaciones reactivas (errores en rojo) y usar Toasts para feedback:

- Edición exitosa:  
  - **“Proyecto actualizado correctamente”**  
- Finalización exitosa:  
  - **“Proyecto finalizado correctamente”**  
- Baja lógica (inactivar) exitosa:  
  - **“Proyecto dado de baja correctamente”**  
- Error de servidor:  
  - **“Error al procesar la operación de proyecto”**  

Permisos:

- Solo **Administrador** y **Jefe de área** pueden editar, finalizar o deshabilitar proyectos.  
- El **Supervisor** no tiene acceso a estas acciones (solo lectura).  

### Auditoría

Se debe registrar para cada cambio:

- Usuario que ejecuta la acción  
- Fecha y hora  
- Tipo de evento:
  - Edición  
  - Deshabilitar (baja lógica)  
  - Finalización  
- Valores antes y después de la modificación (cuando aplique).  

### Validación

- Nombre y código no pueden quedar vacíos.  
- El código debe seguir siendo único (ignorando mayúsculas/minúsculas y espacios).  
- No se debe permitir eliminar físicamente el proyecto (solo cambio de estado).  
- Si el proyecto tiene productos asociados:
  - Solo se admite baja lógica o finalización.
  - Debe mostrarse un modal de confirmación antes de aplicar el cambio.  
- Un proyecto en estado **Finalizado** no puede volver a estado **Activo**.  
