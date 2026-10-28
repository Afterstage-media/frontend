# Afterstage UI y shell

Estos componentes son la fuente de verdad para los patrones que se repiten en las páginas. El objetivo es que una
página declare contenido y comportamiento de negocio, mientras que los componentes resuelvan estructura, medidas,
accesibilidad y estados.

## Componentes obligatorios

- `Page`/`PageShell`: estructura global, skip link, main y modo público/espacio de trabajo.
- `SiteHeader`: marca, búsqueda, navegación y menú responsive.
- `WorkspaceSidebar`: navegación autenticada, secciones plegables y cierre de sesión.
- `SiteFooter`: pie institucional único.
- `PageTitle`: encabezado principal de cada página.
- `Section`, `SectionHeading`, `SectionDivider`, `Card` y `CardContainer`: bloques de composición y contenido.
- `Button` y `ButtonLink`: acciones; no se crean estilos de botón página por página.
- `Toggle`: controles expandibles o con estado, siempre con `aria-expanded` o `aria-pressed`.
- `SearchField`: búsqueda global con alcance de contenido explícito.
- `TextField`, `TextAreaField`, `SelectField` y `FormSection`: campos y agrupaciones de formularios.
- `FormProgress` y `FormActions`: formularios de varios pasos.
- `LoadingState`, `ErrorState` y `EmptyState`: estados de carga, error y vacío.
- `Container`: ancho de contenido compartido, con variante amplia para grillas.
- `Dialog` y `Drawer`: modales y paneles laterales con foco atrapado, cierre por Escape y cierre al tocar el fondo.
- `IconButton`: acción compacta para cerrar o ejecutar una acción identificada por `aria-label`.
- `SegmentedControl` y `FilterBar`: filtros agrupados con estado seleccionado explícito.
- `StatusBadge` y `Notice`: estados persistentes y mensajes de feedback accesibles.
- `DataTable` e `ItemList`: colecciones reutilizables con estados vacíos y adaptación responsive.

## Reglas de uso

1. Una página nueva usa `Layout`, `PageTitle` y `Section`; no recrea el shell ni el ancho de contenido.
2. Un botón usa `Button` o `ButtonLink`. Las variantes visuales existentes (`dark`, `ghost`, `danger`) se pasan como
   `variant` o clase, pero no se redefine su CSS en la página.
3. Un control que abre, cierra, alterna o filtra usa `Toggle` y comunica su estado al lector de pantalla.
4. Los formularios usan los primitives de campos y mantienen labels, ayuda, error y requerimiento en el componente.
5. Las cards usan `Card` dentro de `CardContainer`; una página puede agregar una variante semántica, pero no volver a
   definir la caja base o la grilla.
6. Los anchos, gutters, alturas y escalas viven en tokens y CSS compartido. Las páginas no agregan medidas arbitrarias.
7. Los estados de carga, error y vacío son componentes explícitos y deben ofrecer una acción recuperable cuando existe.
8. Los modales y drawers se montan con `Dialog`/`Drawer`; no se crean backdrops, foco ni listeners de Escape en cada página.
9. Las tablas y listas de datos usan `DataTable`/`ItemList` para mantener el mismo estado vacío, lectura móvil y estructura.
10. Un filtro de selección única usa `SegmentedControl`; un conjunto de filtros usa `FilterBar` y siempre debe anunciar su propósito.
11. Un feedback de éxito, error o advertencia usa `Notice`; el texto no se comunica solo por color.
12. Un estado de entidad usa `StatusBadge`; el tono visual acompaña una etiqueta textual comprensible.

Si aparece una diferencia entre dos rutas, primero se corrige el componente o el token compartido. Solo se crea una
variante cuando existe una diferencia real de tarea y queda cubierta por un test.
