import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from '../config';

// Types
export interface CardData {
    uid: string;
    holderName: string;
    balance: number;
    passcodeSet: boolean;
}

export interface Product {
    id: string;
    name: string;
    price: number;
    icon: string;
    category: string;
}

export interface CartItem {
    product: Product;
    qty: number;
}

export interface Transaction {
    _id: string;
    uid: string;
    type: 'topup' | 'debit';
    amount: number;
    balanceAfter: number;
    description: string;
    holderName: string;
    timestamp: string;
}

interface AppState {
    // Connection
    isConnected: boolean;
    mqttStatus: boolean;
    backendStatus: boolean;
    dbStatus: boolean;

    // Card
    lastScannedUid: string | null;
    currentCardData: CardData | null;
    cardPresent: boolean;
    isNewCard: boolean;

    // Marketplace
    products: Product[];
    cart: CartItem[];
    selectedCategory: string;

    // Stats
    totalCards: number;
    todayTransactions: number;
    totalVolume: number;
    totalPayments: number;
    totalTransactions: number;
    netBalance: number;

    // Transactions
    topupHistory: Transaction[];
    purchaseHistory: Transaction[];

    // Role
    userRole: 'admin' | 'user' | null;

    // Grace period
    graceTimeRemaining: number;
}

interface AppContextType extends AppState {
    // Actions
    setUserRole: (role: 'admin' | 'user') => void;
    logout: () => void;
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    changeQty: (productId: string, delta: number) => void;
    clearCart: () => void;
    getCartTotal: () => number;
    getCartItemCount: () => number;
    setSelectedCategory: (category: string) => void;
    topUp: (uid: string, amount: number, holderName?: string, passcode?: string) => Promise<any>;
    checkout: (uid: string, total: number, description: string, passcode?: string) => Promise<any>;
    setPasscode: (uid: string, passcode: string) => Promise<any>;
    isPaymentAllowed: () => boolean;
    refreshStats: () => Promise<void>;
    refreshHistory: () => Promise<void>;
    refreshProducts: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const GRACE_PERIOD = 15000;
const NEW_CARD_GRACE_PERIOD = 60000;

export function AppProvider({ children }: { children: React.ReactNode }) {
    const socketRef = useRef<Socket | null>(null);
    const [state, setState] = useState<AppState>({
        isConnected: false,
        mqttStatus: false,
        backendStatus: false,
        dbStatus: false,
        lastScannedUid: null,
        currentCardData: null,
        cardPresent: false,
        isNewCard: false,
        products: [],
        cart: [],
        selectedCategory: 'all',
        totalCards: 0,
        todayTransactions: 0,
        totalVolume: 0,
        totalPayments: 0,
        totalTransactions: 0,
        netBalance: 0,
        topupHistory: [],
        purchaseHistory: [],
        userRole: null,
        graceTimeRemaining: 0,
    });

    const cardScanTimeRef = useRef<number | null>(null);
    const isNewCardRef = useRef(false);
    const graceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Keep refs in sync
    useEffect(() => {
        isNewCardRef.current = state.isNewCard;
    }, [state.isNewCard]);

    const isPaymentAllowed = useCallback(() => {
        if (state.cardPresent) return true;
        if (!cardScanTimeRef.current) return false;
        const timeSinceScan = Date.now() - cardScanTimeRef.current;
        const gracePeriod = isNewCardRef.current ? NEW_CARD_GRACE_PERIOD : GRACE_PERIOD;
        return timeSinceScan < gracePeriod;
    }, [state.cardPresent]);

    // Load products
    const refreshProducts = useCallback(async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/products`);
            if (res.ok) {
                const data = await res.json();
                setState(s => ({ ...s, products: data }));
            }
        } catch (err) {
            console.error('Failed to load products:', err);
            // Fallback products
            setState(s => ({
                ...s,
                products: [
                    { id: 'coffee', name: 'Coffee', price: 2.5, icon: '☕', category: 'food' },
                    { id: 'sandwich', name: 'Sandwich', price: 5.0, icon: '🥪', category: 'food' },
                    { id: 'water', name: 'Water Bottle', price: 1.0, icon: '💧', category: 'food' },
                    { id: 'brochette', name: 'Brochette', price: 4.0, icon: '串', category: 'rwandan' },
                    { id: 'isombe', name: 'Isombe', price: 3.5, icon: '🥬', category: 'rwandan' },
                    { id: 'domain-com', name: '.com Domain', price: 12.0, icon: '🌐', category: 'domains' },
                    { id: 'domain-io', name: '.io Domain', price: 35.0, icon: '🌐', category: 'domains' },
                ],
            }));
        }
    }, []);

    // Load stats
    const refreshStats = useCallback(async () => {
        try {
            const cardsRes = await fetch(`${BACKEND_URL}/cards`);
            if (cardsRes.ok) {
                const cards = await cardsRes.json();
                const netBal = cards.reduce((sum: number, c: any) => sum + c.balance, 0);
                setState(s => ({
                    ...s,
                    totalCards: cards.length,
                    netBalance: netBal,
                    totalVolume: netBal,
                }));
            }

            const txRes = await fetch(`${BACKEND_URL}/transactions?limit=1000`);
            if (txRes.ok) {
                const transactions = await txRes.json();
                const today = new Date().toDateString();
                const todayTx = transactions.filter(
                    (tx: any) => new Date(tx.timestamp).toDateString() === today
                );
                const totalPay = transactions
                    .filter((tx: any) => tx.type === 'debit')
                    .reduce((sum: number, tx: any) => sum + tx.amount, 0);

                setState(s => ({
                    ...s,
                    todayTransactions: todayTx.length,
                    totalPayments: totalPay,
                    totalTransactions: transactions.length,
                }));
            }

            setState(s => ({ ...s, dbStatus: true }));
        } catch (err) {
            console.error('Failed to load stats:', err);
            setState(s => ({ ...s, dbStatus: false }));
        }
    }, []);

    // Load transaction history
    const refreshHistory = useCallback(async () => {
        try {
            let url = `${BACKEND_URL}/transactions?limit=100`;
            if (state.lastScannedUid) {
                url = `${BACKEND_URL}/transactions/${state.lastScannedUid}`;
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch');

            const transactions: Transaction[] = await res.json();
            const topups = transactions.filter(tx => tx.type === 'topup');
            const debits = transactions.filter(tx => tx.type === 'debit');

            setState(s => ({
                ...s,
                topupHistory: topups,
                purchaseHistory: debits,
                dbStatus: true,
            }));
        } catch (err) {
            console.error('Failed to load history:', err);
        }
    }, [state.lastScannedUid]);

    // Socket setup
    useEffect(() => {
        const socket = io(BACKEND_URL);
        socketRef.current = socket;

        socket.on('connect', () => {
            setState(s => ({
                ...s,
                isConnected: true,
                backendStatus: true,
                mqttStatus: true,
            }));
            refreshStats();
            refreshProducts();
            refreshHistory();
        });

        socket.on('disconnect', () => {
            setState(s => ({
                ...s,
                isConnected: false,
                backendStatus: false,
                mqttStatus: false,
            }));
        });

        socket.on('card-status', async (data: any) => {
            const uid = data.uid;
            const present = data.present !== false;
            cardScanTimeRef.current = Date.now();

            if (graceTimerRef.current) {
                clearInterval(graceTimerRef.current);
                graceTimerRef.current = null;
            }

            try {
                const res = await fetch(`${BACKEND_URL}/card/${uid}`);
                if (res.ok) {
                    const cardData: CardData = await res.json();
                    setState(s => ({
                        ...s,
                        lastScannedUid: uid,
                        currentCardData: cardData,
                        cardPresent: present,
                        isNewCard: false,
                        graceTimeRemaining: 0,
                    }));
                    isNewCardRef.current = false;
                } else {
                    setState(s => ({
                        ...s,
                        lastScannedUid: uid,
                        currentCardData: null,
                        cardPresent: present,
                        isNewCard: true,
                        graceTimeRemaining: 0,
                    }));
                    isNewCardRef.current = true;
                }
            } catch (err) {
                setState(s => ({
                    ...s,
                    lastScannedUid: uid,
                    currentCardData: null,
                    cardPresent: present,
                    isNewCard: true,
                    graceTimeRemaining: 0,
                }));
                isNewCardRef.current = true;
            }

            refreshHistory();
        });

        socket.on('card-balance', (data: any) => {
            setState(s => {
                if (data.uid === s.lastScannedUid && s.currentCardData) {
                    return {
                        ...s,
                        currentCardData: { ...s.currentCardData, balance: data.new_balance },
                    };
                }
                return s;
            });
        });

        socket.on('card-removed', (data: any) => {
            setState(s => {
                if (data.uid === s.lastScannedUid) {
                    return { ...s, cardPresent: false };
                }
                return s;
            });

            // Start grace period countdown
            const updateGrace = () => {
                if (!cardScanTimeRef.current) return;
                const elapsed = Date.now() - cardScanTimeRef.current;
                const gracePeriod = isNewCardRef.current ? NEW_CARD_GRACE_PERIOD : GRACE_PERIOD;
                const remaining = Math.max(0, Math.ceil((gracePeriod - elapsed) / 1000));
                setState(s => ({ ...s, graceTimeRemaining: remaining }));
                if (remaining <= 0 && graceTimerRef.current) {
                    clearInterval(graceTimerRef.current);
                    graceTimerRef.current = null;
                }
            };

            if (graceTimerRef.current) clearInterval(graceTimerRef.current);
            graceTimerRef.current = setInterval(updateGrace, 1000);
            updateGrace();
        });

        socket.on('payment-success', () => {
            refreshStats();
            refreshHistory();
        });

        return () => {
            socket.disconnect();
            if (graceTimerRef.current) clearInterval(graceTimerRef.current);
        };
    }, []);

    // Cart actions
    const addToCart = useCallback((product: Product) => {
        setState(s => {
            const existing = s.cart.find(item => item.product.id === product.id);
            if (existing) {
                return {
                    ...s,
                    cart: s.cart.map(item =>
                        item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
                    ),
                };
            }
            return { ...s, cart: [...s.cart, { product, qty: 1 }] };
        });
    }, []);

    const removeFromCart = useCallback((productId: string) => {
        setState(s => ({
            ...s,
            cart: s.cart.filter(item => item.product.id !== productId),
        }));
    }, []);

    const changeQty = useCallback((productId: string, delta: number) => {
        setState(s => {
            const item = s.cart.find(i => i.product.id === productId);
            if (!item) return s;
            const newQty = item.qty + delta;
            if (newQty <= 0) {
                return { ...s, cart: s.cart.filter(i => i.product.id !== productId) };
            }
            return {
                ...s,
                cart: s.cart.map(i => (i.product.id === productId ? { ...i, qty: newQty } : i)),
            };
        });
    }, []);

    const clearCart = useCallback(() => {
        setState(s => ({ ...s, cart: [] }));
    }, []);

    const getCartTotal = useCallback(() => {
        return state.cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
    }, [state.cart]);

    const getCartItemCount = useCallback(() => {
        return state.cart.reduce((sum, item) => sum + item.qty, 0);
    }, [state.cart]);

    const setSelectedCategory = useCallback((category: string) => {
        setState(s => ({ ...s, selectedCategory: category }));
    }, []);

    const setUserRole = useCallback((role: 'admin' | 'user') => {
        setState(s => ({ ...s, userRole: role }));
    }, []);

    const logout = useCallback(() => {
        setState(s => ({
            ...s,
            userRole: null,
            lastScannedUid: null,
            currentCardData: null,
            cardPresent: false,
            isNewCard: false,
            cart: [],
            graceTimeRemaining: 0,
        }));
        cardScanTimeRef.current = null;
        isNewCardRef.current = false;
        if (graceTimerRef.current) {
            clearInterval(graceTimerRef.current);
            graceTimerRef.current = null;
        }
    }, []);

    // API calls
    const topUp = useCallback(
        async (uid: string, amount: number, holderName?: string, passcode?: string) => {
            const body: any = { uid, amount };
            if (holderName) body.holderName = holderName;
            if (passcode) body.passcode = passcode;

            const res = await fetch(`${BACKEND_URL}/topup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const result = await res.json();
            if (result.success) {
                setState(s => ({
                    ...s,
                    currentCardData: result.card,
                    isNewCard: false,
                }));
                refreshStats();
                refreshHistory();
            }
            return result;
        },
        [refreshStats, refreshHistory]
    );

    const checkout = useCallback(
        async (uid: string, total: number, description: string, passcode?: string) => {
            const body: any = { uid, amount: total, description };
            if (passcode) body.passcode = passcode;

            const res = await fetch(`${BACKEND_URL}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const result = await res.json();
            if (result.success) {
                setState(s => ({
                    ...s,
                    currentCardData: result.card,
                    cart: [],
                }));
                refreshStats();
                refreshHistory();
            }
            return result;
        },
        [refreshStats, refreshHistory]
    );

    const setPasscode = useCallback(async (uid: string, passcode: string) => {
        const res = await fetch(`${BACKEND_URL}/card/${uid}/set-passcode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passcode }),
        });

        const result = await res.json();
        if (result.success) {
            setState(s => ({
                ...s,
                currentCardData: s.currentCardData ? { ...s.currentCardData, passcodeSet: true } : null,
            }));
        }
        return result;
    }, []);

    const value: AppContextType = {
        ...state,
        setUserRole,
        logout,
        addToCart,
        removeFromCart,
        changeQty,
        clearCart,
        getCartTotal,
        getCartItemCount,
        setSelectedCategory,
        topUp,
        checkout,
        setPasscode,
        isPaymentAllowed,
        refreshStats,
        refreshHistory,
        refreshProducts,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be inside AppProvider');
    return ctx;
}
