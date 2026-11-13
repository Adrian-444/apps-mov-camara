import { Schema } from "@react-native-firebase/ai";

// Reto extra: estructura de la respuesta definida con responseSchema.
// Gemini queda obligado a devolver exactamente este JSON.
export const notesSchema = Schema.object({
    properties: {
        es_apunte: Schema.boolean({
            description: "true si la imagen contiene un apunte o material de estudio legible",
        }),
        titulo: Schema.string(),
        resumen: Schema.string(),
        conceptos_clave: Schema.array({ items: Schema.string() }),
        preguntas: Schema.array({
            items: Schema.object({
                properties: {
                    pregunta: Schema.string(),
                    opciones: Schema.array({ items: Schema.string() }),
                    correcta: Schema.integer({
                        description: "Índice (empezando en 0) de la opción correcta dentro de 'opciones'",
                    }),
                },
            }),
        }),
    },
});

export const PROMPT = `Eres un tutor que ayuda a estudiantes universitarios a repasar.
Analiza la imagen adjunta, que debería ser la foto de un apunte (escrito a mano, impreso, pizarrón o diapositiva).

Instrucciones:
1. Si la imagen NO es un apunte o está tan borrosa que no se puede leer, responde con "es_apunte": false y deja los demás campos vacíos ("" o []).
2. Si sí es un apunte, responde con "es_apunte": true y:
   - "titulo": un título corto (máximo 8 palabras) del tema.
   - "resumen": un resumen claro de 3 a 5 oraciones, en español.
   - "conceptos_clave": entre 3 y 6 conceptos importantes, cada uno de pocas palabras.
   - "preguntas": EXACTAMENTE 5 preguntas de opción múltiple basadas SOLO en el contenido del apunte.
     Cada una con 4 "opciones" y "correcta" igual al índice (0 a 3) de la opción correcta.
     Varía la posición de la respuesta correcta.
3. Responde solo con JSON, sin texto adicional ni bloques de código.

Formato:
{ "es_apunte": true, "titulo": "", "resumen": "", "conceptos_clave": [], "preguntas": [ { "pregunta": "", "opciones": [], "correcta": 0 } ] }`;
