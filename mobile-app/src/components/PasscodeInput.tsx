import React, { useRef, useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '../theme';

interface PasscodeInputProps {
    onComplete?: (passcode: string) => void;
    error?: string | null;
    label?: string;
    hint?: string;
}

export function PasscodeInput({ onComplete, error, label, hint }: PasscodeInputProps) {
    const [digits, setDigits] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    const handleChange = (text: string, index: number) => {
        if (!/^\d?$/.test(text)) return;

        const newDigits = [...digits];
        newDigits[index] = text;
        setDigits(newDigits);

        if (text && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits filled
        if (text && index === 5) {
            const passcode = newDigits.join('');
            if (passcode.length === 6) {
                onComplete?.(passcode);
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const clear = () => {
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            {hint && <Text style={styles.hint}>{hint}</Text>}
            <View style={styles.inputRow}>
                {digits.map((digit, index) => (
                    <TextInput
                        key={index}
                        ref={ref => {
                            inputRefs.current[index] = ref;
                        }}
                        style={[styles.digitInput, error ? styles.digitError : null]}
                        value={digit}
                        onChangeText={text => handleChange(text, index)}
                        onKeyPress={e => handleKeyPress(e, index)}
                        keyboardType="number-pad"
                        maxLength={1}
                        secureTextEntry
                        selectTextOnFocus
                    />
                ))}
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: spacing.md,
    },
    label: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: colors.textMain,
        marginBottom: spacing.sm,
    },
    hint: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginBottom: spacing.md,
    },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    digitInput: {
        width: 44,
        height: 52,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        color: colors.textMain,
        fontSize: fontSize.xxl,
        fontWeight: '700',
        textAlign: 'center',
    },
    digitError: {
        borderColor: colors.danger,
    },
    error: {
        fontSize: fontSize.sm,
        color: colors.danger,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
});
