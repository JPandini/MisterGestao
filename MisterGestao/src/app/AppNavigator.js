import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../services/firebase';
import { ProductsProvider } from '../context/ProductsContext';
import { CartProvider } from '../context/CartContext';
import FirebaseSetupScreen from '../components/FirebaseSetupScreen';
import LoginScreen from '../view/Login';
import MainTabsNavigator from './MainTabsNavigator';
import RegisterProductScreen from '../view/CadastroProduto';
import CartScreen from '../view/Carrinho';

const Stack = createNativeStackNavigator();

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#D35400" />
      <Text style={styles.loadingText}>Carregando sessão...</Text>
    </View>
  );
}

function AuthenticatedNavigator() {
  return (
    <ProductsProvider>
      <CartProvider>
        <Stack.Navigator id="AuthenticatedStack" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
          <Stack.Screen name="CadastroProduto" component={RegisterProductScreen} />
          <Stack.Screen name="Carrinho" component={CartScreen} />
        </Stack.Navigator>
      </CartProvider>
    </ProductsProvider>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (!isFirebaseConfigured) return <FirebaseSetupScreen />;
  if (isLoading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      {user ? (
        <AuthenticatedNavigator />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: { marginTop: 12, color: '#666666' },
});
