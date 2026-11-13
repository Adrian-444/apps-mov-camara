import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { DB_NAME, migrateDb } from "../lib/db";
import { colors } from "../lib/theme";
// Inicializa Firebase + App Check al arrancar la app
import "../lib/firebase";

export default function RootLayout() {
    return (
        <SQLiteProvider databaseName={DB_NAME} onInit={migrateDb}>
            <StatusBar style="light" />
            <Stack
                screenOptions={{
                    headerStyle: { backgroundColor: colors.primary },
                    headerTintColor: "#fff",
                    headerTitleStyle: { fontWeight: "700" },
                    contentStyle: { backgroundColor: colors.bg },
                }}
            >
                <Stack.Screen name="index" options={{ title: "FotoApuntes" }} />
                <Stack.Screen name="resumen/[id]" options={{ title: "Resumen" }} />
                <Stack.Screen name="quiz/[id]" options={{ title: "Quiz" }} />
                <Stack.Screen name="historial" options={{ title: "Historial" }} />
            </Stack>
        </SQLiteProvider>
    );
}
