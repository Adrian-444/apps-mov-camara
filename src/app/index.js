import * as ImagePicker from "expo-image-picker";
import * as Network from "expo-network";
import { Link, router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { saveNote } from "../lib/db";
import { analyzeNote, FriendlyError } from "../lib/gemini";
import { colors } from "../lib/theme";
import Btn from "../components/Btn";

const PICKER_OPTIONS = {
    mediaTypes: ["images"],
    base64: true,
    quality: 0.5, // reduce el tamaño del base64 que se envía a Gemini
};

export default function CaptureScreen() {
    const db = useSQLiteContext();
    const [image, setImage] = useState(null); // { uri, base64, mimeType }
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function takePhoto() {
        setError(null);
        try {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
                Alert.alert(
                    "Permiso de cámara denegado",
                    "Para tomar la foto del apunte necesitamos acceso a la cámara. Puedes activarlo en Ajustes o elegir una imagen de la galería.",
                    [
                        { text: "Cancelar", style: "cancel" },
                        ...(permission.canAskAgain ? [] : [{ text: "Abrir ajustes", onPress: () => Linking.openSettings() }]),
                    ]
                );
                return;
            }
            const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
            handlePickerResult(result);
        } catch (e) {
            console.error(e);
            setError("No se pudo abrir la cámara.");
        }
    }

    async function pickFromGallery() {
        setError(null);
        try {
            const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
            handlePickerResult(result);
        } catch (e) {
            console.error(e);
            setError("No se pudo abrir la galería.");
        }
    }

    function handlePickerResult(result) {
        // El usuario canceló la cámara/galería: no hacemos nada
        if (result.canceled || !result.assets?.length) return;
        const asset = result.assets[0];
        if (!asset.base64) {
            setError("No se pudo leer la imagen. Intenta con otra.");
            return;
        }
        setImage({ uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType ?? "image/jpeg" });
    }

    async function analyze() {
        if (!image) return;
        setError(null);

        const net = await Network.getNetworkStateAsync().catch(() => null);
        if (net && (!net.isConnected || net.isInternetReachable === false)) {
            setError("Sin conexión a internet. Conéctate y vuelve a intentarlo.");
            return;
        }

        setLoading(true);
        try {
            const note = await analyzeNote(image.base64, image.mimeType);
            const id = await saveNote(db, note, image.uri);
            setImage(null);
            router.push(`/resumen/${id}`);
        } catch (e) {
            setError(e instanceof FriendlyError ? e.message : "Ocurrió un error inesperado. Intenta de nuevo.");
            if (!(e instanceof FriendlyError)) console.error(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.subtitle}>
                Toma una foto de tu apunte y la IA generará un resumen y un quiz para repasar.
            </Text>

            <View style={styles.previewBox}>
                {image ? (
                    <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="contain" />
                ) : (
                    <Text style={styles.placeholder}>Aún no hay foto seleccionada</Text>
                )}
                {loading && (
                    <View style={styles.overlay}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.overlayText}>Analizando apunte…</Text>
                    </View>
                )}
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.row}>
                <Btn label="Tomar foto" onPress={takePhoto} disabled={loading} style={{ flex: 1 }} />
                <Btn label="Elegir de galería" onPress={pickFromGallery} disabled={loading} style={{ flex: 1 }} variant="outline" />
            </View>

            <Btn label={loading ? "Analizando…" : "Analizar con IA"} onPress={analyze} disabled={!image || loading} />

            <Link href="/historial" asChild>
                <Pressable disabled={loading} style={styles.link}>
                    <Text style={styles.linkText}>Ver historial</Text>
                </Pressable>
            </Link>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, gap: 16 },
    subtitle: { color: colors.muted, fontSize: 15, textAlign: "center" },
    previewBox: {
        height: 360,
        borderRadius: 16,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
    },
    preview: { width: "100%", height: "100%" },
    placeholder: { color: colors.muted },
    overlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: "rgba(0,0,0,0.55)",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    overlayText: { color: "#fff", fontWeight: "600" },
    error: {
        color: colors.error,
        backgroundColor: colors.errorBg,
        padding: 12,
        borderRadius: 10,
    },
    row: { flexDirection: "row", gap: 12 },
    link: { alignItems: "center", padding: 8 },
    linkText: { color: colors.primary, fontWeight: "600", fontSize: 15 },
});
