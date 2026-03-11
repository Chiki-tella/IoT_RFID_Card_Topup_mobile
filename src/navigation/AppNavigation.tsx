import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors, fontSize, spacing } from '../theme';
import { useApp } from '../context/AppContext';
import { TopUpScreen } from '../screens/TopUpScreen';
import { MarketplaceScreen } from '../screens/MarketplaceScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const DarkTheme = {
    ...DefaultTheme,
    dark: true,
    colors: {
        ...DefaultTheme.colors,
        primary: colors.primary,
        background: colors.bgDark,
        card: colors.bgDarker,
        text: colors.textMain,
        border: colors.glassBorder,
        notification: colors.danger,
    },
};

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
    return (
        <View style={styles.tabIconContainer}>
            <Text style={styles.tabIcon}>{icon}</Text>
            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
        </View>
    );
}

function HeaderLogoutButton({ logout }: { logout: () => void }) {
    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', onPress: () => {}, style: 'cancel' },
            {
                text: 'Logout',
                onPress: () => {
                    logout();
                },
                style: 'destructive',
            },
        ]);
    };

    return (
        <TouchableOpacity style={styles.logoutHeaderBtn} onPress={handleLogout}>
            <Text style={styles.logoutHeaderBtnText}>🚪</Text>
        </TouchableOpacity>
    );
}

export function AppNavigation() {
    const { userRole, isConnected, logout } = useApp();

    return (
        <NavigationContainer theme={DarkTheme}>
            <Tab.Navigator
                screenOptions={{
                    headerShown: true,
                    headerStyle: styles.header,
                    headerTitleStyle: styles.headerTitle,
                    headerRight: () => <HeaderLogoutButton logout={logout} />,
                    headerRightContainerStyle: styles.headerRightContainer,
                    tabBarStyle: styles.tabBar,
                    tabBarShowLabel: false,
                    tabBarActiveTintColor: colors.primary,
                    tabBarInactiveTintColor: colors.textMuted,
                }}>
                <Tab.Screen
                    name="TopUp"
                    component={TopUpScreen}
                    options={{
                        headerTitle: '💳 Top Up',
                        tabBarIcon: ({ focused }) => (
                            <TabIcon icon="💳" label="Top Up" focused={focused} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Marketplace"
                    component={MarketplaceScreen}
                    options={{
                        headerTitle: '🛒 Marketplace',
                        tabBarIcon: ({ focused }) => (
                            <TabIcon icon="🛒" label="Shop" focused={focused} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Transactions"
                    component={TransactionsScreen}
                    options={{
                        headerTitle: '📊 Transactions',
                        tabBarIcon: ({ focused }) => (
                            <TabIcon icon="📊" label="History" focused={focused} />
                        ),
                    }}
                />
                {userRole === 'admin' && (
                    <Tab.Screen
                        name="Settings"
                        component={SettingsScreen}
                        options={{
                            headerTitle: '⚙️ Settings',
                            tabBarIcon: ({ focused }) => (
                                <TabIcon icon="⚙️" label="Settings" focused={focused} />
                            ),
                        }}
                    />
                )}
            </Tab.Navigator>

            {/* Connection indicator */}
            <View style={[styles.connectionDot, isConnected && styles.connectionDotOnline]} />
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: colors.bgDark,
        borderBottomWidth: 1,
        borderBottomColor: colors.glassBorder,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerTitle: {
        fontSize: fontSize.lg,
        fontWeight: '700',
        color: colors.textMain,
    },
    headerRightContainer: {
        paddingRight: spacing.md,
    },
    logoutHeaderBtn: {
        padding: spacing.sm,
        borderRadius: spacing.md,
        backgroundColor: colors.danger,
        justifyContent: 'center',
        alignItems: 'center',
        width: 40,
        height: 40,
    },
    logoutHeaderBtnText: {
        fontSize: 20,
    },
    tabBar: {
        backgroundColor: colors.bgDarker,
        borderTopWidth: 1,
        borderTopColor: colors.glassBorder,
        height: 80,
        paddingBottom: spacing.md,
        paddingTop: spacing.sm,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    tabIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    tabIcon: {
        fontSize: 22,
    },
    tabLabel: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        fontWeight: '500',
    },
    tabLabelActive: {
        color: colors.primary,
        fontWeight: '700',
    },
    connectionDot: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.textMuted,
        zIndex: 999,
    },
    connectionDotOnline: {
        backgroundColor: colors.success,
    },
});
