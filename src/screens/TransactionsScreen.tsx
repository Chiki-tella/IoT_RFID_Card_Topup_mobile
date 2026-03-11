import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, borderRadius, spacing, fontSize } from '../theme';
import { useApp, Transaction } from '../context/AppContext';
import { GlassCard } from '../components/GlassCard';

const ITEMS_PER_PAGE = 10;

function TransactionItem({ tx }: { tx: Transaction }) {
    const date = new Date(tx.timestamp);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString();
    const isTopup = tx.type === 'topup';

    return (
        <View style={styles.txItem}>
            <View style={[styles.txIcon, isTopup ? styles.txIconTopup : styles.txIconDebit]}>
                <Text style={styles.txIconText}>{isTopup ? '↑' : '↓'}</Text>
            </View>
            <View style={styles.txDetails}>
                <Text style={styles.txDesc} numberOfLines={1}>
                    {tx.holderName || 'Unknown'} - {tx.description || tx.type}
                </Text>
                <Text style={styles.txTime}>
                    {dateStr} {timeStr}
                </Text>
            </View>
            <View style={styles.txAmountSection}>
                <Text style={[styles.txAmount, isTopup ? styles.amountPositive : styles.amountNegative]}>
                    {isTopup ? '+' : '-'}${tx.amount.toFixed(2)}
                </Text>
                <Text style={styles.txBalance}>Bal: ${tx.balanceAfter.toFixed(2)}</Text>
            </View>
        </View>
    );
}

function PaginationControls({
    currentPage,
    totalPages,
    onPageChange,
}: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}) {
    return (
        <View style={styles.paginationContainer}>
            <TouchableOpacity
                style={[styles.paginationBtn, currentPage === 1 && styles.paginationBtnDisabled]}
                onPress={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}>
                <Text style={styles.paginationBtnText}>← Previous</Text>
            </TouchableOpacity>

            <View style={styles.pageIndicator}>
                <Text style={styles.pageText}>
                    Page {currentPage} of {totalPages}
                </Text>
            </View>

            <TouchableOpacity
                style={[styles.paginationBtn, currentPage === totalPages && styles.paginationBtnDisabled]}
                onPress={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}>
                <Text style={styles.paginationBtnText}>Next →</Text>
            </TouchableOpacity>
        </View>
    );
}

export function TransactionsScreen() {
    const insets = useSafeAreaInsets();
    const { topupHistory, purchaseHistory, refreshHistory } = useApp();
    const [refreshing, setRefreshing] = React.useState(false);
    const [activeTab, setActiveTab] = useState<'topup' | 'purchase'>('topup');
    const [currentPage, setCurrentPage] = useState(1);

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshHistory();
        setRefreshing(false);
    };

    useEffect(() => {
        refreshHistory();
    }, []);

    const transactions = activeTab === 'topup' ? topupHistory : purchaseHistory;
    const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedTransactions = transactions.slice(startIdx, startIdx + ITEMS_PER_PAGE);

    const handleTabChange = (tab: 'topup' | 'purchase') => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <ScrollView
            style={[styles.container, { paddingTop: insets.top }]}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
            {/* Header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>📊 Transactions</Text>
                <Text style={styles.sectionSubtitle}>View all top-ups and purchase records</Text>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'topup' && styles.tabActive]}
                    onPress={() => handleTabChange('topup')}>
                    <Text style={[styles.tabText, activeTab === 'topup' && styles.tabTextActive]}>
                        💰 Top-Ups ({topupHistory.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'purchase' && styles.tabActive]}
                    onPress={() => handleTabChange('purchase')}>
                    <Text style={[styles.tabText, activeTab === 'purchase' && styles.tabTextActive]}>
                        🛍️ Purchases ({purchaseHistory.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Transactions List */}
            <GlassCard style={{ marginBottom: spacing.xl }}>
                {paginatedTransactions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyText}>
                            No {activeTab === 'topup' ? 'top-up' : 'purchase'} transactions yet
                        </Text>
                    </View>
                ) : (
                    <>
                        {paginatedTransactions.map(tx => (
                            <TransactionItem key={tx._id} tx={tx} />
                        ))}
                    </>
                )}
            </GlassCard>

            {/* Pagination Controls */}
            {transactions.length > ITEMS_PER_PAGE && (
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            )}

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
    tabContainer: {
        flexDirection: 'row',
        marginBottom: spacing.xl,
        gap: spacing.md,
        borderBottomWidth: 2,
        borderBottomColor: colors.glassBorder,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
        alignItems: 'center',
    },
    tabActive: {
        borderBottomColor: colors.primary,
    },
    tabText: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: colors.textMuted,
    },
    tabTextActive: {
        color: colors.primary,
        fontWeight: '700',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.bgDarker,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.xl,
    },
    paginationBtn: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
    },
    paginationBtnDisabled: {
        backgroundColor: colors.textMuted,
        opacity: 0.5,
    },
    paginationBtnText: {
        color: colors.bgDark,
        fontWeight: '600',
        fontSize: fontSize.sm,
    },
    pageIndicator: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    pageText: {
        color: colors.textMain,
        fontWeight: '600',
        fontSize: fontSize.md,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xxl,
    },
    emptyIcon: {
        fontSize: 40,
        marginBottom: spacing.md,
    },
    emptyText: {
        fontSize: fontSize.md,
        color: colors.textMuted,
        fontStyle: 'italic',
    },
    txItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.glassBorder,
        gap: spacing.md,
    },
    txIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    txIconTopup: {
        backgroundColor: 'rgba(74, 222, 128, 0.15)',
    },
    txIconDebit: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    txIconText: {
        fontSize: fontSize.xl,
        fontWeight: '700',
        color: colors.textMain,
    },
    txDetails: {
        flex: 1,
    },
    txDesc: {
        fontSize: fontSize.md,
        fontWeight: '500',
        color: colors.textMain,
        marginBottom: 2,
    },
    txTime: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
    },
    txAmountSection: {
        alignItems: 'flex-end',
    },
    txAmount: {
        fontSize: fontSize.md,
        fontWeight: '700',
        marginBottom: 2,
    },
    amountPositive: {
        color: colors.success,
    },
    amountNegative: {
        color: colors.danger,
    },
    txBalance: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
    },
});
