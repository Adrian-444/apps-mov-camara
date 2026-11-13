import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { deleteNote, listNotes } from "../lib/db";
import { colors } from "../lib/theme";

export default function HistorialScreen() {
    const db = useSQLiteContext();
    const [notes, setNotes] = useState([]);

    const load = useCallback(() => {
        listNotes(db).then(setNotes).catch(console.error);
    }, [db]);

    // Recarga cada vez que la pantalla gana foco (p. ej. al volver de un quiz)
    useFocusEffect(load);

    function confirmDelete(item) {
        Alert.alert("Eliminar apunte", `¿Eliminar "${item.titulo}" del historial?`, [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Eliminar",
                style: "destructive",
                onPress: () => deleteNote(db, item.id).then(load).catch(console.error),
            },
        ]);
    }

    return (
        <FlatList
            data={notes}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
                <Text style={styles.empty}>Todavía no has analizado ningún apunte.</Text>
            }
            renderItem={({ item }) => (
                <Pressable
                    style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}
                    onPress={() => router.push(`/resumen/${item.id}`)}
                    onLongPress={() => confirmDelete(item)}
                >
                    {item.image_uri ? (
                        <Image source={{ uri: item.image_uri }} style={styles.thumb} />
                    ) : (
                        <View style={[styles.thumb, { backgroundColor: colors.border }]} />
                    )}
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title} numberOfLines={2}>
                            {item.titulo}
                        </Text>
                        <Text style={styles.meta}>
                            {new Date(item.created_at).toLocaleString()}
                            {item.mejor_puntaje != null ? ` · Mejor: ${item.mejor_puntaje}` : ""}
                        </Text>
                    </View>
                </Pressable>
            )}
            ListFooterComponent={
                notes.length > 0 ? <Text style={styles.hint}>Mantén presionado un apunte para eliminarlo.</Text> : null
            }
        />
    );
}

const styles = StyleSheet.create({
    list: { padding: 16, gap: 12 },
    empty: { textAlign: "center", color: colors.muted, marginTop: 48 },
    item: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.card,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
    },
    thumb: { width: 56, height: 56, borderRadius: 10 },
    title: { fontSize: 16, fontWeight: "700", color: colors.text },
    meta: { color: colors.muted, marginTop: 4, fontSize: 13 },
    hint: { textAlign: "center", color: colors.muted, fontSize: 12, marginTop: 8 },
});
