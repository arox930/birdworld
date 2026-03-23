

# Loromanía – Plan de Implementación

## Visión
App de gestión de criadero (aves y perros) con login único admin, CRUD completo, IA para extracción de datos desde imágenes, documentos de cesión en PDF, y dashboard de métricas.

---

## Fase 1: Base y Autenticación
- Layout mobile-first con sidebar/nav: rutas `/login`, `/app/dashboard`, `/app/aves`, `/app/perros`
- Login con usuario único (JuanFrancisco / Negroblanco1) usando Supabase Auth con signup deshabilitado
- Rutas protegidas que redirigen a login si no hay sesión

## Fase 2: Base de Datos
- Tablas: `birds`, `dogs`, `buyers`, `cessions`, `vaccines`, `litters`
- Campos según el modelo de datos especificado (parentales internos/externos, enums de especie, etc.)
- RLS: solo el usuario admin autenticado puede leer/escribir
- Storage buckets: `uploads` (imágenes) y `cessions` (PDFs)

## Fase 3: CRUD Aves
- Selector por categoría (Guacamayos, Loris, Ninfas, Yacos, Cacatúas, Pirruras, Amazonas)
- Tabla con búsqueda (microchip, anilla, especie), filtros (sexo, estado, fechas), paginación server-side
- Formulario de alta/edición con validaciones
- Eliminación con modal de confirmación mostrando ficha del ejemplar
- Acciones por fila: Modificar, Eliminar, Crear Documento de Cesión

## Fase 4: CRUD Perros
- Tabla con búsqueda y filtros similar a aves
- Formulario alta/edición con campos específicos (raza, color, pedigree, nombre)
- Acciones por fila: Modificar, Eliminar, Cesión, Ver vacunación, Ver camadas

## Fase 5: Upload + IA Extracción
- Componente de subida de imagen/documento al bucket `uploads`
- Edge function `extractAnimalFromImage` usando Lovable AI para analizar imágenes y extraer campos (microchip, anilla, CITES, fechas, especie/raza)
- UI que muestra campos extraídos con indicador de confianza, usuario valida antes de guardar

## Fase 6: Documento de Cesión (PDF)
- Modal al crear cesión: formulario de comprador (nombre, apellidos, DNI, domicilio) + precio
- Registro en tabla `buyers` y `cessions`
- Edge function `generateCessionPDF` que genera PDF autocompletado con datos del ejemplar, comprador, precio y fecha
- PDF guardado en bucket `cessions`, link devuelto y asociado a la cesión
- Actualización automática del ejemplar: `fechaCesion` y `compradorId`

## Fase 7: Vacunas y Camadas
- **Vacunas**: vista de historial por perro, formulario para añadir vacuna (fecha, descripción)
- **Camadas**: vista por madre, formulario (fecha, nacidos, muertos en parto, machos, hembras, notas)

## Fase 8: Dashboard
- Tarjetas KPI: dinero generado, aves vendidas, perros vendidos, ejemplares muertos
- Filtro por rango de fechas
- Rankings: parejas con más crías (aves), hembras con más cachorros (perros)
- Gráficos con Recharts

