import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../lib/theme";

export default function Btn({ label, onPress, disabled, style, variant = "solid" }) {
    const outline = variant === "outline";
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            style={({ pressed }) => [
                styles.btn,
                outline && styles.btnOutline,
                pressed && { opacity: 0.8 },
                disabled && { opacity: 0.4 },
                style,
            ]}
        >
            <Text style={[styles.btnText, outline && { color: colors.primary }]}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    btn: {
        backgroundColor: colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 2,
        borderColor: colors.primary,
    },
    btnOutline: { backgroundColor: "transparent" },
    btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
