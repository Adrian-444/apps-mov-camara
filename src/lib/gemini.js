import { model } from "./firebase";
import { PROMPT } from "./prompt";

// Error con un mensaje pensado para mostrarse al usuario
export class FriendlyError extends Error {}

/**
 * Envía la foto (base64) junto con el prompt a Gemini y devuelve el apunte ya validado.
 * Nunca lanza errores "crudos": todo se convierte en FriendlyError.
 */
export async function analyzeNote(base64, mimeType = "image/jpeg") {
    let text;
    try {
        const result = await model.generateContent([
            PROMPT,
            { inlineData: { mimeType, data: base64 } },
        ]);
        text = result.response.text();
    } catch (error) {
        console.error("Error llamando a Gemini:", error?.code, error?.message, error);
        const msg = String(error?.message ?? "").toLowerCase();
        if (msg.includes("timeout") || msg.includes("abort")) {
            throw new FriendlyError("La IA tardó demasiado en responder. Inténtalo de nuevo.");
        }
        if (msg.includes("app check") || msg.includes("appcheck") || msg.includes("403")) {
            throw new FriendlyError("La app no pudo verificarse con Firebase (App Check).");
        }
        throw new FriendlyError(
            "No se pudo contactar al servicio de IA. Revisa tu conexión e inténtalo de nuevo."
        );
    }

    return parseNote(text);
}

export function parseNote(text) {
    let data;
    try {
        // Por si el modelo envolviera el JSON en ```json ... ```
        const clean = text.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "").trim();
        data = JSON.parse(clean);
    } catch {
        console.error("JSON inválido de Gemini:", text);
        throw new FriendlyError("La respuesta de la IA no tuvo el formato esperado. Intenta de nuevo.");
    }

    if (data.es_apunte === false) {
        throw new FriendlyError(
            "No pudimos leer un apunte en esta foto. Asegúrate de que esté enfocada, bien iluminada y que sea material de estudio."
        );
    }

    const preguntas = Array.isArray(data.preguntas)
        ? data.preguntas.filter(
              p =>
                  p &&
                  typeof p.pregunta === "string" &&
                  Array.isArray(p.opciones) &&
                  p.opciones.length >= 2 &&
                  Number.isInteger(p.correcta) &&
                  p.correcta >= 0 &&
                  p.correcta < p.opciones.length
          )
        : [];

    if (!data.titulo || !data.resumen || preguntas.length === 0) {
        throw new FriendlyError("La IA devolvió una respuesta incompleta. Intenta con otra foto.");
    }

    return {
        titulo: String(data.titulo),
        resumen: String(data.resumen),
        conceptos_clave: Array.isArray(data.conceptos_clave) ? data.conceptos_clave.map(String) : [],
        preguntas,
    };
}
