

## Sistema de Licencias con validacion contra Google Sheets

### Resumen
Al abrir la app por primera vez, se mostrara una pantalla de entrada de licencia. La licencia se validara contra un Google Sheet publicado. Si es valida, se guarda en la base de datos y el usuario accede permanentemente.

### Requisitos previos del usuario
1. Crear un Google Sheet con las licencias validas en la columna A
2. Publicar el Google Sheet como CSV: Archivo > Compartir > Publicar en la web > formato CSV
3. Proporcionar la URL publica resultante o el ID del Sheet

### Cambios planificados

**1. Nueva tabla `app_licenses` en la base de datos**
- `id` (uuid, PK)
- `license_key` (text, unique, not null) — la licencia validada
- `activated_at` (timestamptz, default now())
- RLS: acceso publico para anon (consistente con el resto de la app)

**2. Edge Function `validate-license`**
- Recibe `{ license_key: string }` en el body
- Descarga el Google Sheet publicado como CSV
- Busca la licencia en las filas
- Si existe, la inserta en `app_licenses` y devuelve `{ valid: true }`
- Si no existe, devuelve `{ valid: false }`
- La URL del Google Sheet se almacenara como secret (`GOOGLE_SHEET_LICENSES_URL`)

**3. Pagina `LicenseGate.tsx`**
- Pantalla centrada con input de licencia y boton de validar
- Muestra error si la licencia no es valida
- Al validar correctamente, redirige a `/app/dashboard`
- Diseño acorde con los colores de la app

**4. Modificacion del routing en `App.tsx`**
- Al cargar la app, consulta `app_licenses` para ver si ya hay una licencia activada
- Si hay licencia: muestra la app normal
- Si no hay licencia: muestra `LicenseGate` y bloquea todas las rutas
- Hook `useLicense()` para centralizar esta logica

### Flujo

```text
App se abre
  |
  v
¿Existe licencia en app_licenses?
  |           |
  SI          NO
  |           |
  v           v
App normal   Pantalla de licencia
              |
              v
            Usuario introduce clave
              |
              v
            Edge Function valida vs Google Sheet
              |           |
              OK          KO
              |           |
              v           v
            Guarda en DB  Muestra error
            Accede a app
```

### Archivos a crear/modificar
- `supabase/migrations/...` — tabla `app_licenses`
- `supabase/functions/validate-license/index.ts` — edge function
- `src/pages/LicenseGate.tsx` — pagina de entrada de licencia
- `src/hooks/useLicense.ts` — hook para comprobar licencia
- `src/App.tsx` — condicionar rutas segun licencia

