
Objetivo: hacer que el PDF descargado de cesión tenga realmente menos interlineado, no solo el editor visual.

Lo que he encontrado:
- La reducción que se hizo en `TemplateEditorDialog` y `CessionPreviewEditor` solo afecta al editor en pantalla mediante clases Tailwind como `leading-tight` y márgenes reducidos.
- El PDF descargado no usa ese CSS. Se genera en `supabase/functions/generate-cession-pdf/index.ts` con un renderizador propio.
- Ahí el interlineado está fijado manualmente con valores bastante amplios:
  - líneas normales: `const lh = maxFs * 1.5`
  - párrafos vacíos: `const emptyLh = 11 * 1.5`
  - separación entre bloques/párrafos: `y -= 8`

Plan de implementación:
1. Ajustar el motor PDF de cesiones
- Reducir el line-height real del PDF en `buildPdf(...)`.
- Reducir también la separación adicional entre bloques para que el cambio sea visible.
- Reducir el espacio de párrafos vacíos / saltos visuales para que no siga pareciendo “aireado”.

2. Mantener coherencia entre editor y PDF
- Hacer que los valores del PDF se acerquen al aspecto del editor actual.
- Revisar que no queden diferencias evidentes entre:
  - plantilla en Plantillas de Cesión
  - previsualización antes de generar
  - PDF final descargado

3. Afinar el tratamiento de párrafos vacíos
- Ahora los `<p><br></p>` y bloques vacíos siguen metiendo bastante altura.
- Ajustaré esa lógica para que los saltos sigan existiendo, pero con menos separación.

4. Validar impacto funcional
- Confirmar que generar una cesión desde Aves o desde Parejas siga teniendo exactamente la misma repercusión de negocio, ya que ambas rutas usan la misma función `generate-cession-pdf`.
- No hace falta tocar hooks ni lógica de descarga, salvo que quiera añadir más fidelidad visual después.

Resultado esperado:
- El PDF descargado mostrará menos interlineado de forma apreciable.
- La vista previa y el PDF quedarán mucho más parecidos.
- No cambiará el flujo de creación/edición de cesión, solo la maquetación del documento final.

Detalles técnicos:
- Archivo clave: `supabase/functions/generate-cession-pdf/index.ts`
- Líneas relevantes detectadas:
  - `const emptyLh = 11 * 1.5`
  - `const lh = maxFs * 1.5`
  - `y -= 8`
- El cambio correcto no está en React/Tailwind, sino en el generador PDF del backend.

Si quieres el ajuste más agresivo posible, lo siguiente sería dejarlo aproximadamente en una combinación tipo:
```text
line-height: ~1.15–1.25
spacing between paragraphs: ~2–4pt
empty paragraph spacing: claramente menor que ahora
```
Eso haría que la reducción se note de verdad en el documento descargado.
