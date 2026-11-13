# FotoApuntes

App móvil hecha con **Expo (SDK 58) + Expo Router** que toma la foto de un apunte (con la cámara o desde la galería), la envía a **Gemini** mediante **Firebase AI Logic** y genera:

- **Resumen**: título, resumen y conceptos clave.
- **Quiz**: 5 preguntas de opción múltiple, una a la vez, con retroalimentación inmediata y puntaje final.
- **Historial**: todos los apuntes analizados, guardados localmente con SQLite (incluye el mejor puntaje del quiz).

## Capturas de pantalla

| Captura | Resumen | Quiz | Historial |
| --- | --- | --- | --- |
| ![](docs/captura.png) | ![](docs/resumen.png) | ![](docs/quiz.png) | ![](docs/historial.png) |

> Las capturas van en la carpeta `docs/`.

## Tecnologías

| Paquete | Uso |
| --- | --- |
| `expo-image-picker` | `launchCameraAsync` / `launchImageLibraryAsync` con `base64: true` |
| `@react-native-firebase/ai` | `getAI` + `getGenerativeModel` (backend Gemini Developer API) |
| `@react-native-firebase/app-check` | Protege las llamadas a la IA (proveedor *debug* en desarrollo) |
| `expo-sqlite` | Historial local |
| `expo-network` | Detectar si no hay internet antes de llamar a la IA |
| `expo-router` | Navegación por archivos (`src/app/`) |
| `expo-dev-client` / `expo-build-properties` | Development build (la app **no** corre en Expo Go) |

## Estructura

```
src/
  app/
    _layout.js        # Stack + SQLiteProvider + inicialización de Firebase
    index.js          # Pantalla de captura
    resumen/[id].js   # Resumen y conceptos clave
    quiz/[id].js      # Quiz con retroalimentación y puntaje
    historial.js      # Lista de apuntes analizados
  components/Btn.js
  lib/
    firebase.js       # App Check + getAI + getGenerativeModel
    prompt.js         # Prompt y responseSchema
    gemini.js         # Llamada a Gemini y JSON.parse con validación
    db.js             # Funciones de SQLite
```

## El prompt y por qué lo redacté así

```
Eres un tutor que ayuda a estudiantes universitarios a repasar.
Analiza la imagen adjunta, que debería ser la foto de un apunte (...).
1. Si la imagen NO es un apunte o está tan borrosa que no se puede leer, responde con "es_apunte": false (...)
2. Si sí es un apunte (...): título corto, resumen de 3 a 5 oraciones, 3 a 6 conceptos clave
   y EXACTAMENTE 5 preguntas de opción múltiple con 4 opciones y "correcta" = índice (0 a 3).
3. Responde solo con JSON, sin texto adicional ni bloques de código.
```

(El texto completo está en `src/lib/prompt.js`.)

- **Rol de tutor**: así el modelo enfoca el resumen y las preguntas en el repaso, no en describir la imagen.
- **Campo `es_apunte`**: le da al modelo una salida explícita cuando la foto está borrosa o no es un apunte, en lugar de inventar contenido. La app detecta ese caso y muestra un mensaje amigable.
- **Límites concretos** (número de oraciones, de conceptos y exactamente 5 preguntas con 4 opciones): hacen que las respuestas tengan siempre el mismo tamaño y que la interfaz se vea consistente.
- **"correcta" como índice desde 0**: deja claro cómo se califica cada pregunta. Además, pedir que varíe la posición evita que la respuesta correcta siempre sea la "A".
- **Reto extra, `responseSchema`**: además del prompt, el modelo se configura con `responseMimeType: "application/json"` y un `Schema.object(...)`. Así Gemini queda obligado a devolver esa estructura. Aun así, la respuesta pasa por `JSON.parse` dentro de un `try/catch` y se valida antes de usarse.

Lo probé primero en **Google AI Studio** subiendo la foto de un apunte.

## Manejo de errores

| Caso | Qué pasa |
| --- | --- |
| Sin internet | Se revisa con `expo-network` y se muestra "Sin conexión a internet". |
| Permiso de cámara denegado | Alerta explicativa, con botón a Ajustes si ya no se puede volver a pedir. |
| Cancelar la cámara o la galería | Se ignora (`result.canceled`) y la app sigue igual. |
| Foto borrosa o que no es apunte | El modelo responde `es_apunte: false` y se muestra un mensaje amigable. |
| JSON inválido o incompleto | `try/catch` + validación. Se muestra un mensaje y la app no se cierra. |

Mientras se espera la respuesta se muestra un `ActivityIndicator` y los botones quedan deshabilitados.

## Configuración de Firebase

1. Crear el proyecto en la [consola de Firebase](https://console.firebase.google.com/).
2. Registrar la app Android con el paquete `com.adrian444.reactcamara` y descargar `google-services.json` en la raíz del proyecto. **No se sube a GitHub** (está en `.gitignore`).
3. En **AI Logic**, activar el proveedor **Gemini Developer API**.
4. En **App Check**, registrar la app con Play Integrity usando el SHA-256 del keystore (`npx eas-cli@latest credentials -p android`).
5. Para pruebas, crear un **debug token**:
   - En *App Check → ⋮ de la app → Administrar tokens de depuración → Agregar → Generar*, copiar el token.
   - Copiar `.env.example` como `.env.local` y pegarlo:
     ```
     EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
     ```
   - `.env.local` está en `.gitignore`, así que el token no se sube a GitHub. En modo desarrollo la app usa el proveedor *debug* con ese token; en producción usa Play Integrity.

## Generar el development build y ejecutar la app

La app usa módulos nativos (Firebase, SQLite), así que **no funciona en Expo Go** y necesita un *development build*.

```bash
npm install

# Opción A: build local (requiere Android SDK + JDK 17)
npx expo run:android

# Opción B: build en la nube con EAS
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform android
# Instalar el APK que genera EAS en el emulador o el celular
```

Con el development build ya instalado:

```bash
npx expo start --dev-client
```

Después, abrir la app *FotoApuntes* en el dispositivo.

> Si usas EAS Build, `google-services.json` sí se sube al build porque `.easignore` no lo excluye, aunque esté en `.gitignore`.
