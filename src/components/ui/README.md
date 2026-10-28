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

Si aparece una diferencia entre dos rutas, primero se corrige el componente o el token compartido. Solo se crea una
variante cuando existe una diferencia real de tarea y queda cubierta por un test.
