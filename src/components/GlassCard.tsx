import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '../theme';

interface GlassCardProps {
    children: React.ReactNode;
    title?: string;
    style?: ViewStyle;
}

export function GlassCard({ children, title, style }: GlassCardProps) {
    return (
        <View style={[styles.card, style]}>
            {title && <Text style={styles.title}>{title}</Text>}
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    title: {
        fontSize: fontSize.xl,
        fontWeight: '700',
        color: colors.primary,
        marginBottom: spacing.lg,
    },
});
