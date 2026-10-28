# Afterstage UI primitives

Estos componentes son la fuente de verdad para los patrones que se repiten en las páginas.

## Regla de uso

- Una página nueva usa `PageTitle` para su encabezado principal.
- Los bloques de contenido usan `SectionHeading` y `SectionDivider`.
- Los formularios usan `TextField`, `TextAreaField`, `SelectField` y `FormSection`.
- Los formularios de varios pasos usan `FormProgress` y `FormActions`.
- Las páginas no agregan medidas, labels, ayudas ni estados alternativos si el primitive puede resolverlo mediante props.

Si aparece una diferencia entre dos rutas, primero se corrige el primitive o el token compartido. Solo se crea una variante cuando existe una diferencia real de tarea y queda cubierta por un test.
