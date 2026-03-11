import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fontSize } from '../theme';

interface CardVisualProps {
    uid: string | null;
    holderName: string;
    balance: number;
    isActive: boolean;
    opacity?: number;
}

export function CardVisual({ uid, holderName, balance, isActive, opacity = 1 }: CardVisualProps) {
    return (
        <View style={[styles.container, { opacity: isActive ? 1 : opacity }]}>
            <LinearGradient
                colors={['#0f0c29', '#302b63', '#24243e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}>
                {/* Mastercard-style circles */}
                <View style={styles.circlesContainer}>
                    <View style={styles.redCircle} />
                    <View style={styles.orangeCircle} />
                </View>

                {/* Chip */}
                <View style={styles.chip}>
                    <LinearGradient
                        colors={['#ffd700', '#ffed4e', '#d4af37', '#ffd700', '#c5a028']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.chipInner}
                    />
                </View>

                {/* Card number */}
                <Text style={styles.cardNumber}>**** **** **** ****</Text>

                {/* Card details */}
                <View style={styles.details}>
                    <View style={styles.detailGroup}>
                        <Text style={styles.detailLabel}>CARD HOLDER</Text>
                        <Text style={styles.detailValue}>{holderName || 'NO CARD'}</Text>
                    </View>
                    <View style={styles.detailGroup}>
                        <Text style={styles.detailLabel}>BALANCE</Text>
                        <Text style={styles.detailValue}>${balance.toFixed(2)}</Text>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginBottom: spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 16,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        height: 220,
        borderRadius: 16,
        padding: spacing.xl,
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    circlesContainer: {
        position: 'absolute',
        top: spacing.xl,
        right: spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
    },
    redCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#eb001b',
    },
    orangeCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 95, 0, 0.9)',
        marginLeft: -14,
    },
    chip: {
        width: 44,
        height: 34,
        borderRadius: 6,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 4,
    },
    chipInner: {
        flex: 1,
    },
    cardNumber: {
        fontFamily: 'monospace',
        fontSize: fontSize.xl,
        letterSpacing: 4,
        color: '#ffffff',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    details: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    detailGroup: {
        flexDirection: 'column',
    },
    detailLabel: {
        fontSize: 9,
        color: 'rgba(255, 255, 255, 0.6)',
        letterSpacing: 1.5,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: fontSize.lg,
        fontWeight: '600',
        color: '#ffffff',
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },
});
