# Módulo: Usuarios

El Módulo de Usuarios tiene como objetivo gestionar la información y jerarquía de los usuarios
que interactúan con el sistema, garantizando un control adecuado de acceso y responsabilidades.
Este módulo permite la creación, visualización, actualización y deshabilitación de cuentas, así
como la asignación de áreas y bodegas según la estructura organizacional definida.

La administración de usuarios se basa en un modelo jerárquico de roles, donde el Administrador
posee control total del sistema; el Jefe de Área gestiona a los supervisores dentro de su área; y el
Supervisor mantiene control operativo sobre las bodegas que le son asignadas.

Además, los Operarios pueden revisar la existencia y operar dentro del sistema en sus áreas
correspondientes, pudiendo visualizar el stock o los elementos de otras áreas, sin posibilidad de
realizar modificaciones.

Asimismo, el módulo contempla mecanismos de auditoría para asegurar la trazabilidad de las
acciones sobre usuarios y asignaciones, fortaleciendo la seguridad y la integridad de los datos en
el entorno corporativo.

## Requerimientos del Módulo de Usuarios

- Listar usuarios
- Crear un nuevo usuario
- Deshabilitar usuario
- Obtener mi perfil
- Modificar asignaciones (Áreas / Bodegas)

---

## USR-001 – Listar Usuarios

- **ID:** USR-001  
- **Usuario:** Administrador / Jefe de Área  
- **Nombre del Requerimiento:** Listar Usuarios  
- **Documentado por:** Fernando Condori Godoy  
- **Programador Responsable:** _(por definir)_  

### Descripción

El sistema debe permitir la visualización de todos los usuarios registrados en el sistema,
mostrando sus datos esenciales (nombre, apellido, correo, RUT, teléfono, rol, estado y
asignaciones).

El listado debe permitir búsqueda por nombre, correo o RUT y filtrado por rol y estado
(habilitado / deshabilitado).

El administrador puede visualizar todos los usuarios del sistema, mientras que el Jefe de Área
solo visualizará usuarios pertenecientes a su área o bodegas dependientes.

Los usuarios deshabilitados deben mostrarse en color rojo para distinguirlos visualmente.

El Supervisor no posee acceso a este listado administrativo, aunque podrá ver en otra vista
operativa los compañeros asignados a su misma bodega.

### Validación

- El sistema debe listar correctamente los usuarios según los permisos del rol autenticado.
- El sistema debe impedir el acceso al listado de usuarios a roles no autorizados (por ejemplo, Supervisores).
- Los filtros deben aplicarse dinámicamente y combinarse entre sí.
- Los usuarios deshabilitados deben visualizarse en rojo y no deben permitir interacción (botones bloqueados).
- Si ocurre un error de carga, se debe mostrar un mensaje Toast **“Error al cargar los usuarios”**.

---

## USR-002 – Crear Usuario

- **ID:** USR-002  
- **Usuario:** Administrador / Jefe de Área  
- **Nombre del Requerimiento:** Crear Usuario  
- **Documentado por:** Fernando Condori Godoy  
- **Programador Responsable:** _(por definir)_  

### Descripción

El sistema debe permitir al Administrador crear cualquier tipo de usuario del sistema
(Administrador, Jefe de Área o Supervisor).

El Jefe de Área puede crear únicamente usuarios de tipo Supervisor asociados a su área.

El formulario de creación debe solicitar los siguientes campos obligatorios: nombre, apellido,
correo electrónico, RUT, teléfono, cargo (rol), estado (habilitado/deshabilitado), área o bodega
asignada según el rol.

El nuevo usuario se crea habilitado por defecto y con un único rol activo.

En caso de ser Supervisor, el área se deduce a partir de la bodega asignada.

### Validación

- No se puede crear un usuario sin completar los campos obligatorios.
- No se debe permitir asignar un área o bodega inexistente.
- El sistema debe validar que el correo no esté registrado previamente.
- El sistema debe restringir al Jefe de Área para que solo cree Supervisores dentro de su área.
- Al crear el usuario exitosamente, debe mostrarse un Toast **“Usuario creado exitosamente”**.
- En caso de error, se debe mostrar un mensaje visual en rojo especificando el campo con error.

---

## USR-003 – Deshabilitar Usuario

- **ID:** USR-003  
- **Usuario:** Administrador / Jefe de Área  
- **Nombre del Requerimiento:** Deshabilitar Usuario  
- **Documentado por:** Fernando Condori Godoy  
- **Programador Responsable:** _(por definir)_  

### Descripción

El sistema debe permitir deshabilitar un usuario, impidiendo que acceda al sistema.

El cambio de estado se realiza mediante un atributo booleano que bloquea el acceso durante el
proceso de autenticación.

El sistema debe registrar en la bitácora quién realizó la acción y cuándo, además de permitir
que la deshabilitación pueda ser ejecutada automáticamente por el sistema si corresponde.

Los usuarios deshabilitados se mantienen en el histórico y se muestran en rojo dentro del
listado general.

### Validación

- El sistema debe registrar fecha, hora y usuario responsable de la deshabilitación.
- Al intentar iniciar sesión con una cuenta deshabilitada, debe mostrarse el mensaje:
  - **“Tu cuenta se encuentra deshabilitada. Contacta con el Administrador o Jefatura.”**
- Solo el Administrador o el Jefe de Área correspondiente pueden deshabilitar usuarios bajo su jerarquía.
- No se debe permitir eliminar usuarios de forma permanente.
- Debe mostrarse un Toast confirmando **“Usuario deshabilitado correctamente”**.
- Antes de guardar los cambios, el sistema debe mostrar un Modal de confirmación con
  el mensaje: **“¿Está seguro de realizar la modificación?”**, con confirmación final
  (“Cambios guardados exitosamente”).

---

## USR-004 – Obtener Mi Perfil

- **ID:** USR-004  
- **Usuario:** Usuario Autenticado  
- **Nombre del Requerimiento:** Obtener Mi Perfil  
- **Documentado por:** Fernando Condori Godoy  
- **Programador Responsable:** _(por definir)_  

### Descripción

El sistema debe permitir a cualquier usuario autenticado visualizar su información personal,
incluyendo nombre, apellido, correo electrónico, RUT, teléfono y rol asignado.

El perfil no mostrará áreas ni bodegas asignadas, ya que esta información se gestiona en un
panel específico de asignaciones.

El usuario podrá actualizar su número de teléfono y cambiar su contraseña mediante un enlace
al módulo de Autenticación.

Los demás campos son de solo lectura.

### Validación

- Solo el usuario autenticado puede acceder a su propio perfil.
- El sistema debe validar los formatos de teléfono y correo.
- La actualización de teléfono debe confirmar con un Toast **“Teléfono actualizado correctamente”**.
- El enlace de cambio de contraseña debe redirigir al flujo de **Autenticación – Cambiar Contraseña**.
- En caso de error, se debe mostrar un mensaje **“Error al actualizar los datos de perfil”**.

---

## USR-005 – Modificar Asignaciones (Áreas / Bodegas)

- **ID:** USR-005  
- **Usuario:** Administrador / Jefe de Área  
- **Nombre del Requerimiento:** Modificar Asignaciones (Áreas / Bodegas)  
- **Documentado por:** Fernando Condori Godoy  
- **Programador Responsable:** _(por definir)_  

### Descripción

El sistema debe permitir realizar asignaciones jerárquicas entre usuarios, áreas y bodegas.

El Administrador puede asignar una o más áreas a un Jefe de Área.

El Jefe de Área puede asignar una o más bodegas a los Supervisores bajo su responsabilidad.

Un Jefe de Área obtiene control total sobre las bodegas de sus áreas asignadas, mientras que
un Supervisor obtiene control total sobre las bodegas asignadas a él.

Respecto a elementos no asignados, ambos pueden visualizar información solo en modo
lectura.

Se debe registrar un historial de cada asignación, incluyendo quién realizó la acción, a quién
asignó, qué entidad fue asignada y la fecha.

### Validación

- No se puede asignar un área o bodega inexistente.
- El sistema debe impedir asignar bodegas que no pertenezcan al área del Jefe que realiza la asignación.
- El sistema debe generar un registro de auditoría para cada asignación o cambio.
- En caso de reasignación, debe mostrarse un modal de confirmación.
- Debe mostrarse un Toast **“Asignación registrada correctamente”** al éxito.
- Si ocurre un error, debe mostrarse en rojo con detalle del problema.

---

# Módulo: Área

El módulo Área tiene como objetivo gestionar la estructura organizacional de la empresa minera
o cliente del tipo industrial mediante la creación, asignación y administración jerárquica de las
distintas áreas que la componen.

Permite registrar nuevas áreas, establecer relaciones de dependencia entre ellas (áreas principales
o dependientes), asignar recursos como bodegas y jefes, y visualizar tanto listados generales
como el detalle de cada área.

Con este módulo, se busca mantener una estructura jerárquica clara y actualizada que facilite la
trazabilidad, control y gestión de responsabilidades dentro de la organización.

## Requerimientos del Módulo de Área

- Crear nueva área
- Asignar bodegas al área
- Asignar Jefe de área
- Listar áreas
- Detalle de área

---

## AREA-1 – Crear nueva área

- **ID:** AREA-1  
- **Usuario:** Intendente / Jefe  
- **Nombre del Requerimiento:** Crear nueva área  
- **Documentado por:** Ernes Fuenzalida Tello  
- **Programador Responsable:** _(por definir)_  

### Descripción

El sistema debe permitir al usuario registrar una nueva área dentro de la
estructura jerárquica de la empresa minera.

Durante el registro, el usuario podrá definir si el área será un área principal (similar a un nodo
raíz) o un dependiente de otra área (similar a un nodo hoja).

Si el área se marca como área principal, no requiere asignar un área padre.

Si el área se marca como área dependiente, el sistema deberá permitir seleccionar un área
padre existente de la jerarquía.

El sistema debe validar que la nueva área se inserte correctamente dentro de la estructura
jerárquica, asegurando que respete los niveles (por ejemplo, un área hijo solo puede depender
de un área del nivel inmediatamente superior).

La jerarquía debe mantenerse de forma dinámica, permitiendo tener áreas con subniveles, por
ejemplo:

- Nivel 1 → “Extracción”
- Nivel 2 → “Extracción - Perforación”
- Nivel 3 → “Extracción - Perforación - Subnivel 1”, etc.

El área consta de un nombre, un tipo de nodo (principal o dependiente) y un área padre, el cual
es obligatorio asignar cuando el área a crear es de carácter dependiente.

### Validación

- No se puede registrar un área sin nombre.
- Si se selecciona nodo normal/dependiente, es obligatorio elegir un área padre existente.
- No se permiten duplicados exactos (mismo nombre bajo el mismo nodo padre).
- Todos los errores deben ser marcados reactivamente, resaltados con color rojo. En caso
  de ocurrir algún error de servidor debe ser indicado mediante un Toast en la esquina
  inferior derecha.
- Al crearse una nueva área debe desplegarse un mensaje de **“Área XXXXX creada exitosamente”** mediante un Toast.
- Al crear una nueva área, automáticamente se le asociará el estado de **“Activa”**, permitiendo así los otros requerimientos documentados posteriormente.

---

## AREA-2 – Asignar bodegas al área

- **ID:** AREA-2  
- **Usuario:** Intendente / Jefe  
- **Nombre del Requerimiento:** Asignar bodegas al área  
- **Documentado por:** Ernes Fuenzalida Tello  
- **Programador Responsable:** _(por definir)_  

### Descripción

El sistema debe permitir al usuario asignar una o varias bodegas a un área determinada.

### Validación

- No se permite asignar una bodega sin seleccionar un área activa previamente.
- No se pueden seleccionar bodegas deshabilitadas o que estén en su capacidad máxima.
- No se pueden asignar bodegas duplicadas al mismo área.
- Si una bodega ya está asignada, el sistema debe advertirlo mediante un Modal antes de reasignar.
- Se deberá poder visualizar las bodegas ya asignadas a cada área.
- Debe existir la posibilidad de quitar una bodega de un área para asignarla a otra o cambiarla directamente.
- Una bodega puede ser asignada a varias áreas a la vez.
- Si se reasigna la única bodega de un área, el sistema debe desplegar un modal de advertencia.
- Todos los errores deben ser marcados reactivamente, resaltados con color rojo. En caso
  de ocurrir algún error de servidor debe ser indicado mediante un Toast en la esquina
  inferior derecha.
- En caso de que exista alguna asignación exitosa, también debe indicarse como Toast de
  color verde.
- Solo se pueden asignar bodegas a un área dependiente de su último nivel jerárquico
  (nodos hojas) o a un nodo padre sin dependencias hacia abajo de su nivel jerárquico
  (nodo sin hojas).

---

## AREA-3 – Asignar jefe de área

- **ID:** AREA-3  
- **Usuario:** Intendente  
- **Nombre del Requerimiento:** Asignar jefe de área  
- **Documentado por:** Ernes Fuenzalida Tello  
- **Programador Responsable:** _(por definir)_  

### Descripción

El sistema debe permitir asignar uno o más jefes responsables a cada área
registrada (el listado desplegado solo debe ser de las áreas activas hasta la fecha).

### Validación

- No se puede asignar un jefe sin seleccionar un área previamente.
- Un jefe puede ser asignado a una o varias áreas activas a la vez.
- Si un jefe ya está asignado en otra área, el sistema debe desplegar un Modal de advertencia.
- El estado del jefe debe ser **“Habilitado”** para asignarlo a un área correspondiente.  
  En caso de que este deje de estar habilitado, no se mantienen sus asignaciones previas;
  se debe indicar en el historial de modificaciones dicha acción como  
  **“Jefe de Área XXXXXX ha sido deshabilitado”**.
- Al asignar un jefe, se debe actualizar la fecha de modificación del área, permitiendo el
  seguimiento histórico de asignaciones.
- Si se reasigna al único jefe de un área, el sistema debe desplegar un Modal de advertencia.
- Todos los errores deben ser marcados reactivamente, resaltados con color rojo. En caso
  de ocurrir algún error de servidor debe ser indicado mediante un Toast en la esquina
  inferior derecha. En caso de ser exitoso debe salir en verde.

---

## AREA-4 – Listar áreas

- **ID:** AREA-4  
- **Usuario:** Intendente / Jefe  
- **Nombre del Requerimiento:** Listar áreas  
- **Documentado por:** Ernes Fuenzalida Tello  
- **Programador Responsable:** _(por definir)_  

### Descripción

El sistema debe permitir listar todas las áreas activas en la estructura jerárquica
de la empresa.

Esta lista debe desplegar la jerarquía por niveles. Debe permitir filtros por nombre, nivel o
estado.

### Campos

- Nombre del área  
- Nivel jerárquico  
- Área padre (si aplica)  
- Jefe(s) asignado(s)  
- Estado  
- Cantidad de bodegas asignadas  

### Validación

- El listado debe actualizarse automáticamente al crear o modificar áreas.
- No se debe mostrar información de áreas inactivas si el usuario filtra por estado **“Activo”**.
- Si se clickea sobre dicha área, se debe desplegar el detalle del área, indicado en el
  requerimiento **AREA-5**.
- Todos los errores deben ser marcados reactivamente, resaltados con color rojo. En caso
  de ocurrir algún error de servidor debe ser indicado mediante un Toast en la esquina
  inferior derecha.

---

## AREA-5 – Detalle del área

- **ID:** AREA-5  
- **Usuario:** Intendente / Supervisor  
- **Nombre del Requerimiento:** Detalle del área  
- **Documentado por:** Ernes Fuenzalida Tello  
- **Programador Responsable:** _(por definir)_  

### Descripción

El sistema debe permitir consultar los detalles de un área específica mediante su
identificador único (ID).

Al ingresar, el sistema mostrará toda su información relacionada. Debe incluir sus subáreas (si
existen) y los jefes asignados, además de contar con botones de redirección hacia las demás
acciones que correspondan.

Debe permitir editar directamente el registro desde la vista de detalle (si el usuario tiene
permisos solo puede editar el estado y nombre).

### Campos

- ID del área  
- Nombre  
- Nivel jerárquico (cargo)  
- Área padre  
- Subáreas  
- Jefes asignados  
- Estado  
- Cantidad de bodegas asignadas y cuáles son  
- Historial de modificaciones  

### Validación

- Si el ID no existe, el sistema debe mostrar un mensaje de error en un Toast.
- Solo usuarios con permisos podrán editar el registro desde esta vista.
- Todos los errores deben ser marcados reactivamente, resaltados con color rojo. En caso
  de ocurrir algún error de servidor debe ser indicado mediante un Toast en la esquina
  inferior derecha.
- En caso de que exista alguna modificación exitosa, también debe indicarse como Toast
  de color verde.
- Antes de guardar los cambios, el sistema debe mostrar un Modal de confirmación con el
  mensaje: **“¿Está seguro de realizar la modificación?”**.
