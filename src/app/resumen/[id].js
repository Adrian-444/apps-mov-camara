import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import Btn from "../../components/Btn";
import { getNote } from "../../lib/db";
import { colors } from "../../lib/theme";

export default function ResumenScreen() {
    const { id } = useLocalSearchParams();
    const db = useSQLiteContext();
    const [note, setNote] = useState(undefined);

    useEffect(() => {
        getNote(db, id)
            .then(setNote)
            .catch(e => {
                console.error(e);
                setNote(null);
            });
    }, [db, id]);

    if (note === undefined) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (note === null) {
        return (
            <View style={styles.center}>
                <Text style={styles.muted}>No se encontró este apunte.</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {note.image_uri && <Image source={{ uri: note.image_uri }} style={styles.thumb} resizeMode="cover" />}

            <Text style={styles.title}>{note.titulo}</Text>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Resumen</Text>
                <Text style={styles.body}>{note.resumen}</Text>
            </View>

            {note.conceptos_clave.length > 0 && (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Conceptos clave</Text>
                    <View style={styles.chips}>
                        {note.conceptos_clave.map((c, i) => (
                            <View key={i} style={styles.chip}>
                                <Text style={styles.chipText}>{c}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            <Btn label={`Hacer quiz (${note.preguntas.length} preguntas)`} onPress={() => router.push(`/quiz/${id}`)} />
            <Btn label="Analizar otro apunte" variant="outline" onPress={() => router.dismissTo("/")} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, gap: 16 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    muted: { color: colors.muted },
    thumb: { width: "100%", height: 160, borderRadius: 16 },
    title: { fontSize: 24, fontWeight: "800", color: colors.text },
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        gap: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.primary, textTransform: "uppercase", letterSpacing: 0.5 },
    body: { fontSize: 16, lineHeight: 24, color: colors.text },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { backgroundColor: colors.bg, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border },
    chipText: { color: colors.text, fontWeight: "600" },
});
