import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import { RoleSelectionScreen } from './src/screens/RoleSelectionScreen';
import { AuthenticationScreen } from './src/screens/AuthenticationScreen';
import { AppNavigation } from './src/navigation/AppNavigation';

function AppContent() {
  const { userRole, logout } = useApp();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!userRole) {
    return <RoleSelectionScreen />;
  }

  if (!isAuthenticated) {
    return (
      <AuthenticationScreen
        role={userRole}
        onAuthSuccess={() => {
          console.log('Authentication successful, navigating to app');
          setIsAuthenticated(true);
        }}
        onBack={() => {
          console.log('Going back to role selection');
          logout();
          setIsAuthenticated(false);
        }}
      />
    );
  }

  return <AppNavigation />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <AppContent />
      </AppProvider>
    </SafeAreaProvider>
  );
}
