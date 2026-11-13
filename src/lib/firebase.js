import { getApp } from "@react-native-firebase/app";
import { initializeAppCheck, ReactNativeFirebaseAppCheckProvider } from "@react-native-firebase/app-check";
import { getAI, getGenerativeModel, GoogleAIBackend, ThinkingLevel } from "@react-native-firebase/ai";
import { notesSchema } from "./prompt";

const app = getApp();

// App Check: en desarrollo usamos el proveedor "debug" con un token generado en la
// consola de Firebase (App Check → Administrar tokens de depuración), leído de
// EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN en .env.local (no se sube a git).
// En producción se usa Play Integrity / App Attest.
const debugToken = process.env.EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN;

if (__DEV__ && !debugToken) {
    console.warn(
        "Falta EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN en .env.local; App Check rechazará las llamadas a la IA."
    );
}

const appCheckProvider = new ReactNativeFirebaseAppCheckProvider();
appCheckProvider.configure({
    android: __DEV__ ? { provider: "debug", debugToken } : { provider: "playIntegrity" },
    apple: __DEV__ ? { provider: "debug", debugToken } : { provider: "appAttestWithDeviceCheckFallback" },
});

export const appCheck = initializeAppCheck(app, {
    provider: appCheckProvider,
    isTokenAutoRefreshEnabled: true,
});

// Backend de Gemini Developer API (el que se habilitó en Firebase AI Logic)
const ai = getAI(app, { backend: new GoogleAIBackend(), appCheck });

// Modelo configurado para responder SOLO JSON con la estructura de notesSchema
export const AI_TIMEOUT_MS = 60000;

// Modelo ligero: responde más rápido y se satura menos que gemini-3.8-flash
// (con 3.8-flash el servidor devolvía DEADLINE_EXCEEDED por carga).
export const MODEL_NAME = "gemini-3.5-flash-lite";

export const model = getGenerativeModel(
    ai,
    {
        model: MODEL_NAME,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: notesSchema,
            temperature: 0.4,
            // Resumir un apunte no requiere razonamiento profundo: responde más rápido
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
    },
    // Si Gemini no responde en 60 s, se cancela en vez de quedarse cargando para siempre
    { timeout: AI_TIMEOUT_MS }
);
