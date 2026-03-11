import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, borderRadius, spacing, fontSize } from '../theme';
import { useApp } from '../context/AppContext';
import { GlassCard } from '../components/GlassCard';
import { StatCard } from '../components/StatCard';
import { BACKEND_URL } from '../config';

function StatusIndicator({ isOnline }: { isOnline: boolean }) {
    return (
        <View
            style={[
                styles.statusDot,
                { backgroundColor: isOnline ? colors.success : colors.danger },
            ]}
        />
    );
}

function InfoRow({ label, value, mono, badge }: { label: string; value: string; mono?: boolean; badge?: boolean }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text
                style={[
                    styles.infoValue,
                    mono && styles.infoMono,
                    badge && styles.infoBadge,
                ]}
                numberOfLines={1}>
                {value}
            </Text>
        </View>
    );
}

export function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const {
        isConnected,
        mqttStatus,
        backendStatus,
        dbStatus,
        totalCards,
        todayTransactions,
        totalVolume,
        totalPayments,
        totalTransactions,
        netBalance,
        refreshStats,
    } = useApp();

    const [refreshing, setRefreshing] = React.useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshStats();
        setRefreshing(false);
    };

    useEffect(() => {
        refreshStats();
    }, []);

    return (
        <ScrollView
            style={[styles.container, { paddingTop: insets.top }]}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
            {/* Header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>⚙️ Settings & System</Text>
                <Text style={styles.sectionSubtitle}>
                    Monitor system health, view statistics, and configuration
                </Text>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsRow}>
                <StatCard icon="💳" label="Total Cards" value={totalCards} />
                <StatCard icon="📈" label="Today's Tx" value={todayTransactions} />
            </View>
            <View style={styles.statsRow}>
                <StatCard icon="💰" label="Top-Up Vol." value={`$${totalVolume.toFixed(2)}`} />
                <StatCard icon="🛍️" label="Purchases" value={`$${totalPayments.toFixed(2)}`} />
            </View>

            {/* System Status */}
            <GlassCard title="🔌 System Status" style={{ marginTop: spacing.xl }}>
                <View style={styles.statusGrid}>
                    <View style={styles.statusCard}>
                        <StatusIndicator isOnline={mqttStatus} />
                        <View style={styles.statusInfo}>
                            <Text style={styles.statusName}>MQTT Broker</Text>
                            <Text style={styles.statusDetail}>
                                {mqttStatus ? 'Connected' : 'Disconnected'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.statusCard}>
                        <StatusIndicator isOnline={backendStatus} />
                        <View style={styles.statusInfo}>
                            <Text style={styles.statusName}>Backend Server</Text>
                            <Text style={styles.statusDetail}>
                                {backendStatus ? 'Online' : 'Offline'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.statusCard}>
                        <StatusIndicator isOnline={dbStatus} />
                        <View style={styles.statusInfo}>
                            <Text style={styles.statusName}>MongoDB</Text>
                            <Text style={styles.statusDetail}>
                                {dbStatus ? 'Connected' : 'Unknown'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.statusCard}>
                        <StatusIndicator isOnline={isConnected} />
                        <View style={styles.statusInfo}>
                            <Text style={styles.statusName}>WebSocket</Text>
                            <Text style={styles.statusDetail}>
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </Text>
                        </View>
                    </View>
                </View>
            </GlassCard>

            {/* Overview Statistics */}
            <GlassCard title="📈 Overview Statistics" style={{ marginTop: spacing.xl }}>
                <View style={styles.settingsStatsGrid}>
                    {[
                        { icon: '💳', value: totalCards.toString(), label: 'Registered Cards' },
                        { icon: '📊', value: totalTransactions.toString(), label: 'Total Transactions' },
                        { icon: '💰', value: `$${totalVolume.toFixed(2)}`, label: 'Top-Up Volume' },
                        { icon: '🛍️', value: `$${totalPayments.toFixed(2)}`, label: 'Purchase Volume' },
                        { icon: '📅', value: todayTransactions.toString(), label: "Today's Transactions" },
                        { icon: '💵', value: `$${netBalance.toFixed(2)}`, label: 'Net Card Balance' },
                    ].map((stat, index) => (
                        <View key={index} style={styles.settingsStatCard}>
                            <Text style={styles.settingsStatIcon}>{stat.icon}</Text>
                            <Text style={styles.settingsStatValue}>{stat.value}</Text>
                            <Text style={styles.settingsStatLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>
            </GlassCard>

            {/* System Information */}
            <GlassCard title="🖥️ System Information" style={{ marginTop: spacing.xl }}>
                <InfoRow label="Application" value="RFID Dashboard" />
                <InfoRow label="Version" value="1.2.0" />
                <InfoRow label="Team ID" value="team_rdf" badge />
                <InfoRow label="Backend URL" value={BACKEND_URL} mono />
                <InfoRow label="MQTT Broker" value="broker.benax.rw:1883" mono />
                <InfoRow label="Database" value="MongoDB Atlas" mono />
                <InfoRow label="WebSocket" value="Socket.IO v4.7.2" mono />
            </GlassCard>

            {/* MQTT Topics */}
            <GlassCard title="📡 MQTT Topics" style={{ marginTop: spacing.xl }}>
                <InfoRow label="Card Status" value="rfid/team_rdf/card/status" mono />
                <InfoRow label="Card Balance" value="rfid/team_rdf/card/balance" mono />
                <InfoRow label="Top-Up" value="rfid/team_rdf/card/topup" mono />
                <InfoRow label="Payment" value="rfid/team_rdf/card/payment" mono />
                <InfoRow label="Topic Prefix" value="rfid/team_rdf/" badge />
            </GlassCard>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgDark,
    },
    contentContainer: {
        padding: spacing.xl,
    },
    sectionHeader: {
        marginBottom: spacing.xxl,
    },
    sectionTitle: {
        fontSize: fontSize.title,
        fontWeight: '700',
        color: colors.textMain,
        marginBottom: spacing.xs,
    },
    sectionSubtitle: {
        fontSize: fontSize.md,
        color: colors.textMuted,
    },
    statsRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    // Status Grid
    statusGrid: {
        gap: spacing.md,
    },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    statusInfo: {
        flex: 1,
    },
    statusName: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: colors.textMain,
    },
    statusDetail: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginTop: 2,
    },
    // Settings Stats
    settingsStatsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    settingsStatCard: {
        width: '47%',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    settingsStatIcon: {
        fontSize: 28,
        marginBottom: spacing.sm,
    },
    settingsStatValue: {
        fontSize: fontSize.xxl,
        fontWeight: '700',
        color: colors.textMain,
        marginBottom: spacing.xs,
    },
    settingsStatLabel: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        textAlign: 'center',
    },
    // Info rows
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.glassBorder,
    },
    infoLabel: {
        fontSize: fontSize.md,
        color: colors.textMuted,
        flex: 1,
    },
    infoValue: {
        fontSize: fontSize.md,
        fontWeight: '500',
        color: colors.textMain,
        flex: 1,
        textAlign: 'right',
    },
    infoMono: {
        fontFamily: 'monospace',
        fontSize: fontSize.sm,
    },
    infoBadge: {
        backgroundColor: colors.primaryLight,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        overflow: 'hidden',
        color: colors.primary,
        fontWeight: '600',
    },
});
