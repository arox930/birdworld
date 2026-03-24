

## Alternativa sin cuenta de servicio: Google Apps Script como proxy

Crear una cuenta de servicio en Google Cloud puede ser complicado. Existe una alternativa mucho mas sencilla: usar **Google Apps Script** como intermediario. Es gratuito, no requiere consola de Google Cloud, y se configura directamente desde el propio Google Sheet.

### Como funciona

1. Desde tu Google Sheet, abres el editor de Apps Script (Extensiones > Apps Script)
2. Pegas un script que expone dos endpoints: uno para validar la licencia y otro para escribir Device_Hash y Activated_At
3. Lo despliegas como "aplicacion web" publica
4. La Edge Function de Lovable llama a esa URL en vez de usar la API de Sheets directamente

### Cambios planificados

**1. Google Apps Script (lo creas tu en el Sheet)**
- Script que recibe una licencia por POST
- Busca en columna A si existe y en columna B si el STATUS es "Vendido"
- Si es valida, escribe Device_Hash en columna C y Activated_At en columna E
- Devuelve JSON con `{ valid: true/false }`

**2. Edge Function `validate-license` (actualizar)**
- En vez de descargar CSV y parsear, hace POST al Apps Script web app
- Envia `license_key` y `device_hash`
- Recibe la respuesta y guarda en `app_licenses` si es valida

**3. Frontend (sin cambios)**
- `useLicense.ts` y `LicenseGate.tsx` siguen funcionando igual
- Se genera el device_hash en el frontend y se envia junto con la licencia

### Pasos para ti en Google Sheets

1. Abre tu Google Sheet
2. Ve a **Extensiones > Apps Script**
3. Pega el codigo que te proporcionare (copy-paste directo)
4. Click en **Desplegar > Nueva implementacion > Aplicacion web**
5. Acceso: "Cualquier persona"
6. Copia la URL generada
7. Me la pegas aqui y yo actualizo el secret

### Archivos a modificar
- `supabase/functions/validate-license/index.ts` — simplificar para llamar al Apps Script
- `src/hooks/useLicense.ts` — añadir generacion de device_hash
- `src/pages/LicenseGate.tsx` — enviar device_hash junto con la licencia

