import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Btn from "../../components/Btn";
import { getNote, saveScore } from "../../lib/db";
import { colors } from "../../lib/theme";

export default function QuizScreen() {
    const { id } = useLocalSearchParams();
    const db = useSQLiteContext();
    const [note, setNote] = useState(undefined);
    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState(null);
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);

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

    const preguntas = note.preguntas;
    const total = preguntas.length;

    if (finished) {
        const pct = Math.round((score / total) * 100);
        return (
            <View style={[styles.container, styles.center]}>
                <Text style={styles.resultEmoji}>{pct >= 80 ? "🎉" : pct >= 60 ? "👍" : "📚"}</Text>
                <Text style={styles.resultTitle}>
                    {score} / {total}
                </Text>
                <Text style={styles.muted}>
                    {pct >= 80 ? "¡Excelente! Dominas el tema." : pct >= 60 ? "Bien, pero repasa un poco más." : "Te conviene repasar el resumen."}
                </Text>
                <View style={{ width: "100%", gap: 12, marginTop: 24 }}>
                    <Btn label="Reintentar quiz" onPress={restart} />
                    <Btn label="Ver resumen" variant="outline" onPress={() => router.back()} />
                </View>
            </View>
        );
    }

    const q = preguntas[index];
    const answered = selected !== null;

    function choose(i) {
        if (answered) return;
        setSelected(i);
        if (i === q.correcta) setScore(s => s + 1);
    }

    function next() {
        if (index + 1 < total) {
            setIndex(index + 1);
            setSelected(null);
        } else {
            setFinished(true);
            saveScore(db, id, score).catch(console.error);
        }
    }

    function restart() {
        setIndex(0);
        setSelected(null);
        setScore(0);
        setFinished(false);
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${((index + (answered ? 1 : 0)) / total) * 100}%` }]} />
            </View>
            <Text style={styles.counter}>
                Pregunta {index + 1} de {total} · Puntaje: {score}
            </Text>

            <Text style={styles.question}>{q.pregunta}</Text>

            <View style={{ gap: 10 }}>
                {q.opciones.map((op, i) => {
                    const isCorrect = i === q.correcta;
                    const isSelected = i === selected;
                    return (
                        <Pressable
                            key={i}
                            onPress={() => choose(i)}
                            disabled={answered}
                            style={[
                                styles.option,
                                answered && isCorrect && styles.optionCorrect,
                                answered && isSelected && !isCorrect && styles.optionWrong,
                            ]}
                        >
                            <Text style={styles.optionLetter}>{String.fromCharCode(65 + i)}</Text>
                            <Text style={styles.optionText}>{op}</Text>
                        </Pressable>
                    );
                })}
            </View>

            {answered && (
                <View style={[styles.feedback, selected === q.correcta ? styles.feedbackOk : styles.feedbackBad]}>
                    <Text style={{ color: selected === q.correcta ? colors.success : colors.error, fontWeight: "700" }}>
                        {selected === q.correcta
                            ? "¡Correcto!"
                            : `Incorrecto. La respuesta correcta es: ${q.opciones[q.correcta]}`}
                    </Text>
                </View>
            )}

            <Btn label={index + 1 < total ? "Siguiente" : "Ver resultado"} onPress={next} disabled={!answered} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, gap: 16, flexGrow: 1 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
    muted: { color: colors.muted, textAlign: "center", fontSize: 16 },
    progressTrack: { height: 8, backgroundColor: colors.border, borderRadius: 999, overflow: "hidden" },
    progressFill: { height: "100%", backgroundColor: colors.primary },
    counter: { color: colors.muted, fontWeight: "600" },
    question: { fontSize: 20, fontWeight: "700", color: colors.text, lineHeight: 28 },
    option: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.card,
        borderWidth: 2,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 14,
    },
    optionCorrect: { borderColor: colors.success, backgroundColor: colors.successBg },
    optionWrong: { borderColor: colors.error, backgroundColor: colors.errorBg },
    optionLetter: { fontWeight: "800", color: colors.primary, width: 18 },
    optionText: { flex: 1, fontSize: 16, color: colors.text },
    feedback: { padding: 12, borderRadius: 10 },
    feedbackOk: { backgroundColor: colors.successBg },
    feedbackBad: { backgroundColor: colors.errorBg },
    resultEmoji: { fontSize: 64 },
    resultTitle: { fontSize: 48, fontWeight: "800", color: colors.text },
});
