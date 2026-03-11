import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    FlatList,
    Alert,
    Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, spacing, fontSize } from '../theme';
import { useApp, Product } from '../context/AppContext';
import { GlassCard } from '../components/GlassCard';
import { PasscodeInput } from '../components/PasscodeInput';

const CATEGORIES = [
    { key: 'all', label: 'All' },
    { key: 'food', label: 'Food' },
    { key: 'rwandan', label: '🇷🇼 Rwandan' },
    { key: 'drinks', label: 'Drinks' },
    { key: 'domains', label: 'Domains' },
    { key: 'services', label: 'Services' },
];

export function MarketplaceScreen() {
    const insets = useSafeAreaInsets();
    const {
        products,
        cart,
        selectedCategory,
        setSelectedCategory,
        addToCart,
        removeFromCart,
        changeQty,
        getCartTotal,
        getCartItemCount,
        lastScannedUid,
        currentCardData,
        isPaymentAllowed,
        checkout,
        graceTimeRemaining,
        cardPresent,
    } = useApp();

    const [loading, setLoading] = useState(false);
    const [paymentMsg, setPaymentMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(
        null
    );
    const [showPasscodeModal, setShowPasscodeModal] = useState(false);
    const [passcodeError, setPasscodeError] = useState<string | null>(null);

    const filteredProducts =
        selectedCategory === 'all'
            ? products
            : products.filter(p => p.category === selectedCategory);

    const cartTotal = getCartTotal();
    const cartCount = getCartItemCount();

    const getCategoryBadge = (product: Product) => {
        if (product.category === 'domains') return { text: 'Domain', color: '#3b82f6' };
        if (product.category === 'services') return { text: 'Service', color: '#8b5cf6' };
        if (product.category === 'rwandan') return { text: '🇷🇼 Local', color: '#f59e0b' };
        return null;
    };

    const handleCheckout = async (passcode?: string) => {
        if (!lastScannedUid || cart.length === 0) return;

        if (!isPaymentAllowed()) {
            setPaymentMsg({
                text: '⚠️ Grace period expired! Place card on reader.',
                type: 'error',
            });
            return;
        }

        if (currentCardData && currentCardData.balance < cartTotal) {
            setPaymentMsg({
                text: `Insufficient balance! Need $${cartTotal.toFixed(2)}, have $${currentCardData.balance.toFixed(2)}`,
                type: 'error',
            });
            return;
        }

        // Check if passcode is required
        if (currentCardData?.passcodeSet && !passcode) {
            setShowPasscodeModal(true);
            return;
        }

        setLoading(true);
        setShowPasscodeModal(false);

        const descriptions = cart.map(item =>
            item.qty > 1 ? `${item.product.name} x${item.qty}` : item.product.name
        );
        const description = `Purchase: ${descriptions.join(', ')}`;

        try {
            const result = await checkout(lastScannedUid, cartTotal, description, passcode);
            if (result.success) {
                setPaymentMsg({
                    text: `✅ Payment of $${result.transaction.amount.toFixed(2)} successful! Balance: $${result.card.balance.toFixed(2)}`,
                    type: 'success',
                });
            } else {
                setPaymentMsg({
                    text: `❌ ${result.error}`,
                    type: 'error',
                });
            }
        } catch (err) {
            setPaymentMsg({
                text: '❌ Checkout failed. Could not connect to server.',
                type: 'error',
            });
        } finally {
            setLoading(false);
            setTimeout(() => setPaymentMsg(null), 6000);
        }
    };

    const getCheckoutHint = () => {
        if (!lastScannedUid) return 'Scan your RFID card first to enable checkout';
        if (!isPaymentAllowed()) return '⚠️ Grace period expired! Place card on reader';
        if (!cardPresent && graceTimeRemaining > 0)
            return `⏱️ Card removed - ${graceTimeRemaining}s remaining`;
        if (cart.length === 0) return 'Add products to your cart to proceed';
        return null;
    };

    const checkoutHint = getCheckoutHint();
    const canCheckout = !!lastScannedUid && cart.length > 0 && isPaymentAllowed() && !loading;

    const renderProduct = ({ item: product }: { item: Product }) => {
        const inCart = cart.find(c => c.product.id === product.id);
        const badge = getCategoryBadge(product);

        return (
            <Pressable
                style={[styles.productCard, inCart && styles.productInCart]}
                onPress={() => addToCart(product)}>
                {badge && (
                    <View style={[styles.productBadge, { backgroundColor: badge.color + '22' }]}>
                        <Text style={[styles.productBadgeText, { color: badge.color }]}>{badge.text}</Text>
                    </View>
                )}
                <Text style={styles.productIcon}>{product.icon}</Text>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
                <Text style={styles.productHint}>
                    {inCart ? `${inCart.qty} in cart` : 'Tap to add'}
                </Text>
            </Pressable>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.sectionHeader}>
                    <View style={styles.headerRow}>
                        <Text style={styles.sectionTitle}>🛒 Marketplace</Text>
                        {cartCount > 0 && (
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>{cartCount}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.sectionSubtitle}>
                        Browse products and pay with your RFID card
                    </Text>
                </View>

                {/* Category Filter */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryRow}
                    style={styles.categoryScroll}>
                    {CATEGORIES.map(cat => (
                        <Pressable
                            key={cat.key}
                            style={[
                                styles.categoryBtn,
                                selectedCategory === cat.key && styles.categoryActive,
                            ]}
                            onPress={() => setSelectedCategory(cat.key)}>
                            <Text
                                style={[
                                    styles.categoryText,
                                    selectedCategory === cat.key && styles.categoryTextActive,
                                ]}>
                                {cat.label}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>

                {/* Products Grid */}
                <View style={styles.productGrid}>
                    {filteredProducts.length === 0 ? (
                        <View style={styles.emptyProducts}>
                            <Text style={styles.emptyText}>No products in this category</Text>
                        </View>
                    ) : (
                        filteredProducts.map(product => (
                            <View key={product.id} style={styles.productGridItem}>
                                {renderProduct({ item: product })}
                            </View>
                        ))
                    )}
                </View>

                {/* Shopping Cart */}
                <GlassCard title="🛍️ Shopping Cart" style={{ marginTop: spacing.xl }}>
                    {cart.length === 0 ? (
                        <View style={styles.cartEmpty}>
                            <Text style={styles.cartEmptyIcon}>🛒</Text>
                            <Text style={styles.cartEmptyText}>Your cart is empty</Text>
                            <Text style={styles.cartEmptyHint}>Tap products to add them</Text>
                        </View>
                    ) : (
                        <>
                            {cart.map(item => (
                                <View key={item.product.id} style={styles.cartItem}>
                                    <Text style={styles.cartItemIcon}>{item.product.icon}</Text>
                                    <View style={styles.cartItemInfo}>
                                        <Text style={styles.cartItemName}>{item.product.name}</Text>
                                        <Text style={styles.cartItemPrice}>
                                            ${item.product.price.toFixed(2)} each
                                        </Text>
                                    </View>
                                    <View style={styles.cartItemControls}>
                                        <Pressable
                                            style={styles.qtyBtn}
                                            onPress={() => changeQty(item.product.id, -1)}>
                                            <Text style={styles.qtyBtnText}>−</Text>
                                        </Pressable>
                                        <Text style={styles.cartItemQty}>{item.qty}</Text>
                                        <Pressable
                                            style={styles.qtyBtn}
                                            onPress={() => changeQty(item.product.id, 1)}>
                                            <Text style={styles.qtyBtnText}>+</Text>
                                        </Pressable>
                                    </View>
                                    <Text style={styles.cartItemTotal}>
                                        ${(item.product.price * item.qty).toFixed(2)}
                                    </Text>
                                    <Pressable onPress={() => removeFromCart(item.product.id)}>
                                        <Text style={styles.cartRemove}>✕</Text>
                                    </Pressable>
                                </View>
                            ))}

                            {/* Cart Summary */}
                            <View style={styles.cartSummary}>
                                <View style={styles.cartSummaryRow}>
                                    <Text style={styles.cartSummaryLabel}>Items</Text>
                                    <Text style={styles.cartSummaryValue}>{cartCount}</Text>
                                </View>
                                <View style={[styles.cartSummaryRow, styles.cartTotalRow]}>
                                    <Text style={styles.cartTotalLabel}>Total</Text>
                                    <Text style={styles.cartTotalValue}>${cartTotal.toFixed(2)}</Text>
                                </View>
                            </View>
                        </>
                    )}

                    {/* Payment Status */}
                    {paymentMsg && (
                        <View
                            style={[
                                styles.paymentMsg,
                                paymentMsg.type === 'success' ? styles.paymentSuccess : styles.paymentError,
                            ]}>
                            <Text style={styles.paymentMsgText}>{paymentMsg.text}</Text>
                        </View>
                    )}

                    {/* Checkout Hint */}
                    {checkoutHint && <Text style={styles.checkoutHint}>{checkoutHint}</Text>}

                    {/* Checkout Button */}
                    <Pressable
                        style={[styles.checkoutBtn, !canCheckout && styles.btnDisabled]}
                        onPress={() => handleCheckout()}
                        disabled={!canCheckout}>
                        <LinearGradient
                            colors={
                                canCheckout
                                    ? [colors.checkoutGreen, colors.checkoutGreenHover]
                                    : ['#333', '#444']
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.btnGradient}>
                            <Text style={styles.btnText}>
                                {loading ? '⏳ Processing...' : '💳 Checkout & Pay'}
                            </Text>
                        </LinearGradient>
                    </Pressable>
                </GlassCard>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Passcode Modal */}
            <Modal
                visible={showPasscodeModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowPasscodeModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Enter Passcode</Text>
                            <Pressable onPress={() => setShowPasscodeModal(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </Pressable>
                        </View>
                        <Text style={styles.modalMessage}>
                            Enter your 6-digit passcode to authorize this payment
                        </Text>
                        <PasscodeInput
                            onComplete={code => {
                                setPasscodeError(null);
                                handleCheckout(code);
                            }}
                            error={passcodeError}
                        />
                        <View style={styles.modalFooter}>
                            <Pressable
                                style={styles.modalCancelBtn}
                                onPress={() => setShowPasscodeModal(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
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
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
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
    cartBadge: {
        backgroundColor: colors.danger,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cartBadgeText: {
        color: '#fff',
        fontSize: fontSize.sm,
        fontWeight: '700',
    },
    categoryScroll: {
        marginBottom: spacing.xl,
    },
    categoryRow: {
        gap: spacing.sm,
        paddingRight: spacing.xl,
    },
    categoryBtn: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.xl,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    categoryActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    categoryText: {
        color: colors.textMuted,
        fontWeight: '500',
        fontSize: fontSize.md,
    },
    categoryTextActive: {
        color: '#fff',
    },
    productGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    productGridItem: {
        width: '48%',
    },
    productCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        alignItems: 'center',
    },
    productInCart: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
    },
    productBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        marginBottom: spacing.sm,
    },
    productBadgeText: {
        fontSize: fontSize.xs,
        fontWeight: '600',
    },
    productIcon: {
        fontSize: 36,
        marginBottom: spacing.sm,
    },
    productName: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: colors.textMain,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    productPrice: {
        fontSize: fontSize.lg,
        fontWeight: '700',
        color: colors.primary,
        marginBottom: spacing.xs,
    },
    productHint: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
    },
    cartEmpty: {
        alignItems: 'center',
        paddingVertical: spacing.xxl,
    },
    cartEmptyIcon: {
        fontSize: 40,
        marginBottom: spacing.md,
    },
    cartEmptyText: {
        fontSize: fontSize.lg,
        color: colors.textMuted,
        marginBottom: spacing.xs,
    },
    cartEmptyHint: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
    },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.glassBorder,
        gap: spacing.sm,
    },
    cartItemIcon: {
        fontSize: 24,
    },
    cartItemInfo: {
        flex: 1,
    },
    cartItemName: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: colors.textMain,
    },
    cartItemPrice: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
    },
    cartItemControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    qtyBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primaryLight,
        borderWidth: 1,
        borderColor: colors.primaryBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyBtnText: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: fontSize.lg,
    },
    cartItemQty: {
        fontSize: fontSize.md,
        fontWeight: '700',
        color: colors.textMain,
        minWidth: 20,
        textAlign: 'center',
    },
    cartItemTotal: {
        fontSize: fontSize.md,
        fontWeight: '700',
        color: colors.textMain,
    },
    cartRemove: {
        fontSize: fontSize.lg,
        color: colors.danger,
        paddingLeft: spacing.sm,
    },
    cartSummary: {
        marginTop: spacing.lg,
        paddingTop: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.glassBorder,
    },
    cartSummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    cartSummaryLabel: {
        fontSize: fontSize.md,
        color: colors.textMuted,
    },
    cartSummaryValue: {
        fontSize: fontSize.md,
        color: colors.textMain,
        fontWeight: '600',
    },
    cartTotalRow: {
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.glassBorder,
    },
    cartTotalLabel: {
        fontSize: fontSize.xl,
        fontWeight: '700',
        color: colors.textMain,
    },
    cartTotalValue: {
        fontSize: fontSize.xl,
        fontWeight: '700',
        color: colors.primary,
    },
    paymentMsg: {
        marginTop: spacing.lg,
        padding: spacing.lg,
        borderRadius: borderRadius.md,
    },
    paymentSuccess: {
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(74, 222, 128, 0.3)',
    },
    paymentError: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    paymentMsgText: {
        fontSize: fontSize.md,
        color: colors.textMain,
        textAlign: 'center',
    },
    checkoutHint: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: spacing.md,
    },
    checkoutBtn: {
        marginTop: spacing.lg,
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
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    modalContent: {
        width: '100%',
        backgroundColor: colors.bgDarker,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: borderRadius.xxl,
        padding: spacing.xxl,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        fontSize: fontSize.xxl,
        fontWeight: '700',
        color: colors.textMain,
    },
    modalClose: {
        fontSize: fontSize.xxl,
        color: colors.textMuted,
        padding: spacing.sm,
    },
    modalMessage: {
        fontSize: fontSize.md,
        color: colors.textMuted,
        marginBottom: spacing.lg,
    },
    modalFooter: {
        marginTop: spacing.lg,
        alignItems: 'center',
    },
    modalCancelBtn: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xxl,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    modalCancelText: {
        color: colors.textMuted,
        fontSize: fontSize.lg,
        fontWeight: '500',
    },
});
