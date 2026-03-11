import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, borderRadius, spacing, fontSize } from '../theme';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

export function RoleSelectionScreen() {
    const { setUserRole } = useApp();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
            <LinearGradient
                colors={['rgba(0, 0, 0, 0.05)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.header}>
                <Text style={styles.title}>TAP & PAY</Text>
                <Text style={styles.subtitle}>Please select your role to continue</Text>
            </View>

            <View style={styles.cardsContainer}>
                <Pressable style={styles.roleCard} onPress={() => setUserRole('admin')}>
                    {({ pressed }) => (
                        <View
                            style={[
                                styles.roleCardInner,
                                pressed && styles.roleCardPressed,
                            ]}>
                            <Text style={styles.roleIcon}>👨‍💼</Text>
                            <Text style={styles.roleName}>Administrator</Text>
                            <Text style={styles.roleDesc}>
                                Full access to all features including system settings and configurations
                            </Text>
                            <LinearGradient
                                colors={[colors.primary, '#1a1a1a']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.selectBtn}>
                                <Text style={styles.selectBtnText}>Select</Text>
                            </LinearGradient>
                        </View>
                    )}
                </Pressable>

                <Pressable style={styles.roleCard} onPress={() => setUserRole('user')}>
                    {({ pressed }) => (
                        <View
                            style={[
                                styles.roleCardInner,
                                pressed && styles.roleCardPressed,
                            ]}>
                            <Text style={styles.roleIcon}>👤</Text>
                            <Text style={styles.roleName}>Normal User</Text>
                            <Text style={styles.roleDesc}>
                                Access to top-up, marketplace, and transaction history
                            </Text>
                            <LinearGradient
                                colors={[colors.primary, '#1a1a1a']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.selectBtn}>
                                <Text style={styles.selectBtnText}>Select</Text>
                            </LinearGradient>
                        </View>
                    )}
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgDark,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xxxl + 16,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: colors.textMain,
        marginBottom: spacing.sm,
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: fontSize.lg,
        color: colors.textMuted,
    },
    cardsContainer: {
        width: '100%',
        gap: spacing.xl,
    },
    roleCard: {
        width: '100%',
    },
    roleCardInner: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 2,
        borderColor: colors.glassBorder,
        borderRadius: borderRadius.xl,
        padding: spacing.xxl,
        alignItems: 'center',
    },
    roleCardPressed: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
        transform: [{ scale: 0.98 }],
    },
    roleIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    roleName: {
        fontSize: fontSize.xxl,
        fontWeight: '600',
        color: colors.textMain,
        marginBottom: spacing.sm,
    },
    roleDesc: {
        fontSize: fontSize.md,
        color: colors.textMuted,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.xl,
    },
    selectBtn: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    selectBtnText: {
        color: colors.bgDark,
        fontSize: fontSize.lg,
        fontWeight: '600',
    },
});
