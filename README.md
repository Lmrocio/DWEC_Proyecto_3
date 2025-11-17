# CRM con IndexedDB

## Descripción del proyecto

Este proyecto es un **CRM (Customer Relationship Management) básico** desarrollado para la gestión de clientes usando **IndexedDB** en el navegador. Permite almacenar, editar, eliminar y listar clientes directamente en la base de datos local, sin necesidad de un servidor. El objetivo principal es practicar:

- Manipulación del **DOM**.
- Gestión de **eventos** en formularios.
- Validaciones de entrada usando **expresiones regulares**.
- Almacenamiento persistente con **IndexedDB**.
- Mejora y ampliación de un proyecto existente aplicando buenas prácticas de desarrollo.

El proyecto base incluía la funcionalidad de agregar, editar, eliminar y mostrar clientes. La versión final implementa **mejoras significativas** para optimizar la experiencia de usuario y extender las capacidades del CRM.

---

## Mejoras implementadas

Se han implementado las siguientes mejoras sobre el proyecto base:

1. **Mensajes de validación dinámicos**:
    - Se muestran mensajes debajo de cada input indicando si los datos son válidos o no (`Nombre válido`, `Email no válido`, etc.).
    - Los mensajes desaparecen automáticamente al agregar o actualizar un cliente, mejorando la limpieza de la interfaz.

2. **Búsqueda en tiempo real**:
    - Se añadió un campo de búsqueda para filtrar clientes por cualquier parte de su información (nombre, email o teléfono).
    - Los resultados se muestran instantáneamente mientras se escribe.

3. **Exportar e importar clientes**:
    - **Exportar**: permite descargar todos los clientes registrados como un archivo JSON.
    - **Importar**: permite cargar clientes desde un archivo JSON externo, evitando duplicados por email.

Estas mejoras aumentan la **usabilidad, eficiencia y flexibilidad** del CRM.

---

## Uso de la aplicación

### Agregar un cliente
1. Completa los campos de **Nombre, Email y Teléfono**.
2. Cada campo será validado automáticamente al perder el foco o mientras escribes.
3. El botón `Agregar Cliente` se habilita solo si todos los campos son válidos.
4. Haz clic en **Agregar Cliente**. Los campos se limpiarán automáticamente y el cliente se añadirá al listado.

### Editar un cliente
1. Haz clic en **Editar** junto al cliente que deseas modificar.
2. Los campos se rellenarán automáticamente con los datos del cliente.
3. Modifica los datos y haz clic en **Guardar Cambios**.
4. Los cambios se guardan en IndexedDB y el listado se actualiza.

### Eliminar un cliente
1. Haz clic en **Eliminar** junto al cliente que deseas borrar.
2. Confirma la acción.
3. El cliente se eliminará del listado y de IndexedDB.

### Buscar clientes
1. Escribe en el campo de búsqueda para filtrar clientes por nombre, email o teléfono.
2. El listado se actualizará en tiempo real mostrando solo los clientes que coincidan con el término de búsqueda.

### Exportar clientes
1. Haz clic en el botón **Exportar** para descargar un archivo JSON con todos los clientes registrados.
2. Este archivo puede ser usado como respaldo o para importarlo en otra instancia de la aplicación.

### Importar clientes
1. Selecciona un archivo JSON que contenga clientes.
2. La aplicación añadirá los clientes que no estén duplicados por email.
3. Tras importar, el listado se actualiza automáticamente.

---

## Decisiones técnicas

- **IndexedDB**: se eligió como almacenamiento persistente en el navegador, permitiendo almacenar datos estructurados sin servidor.
- **Validaciones con expresiones regulares**: para garantizar que los datos ingresados sean correctos y coherentes.
- **Mensajes dinámicos**: cada input muestra un mensaje de validación usando elementos `div` con la clase `small-note`.
- **Reset del formulario**: al agregar o actualizar un cliente se eliminan los mensajes de validación y se restablece el estado del botón.
- **Escapado de HTML**: para prevenir inyecciones de código en los campos de texto, se utiliza la función `escapeHtml()`.
- **Eventos**: uso extensivo de `blur`, `input` y `click` para capturar interacciones y actualizar la UI dinámicamente.
- **Fragmentos de documento (`DocumentFragment`)**: para mejorar el rendimiento al actualizar el listado de clientes en el DOM.
- **Importación/Exportación JSON**: permite respaldar y restaurar datos de manera fácil, asegurando la compatibilidad y prevención de duplicados.

---