// Persistencia local del historial con expo-sqlite

export const DB_NAME = "fotoapuntes.db";

export async function migrateDb(db) {
    await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS apuntes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            image_uri TEXT,
            data TEXT NOT NULL,
            mejor_puntaje INTEGER,
            created_at INTEGER NOT NULL
        );
    `);
}

export async function saveNote(db, note, imageUri) {
    const result = await db.runAsync(
        "INSERT INTO apuntes (titulo, image_uri, data, created_at) VALUES (?, ?, ?, ?)",
        note.titulo,
        imageUri ?? null,
        JSON.stringify(note),
        Date.now()
    );
    return result.lastInsertRowId;
}

export async function getNote(db, id) {
    const row = await db.getFirstAsync("SELECT * FROM apuntes WHERE id = ?", Number(id));
    if (!row) return null;
    return { ...row, ...JSON.parse(row.data) };
}

export async function listNotes(db) {
    return db.getAllAsync(
        "SELECT id, titulo, image_uri, mejor_puntaje, created_at FROM apuntes ORDER BY created_at DESC"
    );
}

export async function saveScore(db, id, score) {
    await db.runAsync(
        "UPDATE apuntes SET mejor_puntaje = MAX(COALESCE(mejor_puntaje, 0), ?) WHERE id = ?",
        score,
        Number(id)
    );
}

export async function deleteNote(db, id) {
    await db.runAsync("DELETE FROM apuntes WHERE id = ?", Number(id));
}
