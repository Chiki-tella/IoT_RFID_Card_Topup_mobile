import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    Pressable,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, spacing, fontSize } from '../theme';
import { useApp } from '../context/AppContext';
import { GlassCard } from '../components/GlassCard';
import { CardVisual } from '../components/CardVisual';
import { PasscodeInput } from '../components/PasscodeInput';

const QUICK_AMOUNTS = [5, 10, 20, 50];

export function TopUpScreen() {
    const insets = useSafeAreaInsets();
    const {
        lastScannedUid,
        currentCardData,
        cardPresent,
        isNewCard,
        graceTimeRemaining,
        topUp,
        setPasscode,
        isPaymentAllowed,
    } = useApp();

    const [amount, setAmount] = useState('');
    const [holderName, setHolderName] = useState('');
    const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [newCardPasscode, setNewCardPasscode] = useState('');
    const [passcodeError, setPasscodeError] = useState<string | null>(null);

    const holderNameFromCard = currentCardData?.holderName || '';
    const displayBalance = currentCardData?.balance ?? 0;
    const cardActive = !!lastScannedUid;

    const handleQuickAmount = (amt: number) => {
        setSelectedQuickAmount(amt);
        setAmount(amt.toString());
    };

    const handleTopUp = async () => {
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        if (!lastScannedUid) {
            Alert.alert('Error', 'No card scanned. Please scan your RFID card.');
            return;
        }

        // For new cards, require name and passcode
        if (!currentCardData && !holderName.trim()) {
            Alert.alert('Error', 'Please enter the card holder name for new cards');
            return;
        }

        if (!currentCardData && newCardPasscode.length !== 6) {
            setPasscodeError('Please enter a 6-digit passcode');
            return;
        }

        setLoading(true);
        try {
            const result = await topUp(
                lastScannedUid,
                amountNum,
                !currentCardData ? holderName.trim() : undefined,
                !currentCardData ? newCardPasscode : undefined
            );

            if (result.success) {
                Alert.alert(
                    '✅ Success',
                    `Card ${!currentCardData ? 'registered and ' : ''}topped up!\nNew Balance: $${result.card.balance.toFixed(2)}`
                );
                setAmount('');
                setSelectedQuickAmount(null);
                setHolderName('');
                setNewCardPasscode('');
            } else {
                Alert.alert('Error', result.error || 'Top-up failed');
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = () => {
        if (!cardActive) return colors.textMuted;
        if (currentCardData) return colors.success;
        return colors.warning;
    };

    const getStatusText = () => {
        if (!cardActive) return 'Scan an RFID card to begin...';
        if (currentCardData) return 'Active';
        return 'New Card - Enter Name & Passcode';
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
                style={[styles.container, { paddingTop: insets.top }]}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}>
                {/* Section Header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>💳 Top Up Card</Text>
                    <Text style={styles.sectionSubtitle}>
                        Scan your RFID card and add funds to your balance
                    </Text>
                </View>

                {/* Card Visual */}
                <GlassCard title="Active Card">
                    <CardVisual
                        uid={lastScannedUid}
                        holderName={holderNameFromCard || holderName || 'NO CARD'}
                        balance={displayBalance}
                        isActive={cardActive}
                        opacity={cardPresent ? 1 : graceTimeRemaining > 0 ? 0.7 : 0.4}
                    />

                    {/* Status Info */}
                    {cardActive && currentCardData && (
                        <View style={styles.statusSection}>
                            <View style={styles.dataRow}>
                                <Text style={styles.dataLabel}>UID</Text>
                                <Text style={styles.dataValue}>{currentCardData.uid}</Text>
                            </View>
                            <View style={styles.dataRow}>
                                <Text style={styles.dataLabel}>Holder</Text>
                                <Text style={styles.dataValue}>{currentCardData.holderName}</Text>
                            </View>
                            <View style={styles.dataRow}>
                                <Text style={styles.dataLabel}>Balance</Text>
                                <Text style={[styles.dataValue, { color: colors.primary }]}>
                                    ${currentCardData.balance.toFixed(2)}
                                </Text>
                            </View>
                            <View style={styles.dataRow}>
                                <Text style={styles.dataLabel}>Status</Text>
                                <Text style={[styles.dataValue, { color: getStatusColor() }]}>
                                    {getStatusText()}
                                </Text>
                            </View>
                            <View style={styles.dataRow}>
                                <Text style={styles.dataLabel}>Passcode</Text>
                                <Text
                                    style={[
                                        styles.dataValue,
                                        { color: currentCardData.passcodeSet ? colors.success : colors.warning },
                                    ]}>
                                    {currentCardData.passcodeSet ? '🔒 Protected' : '⚠️ Not Set'}
                                </Text>
                            </View>
                        </View>
                    )}

                    {!cardActive && (
                        <View style={styles.placeholder}>
                            <Text style={styles.placeholderText}>Scan an RFID card to begin...</Text>
                        </View>
                    )}

                    {cardActive && !currentCardData && (
                        <View style={styles.newCardStatus}>
                            <View style={styles.dataRow}>
                                <Text style={styles.dataLabel}>UID</Text>
                                <Text style={styles.dataValue}>{lastScannedUid}</Text>
                            </View>
                            <View style={styles.dataRow}>
                                <Text style={styles.dataLabel}>Status</Text>
                                <Text style={[styles.dataValue, { color: colors.warning }]}>
                                    New Card - Enter Name & Passcode
                                </Text>
                            </View>
                        </View>
                    )}
                </GlassCard>

                {/* Top Up Form */}
                <GlassCard title="Add Funds" style={{ marginTop: spacing.lg }}>
                    {/* Card UID */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Card UID</Text>
                        <View style={styles.inputDisabled}>
                            <Text style={styles.inputDisabledText}>
                                {lastScannedUid || 'UID auto-populated on scan'}
                            </Text>
                        </View>
                    </View>

                    {/* Holder Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Card Holder Name</Text>
                        <TextInput
                            style={styles.input}
                            value={currentCardData ? holderNameFromCard : holderName}
                            onChangeText={setHolderName}
                            placeholder="Enter name for new cards"
                            placeholderTextColor={colors.textMuted}
                            editable={!currentCardData}
                        />
                    </View>

                    {/* New Card Passcode */}
                    {cardActive && !currentCardData && (
                        <PasscodeInput
                            label="🔒 Set Passcode (New Card)"
                            hint="Create a 6-digit passcode to secure your card"
                            onComplete={code => {
                                setNewCardPasscode(code);
                                setPasscodeError(null);
                            }}
                            error={passcodeError}
                        />
                    )}

                    {/* Quick Amounts */}
                    <View style={styles.quickAmounts}>
                        {QUICK_AMOUNTS.map(amt => (
                            <Pressable
                                key={amt}
                                style={[
                                    styles.quickAmountBtn,
                                    selectedQuickAmount === amt && styles.quickAmountActive,
                                ]}
                                onPress={() => handleQuickAmount(amt)}>
                                <Text
                                    style={[
                                        styles.quickAmountText,
                                        selectedQuickAmount === amt && styles.quickAmountTextActive,
                                    ]}>
                                    ${amt}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Custom Amount */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Custom Amount ($)</Text>
                        <TextInput
                            style={styles.input}
                            value={amount}
                            onChangeText={text => {
                                setAmount(text);
                                setSelectedQuickAmount(null);
                            }}
                            placeholder="0.00"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="decimal-pad"
                        />
                    </View>

                    {/* Top Up Button */}
                    <Pressable
                        style={[styles.topupBtn, (!cardActive || loading) && styles.btnDisabled]}
                        onPress={handleTopUp}
                        disabled={!cardActive || loading}>
                        <LinearGradient
                            colors={
                                cardActive && !loading
                                    ? [colors.primary, '#818cf8']
                                    : ['#333', '#444']
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.btnGradient}>
                            <Text style={styles.btnText}>
                                {loading ? '⏳ Processing...' : '💳 Confirm Top Up'}
                            </Text>
                        </LinearGradient>
                    </Pressable>

                    {/* Set Passcode Button (for existing cards without passcode) */}
                    {currentCardData && !currentCardData.passcodeSet && (
                        <Pressable
                            style={styles.setPasscodeBtn}
                            onPress={async () => {
                                // We'll prompt with an alert for simplicity
                                Alert.prompt?.(
                                    'Set Passcode',
                                    'Enter a 6-digit passcode',
                                    async (code: string) => {
                                        if (code?.length === 6 && /^\d{6}$/.test(code)) {
                                            const result = await setPasscode(lastScannedUid!, code);
                                            if (result.success) {
                                                Alert.alert('Success', '✅ Passcode set successfully!');
                                            } else {
                                                Alert.alert('Error', result.error);
                                            }
                                        } else {
                                            Alert.alert('Error', 'Passcode must be exactly 6 digits');
                                        }
                                    },
                                    'secure-text'
                                );
                            }}>
                            <Text style={styles.setPasscodeBtnText}>🔒 Set Passcode</Text>
                        </Pressable>
                    )}
                </GlassCard>

                <View style={{ height: 100 }} />
            </ScrollView>
        </KeyboardAvoidingView>
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
    statusSection: {
        gap: spacing.xs,
    },
    dataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.glassBorder,
    },
    dataLabel: {
        fontSize: fontSize.md,
        color: colors.textMuted,
    },
    dataValue: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: colors.textMain,
    },
    placeholder: {
        paddingVertical: spacing.xxl,
        alignItems: 'center',
    },
    placeholderText: {
        color: colors.textMuted,
        fontStyle: 'italic',
    },
    newCardStatus: {
        gap: spacing.xs,
    },
    inputGroup: {
        marginBottom: spacing.lg,
    },
    inputLabel: {
        fontSize: fontSize.md,
        color: colors.textMuted,
        marginBottom: spacing.sm,
    },
    input: {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        color: colors.textMain,
        fontSize: fontSize.lg,
    },
    inputDisabled: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
    },
    inputDisabledText: {
        color: colors.textMuted,
        fontSize: fontSize.lg,
    },
    quickAmounts: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    quickAmountBtn: {
        flex: 1,
        backgroundColor: colors.primaryLight,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: borderRadius.sm,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    quickAmountActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    quickAmountText: {
        color: colors.primary,
        fontWeight: '600',
        fontSize: fontSize.lg,
    },
    quickAmountTextActive: {
        color: '#fff',
    },
    topupBtn: {
        borderRadius: borderRadius.md,
        overflow: 'hidden',
    },
    btnDisabled: {
        opacity: 0.5,
    },
    btnGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        borderRadius: borderRadius.md,
    },
    btnText: {
        color: '#fff',
        fontSize: fontSize.lg,
        fontWeight: '700',
    },
    setPasscodeBtn: {
        marginTop: spacing.md,
        paddingVertical: 14,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.warning,
        alignItems: 'center',
    },
    setPasscodeBtnText: {
        color: colors.warning,
        fontSize: fontSize.lg,
        fontWeight: '600',
    },
});
