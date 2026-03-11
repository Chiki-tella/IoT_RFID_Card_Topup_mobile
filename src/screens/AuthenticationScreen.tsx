import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, borderRadius, spacing, fontSize } from '../theme';
import { useApp } from '../context/AppContext';
import { setAuthToken } from '../context/AppContext';
import { BACKEND_URL } from '../config';

interface AuthenticationScreenProps {
    role: 'admin' | 'user';
    onAuthSuccess: () => void;
    onBack: () => void;
}

export function AuthenticationScreen({ role, onAuthSuccess, onBack }: AuthenticationScreenProps) {
    const insets = useSafeAreaInsets();
    const { logout } = useApp();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleAuthenticate = async () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter username and password');
            return;
        }

        setLoading(true);
        try {
            console.log('Attempting login with:', { username, role, backendUrl: BACKEND_URL });
            
            // Create abort controller for timeout (30 seconds for cloud database)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            const response = await fetch(`${BACKEND_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            // Check if login was successful
            if (response.ok && data.success && data.token) {
                // Verify role matches
                if (data.user.role === role) {
                    // Store token for API calls
                    setAuthToken(data.token);
                    console.log('Authentication successful for:', username);
                    Alert.alert('Success', `Welcome ${username}!`);
                    setUsername('');
                    setPassword('');
                    onAuthSuccess();
                } else {
                    // Role mismatch
                    Alert.alert('Error', `This account is for ${data.user.role} role, not ${role}`);
                    setPassword('');
                }
            } else if (response.ok && data.success) {
                // Token missing
                Alert.alert('Error', 'Authentication failed: No token received');
                setPassword('');
            } else {
                // Login failed
                const errorMsg = data.error || 'Authentication failed';
                Alert.alert('Error', errorMsg);
                setPassword('');
            }
        } catch (error) {
            console.error('Auth error:', error);
            if (error instanceof Error && error.name === 'AbortError') {
                Alert.alert('Error', 'Request timeout. Please check your connection and try again.');
            } else {
                Alert.alert('Error', 'Failed to connect to server. Please check your connection and try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        setUsername('');
        setPassword('');
        setShowPassword(false);
        logout();
        onBack();
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LinearGradient
                colors={['rgba(0, 0, 0, 0.05)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.roleIcon}>{role === 'admin' ? '👨‍💼' : '👤'}</Text>
                    <Text style={styles.title}>Authentication</Text>
                    <Text style={styles.subtitle}>
                        {role === 'admin' ? 'Administrator' : 'User'} Login
                    </Text>
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Username</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your username"
                            placeholderTextColor={colors.textMuted}
                            value={username}
                            onChangeText={setUsername}
                            editable={!loading}
                            autoCapitalize="none"
                        />
                    </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.passwordInputWrapper}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Enter your password"
                            placeholderTextColor={colors.textMuted}
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                            editable={!loading}
                        />
                        <TouchableOpacity
                            style={styles.togglePasswordBtn}
                            onPress={() => setShowPassword(!showPassword)}
                            disabled={loading}>
                            <Text style={styles.togglePasswordIcon}>
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.hint}>
                        {role === 'admin' 
                          ? 'Demo: admin / admin123 or manager / manager123' 
                          : 'Demo: user / user123 or operator / operator123'}
                    </Text>
                </View>

                {/* Authenticate Button */}
                <TouchableOpacity
                    style={[styles.authBtn, loading && styles.authBtnDisabled]}
                    onPress={handleAuthenticate}
                    disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color={colors.bgDark} size="small" />
                    ) : (
                        <Text style={styles.authBtnText}>🔓 Authenticate</Text>
                    )}
                </TouchableOpacity>

                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={handleBack}
                    disabled={loading}>
                    <Text style={styles.backBtnText}>← Back to Role Selection</Text>
                </TouchableOpacity>

                {/* Info Box */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>ℹ️ Demo Credentials</Text>
                    <Text style={styles.infoText}>
                        {role === 'admin'
                            ? 'Admin Password: admin123'
                            : 'User Password: user123'}
                    </Text>
                </View>
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
    content: {
        width: '100%',
        maxWidth: 400,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xxxl,
    },
    roleIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    title: {
        fontSize: fontSize.xxl,
        fontWeight: '700',
        color: colors.textMain,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: fontSize.md,
        color: colors.textMuted,
    },
    inputContainer: {
        marginBottom: spacing.xxl,
    },
    label: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: colors.textMain,
        marginBottom: spacing.sm,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        borderWidth: 2,
        borderColor: colors.glassBorder,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    input: {
        flex: 1,
        paddingVertical: spacing.md,
        fontSize: fontSize.md,
        color: colors.textMain,
    },
    passwordInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        borderWidth: 2,
        borderColor: colors.glassBorder,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    passwordInput: {
        flex: 1,
        paddingVertical: spacing.md,
        fontSize: fontSize.md,
        color: colors.textMain,
    },
    togglePasswordBtn: {
        padding: spacing.sm,
    },
    togglePasswordIcon: {
        fontSize: 18,
    },
    hint: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        fontStyle: 'italic',
    },
    authBtn: {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    authBtnDisabled: {
        opacity: 0.6,
    },
    authBtnText: {
        color: colors.bgDark,
        fontSize: fontSize.lg,
        fontWeight: '700',
    },
    backBtn: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        backgroundColor: colors.bgDarker,
        borderWidth: 2,
        borderColor: colors.glassBorder,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    backBtnText: {
        color: colors.textMain,
        fontSize: fontSize.md,
        fontWeight: '600',
    },
    infoBox: {
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
    },
    infoTitle: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: colors.textMain,
        marginBottom: spacing.sm,
    },
    infoText: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        lineHeight: 20,
    },
});
