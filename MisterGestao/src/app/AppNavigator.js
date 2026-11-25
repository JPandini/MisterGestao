import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../services/firebase';
import { acompanharToquesPush, iniciarPushOrcamentos } from '../services/pushOrcamentos';
import { ProductsProvider } from '../context/ProductsContext';
import { CartProvider } from '../context/CartContext';
import { NotificacoesProvider } from '../context/NotificacoesContext';
import FirebaseSetupScreen from '../components/FirebaseSetupScreen';
import LoginScreen from '../view/Login';
import MainTabsNavigator from './MainTabsNavigator';
import RegisterProductScreen from '../view/CadastroProduto';
import CartScreen from '../view/Carrinho';
import Dashboard from '../view/Dashboard';
import CadastroNome from '../view/CadastroNome';
import OrcamentoScreen from '../view/Orcamento';
import CompartilharOrcamentoScreen from '../view/CompartilharOrcamento';
import NotificacoesScreen from '../view/Notificacoes';

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
          <Stack.Screen name="EditarProduto" component={RegisterProductScreen} />
          <Stack.Screen name="Carrinho" component={CartScreen} />
          <Stack.Screen name="Dashboard" component={Dashboard} />
          <Stack.Screen name="CadastroMarca" component={CadastroNome} />
          <Stack.Screen name="CadastroCategoria" component={CadastroNome} />
          <Stack.Screen name="Orcamento" component={OrcamentoScreen} />
          <Stack.Screen name="CompartilharOrcamento" component={CompartilharOrcamentoScreen} />
          <Stack.Screen name="Notificacoes" component={NotificacoesScreen} />
        </Stack.Navigator>
      </CartProvider>
    </ProductsProvider>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useAuth();
  const uid = user?.uid;
  const navigation = useNavigationContainerRef();
  const [navigationReady, setNavigationReady] = useState(false);

  useEffect(() => uid ? iniciarPushOrcamentos(uid) : undefined, [uid]);
  useEffect(() => {
    if (!uid || !navigationReady) return undefined;
    return acompanharToquesPush(uid, () => {
      if (!navigation.isReady() || !navigation.getRootState()?.routeNames.includes('Notificacoes')) return false;
      navigation.navigate('Notificacoes');
      return true;
    });
  }, [uid, navigation, navigationReady]);

  if (!isFirebaseConfigured) return <FirebaseSetupScreen />;
  if (isLoading) return <LoadingScreen />;

  return (
    <NavigationContainer ref={navigation} onReady={() => setNavigationReady(true)}>
      {user ? (
        <NotificacoesProvider key={user.uid} uid={user.uid}>
          <AuthenticatedNavigator />
        </NotificacoesProvider>
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
