import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AuthProvider, useAuth } from '../context/AuthContext';

function RootNavigator() {
  const { user, isLoading } = useAuth();

  // Aguarda o Firebase restaurar a sessão antes de montar as telas.
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#D35400" />
        <Text style={styles.loadingText}>Carregando sessão...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="home" />
        <Stack.Screen name="produtos" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  loadingText: { marginTop: 12, color: '#666666' },
});
