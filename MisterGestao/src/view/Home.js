import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductsContext';
import Header from '../components/Header';
import Button from '../components/Button';
import {
  ActivityIndicator,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const SHORTCUTS = [
  { id: 'cadastro', label: 'Cadastrar produto', icon: 'plus-box-outline', screen: 'CadastroProduto' },
  { id: 'produtos', label: 'Produtos e estoque', icon: 'cart-outline', screen: 'Produtos' },
];

const isLowStock = (item) => item.stock <= item.minimum;

function SalesCard() {
  return (
    <View style={styles.salesCard}>
      <Text style={styles.salesEyebrow}>VENDAS</Text>
      <Text style={styles.salesAmount}>Resumo indisponível</Text>
      <Text style={styles.mutedOnDark}>O cadastro de vendas ainda não está disponível.</Text>
    </View>
  );
}

function ActionCard({ icon, title, description, accent = false, disabled = false }) {
  return (
    <TouchableOpacity
      style={[styles.actionCard, accent && styles.actionCardAccent]}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons
        name={icon}
        size={25}
        color={accent ? '#171717' : '#F45108'}
      />
      <Text style={[styles.actionTitle, accent && styles.actionTitleAccent]}>
        {title}
      </Text>
      <Text
        numberOfLines={1}
        style={[styles.actionDescription, accent && styles.actionDescriptionAccent]}
      >
        {description}
      </Text>
    </TouchableOpacity>
  );
}

function ShortcutTile({ icon, label, screen, navigation }) {
  return (
    <TouchableOpacity
      style={styles.shortcutTile}
      onPress={() => navigation.navigate(screen)}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons name={icon} size={20} color="#F45108" />
      <Text style={styles.shortcutLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function StockItem({ item }) {
  const low = isLowStock(item);

  return (
    <View style={styles.stockItem}>
      <View style={styles.stockIcon}>
        <MaterialCommunityIcons name="package-variant-closed" size={20} color="#B75B20" />
      </View>
      <View style={styles.stockCopy}>
        <Text style={styles.stockName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.stockDetail}>
          {item.detail} · mínimo {item.minimum}
        </Text>
      </View>
      <Text style={[styles.stockCount, low && styles.stockCountLow]}>
        {item.stock}
      </Text>
    </View>
  );
}

export default function MisterGestaoHome({ navigation }) {
  const { user, logOut } = useAuth();
  const { products, isLoading: isProductsLoading, error: productsError, retry } = useProducts();
  const lowStockProducts = products.filter(isLowStock).slice(0, 4);
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Equipe';
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const signingOut = useRef(false);

  async function handleSignOut() {
    if (signingOut.current) return;
    signingOut.current = true;
    setIsSigningOut(true);
    setSignOutError('');
    try {
      await logOut();
    } catch {
      setSignOutError('Não foi possível sair. Tente novamente.');
    } finally {
      signingOut.current = false;
      setIsSigningOut(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <Header
        userName={userName}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
      />
      {signOutError ? <Text style={styles.signOutError} accessibilityRole="alert">{signOutError}</Text> : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greeting}>
          <Text style={styles.pageTitle}>Seu dia, em um olhar.</Text>
          <Text style={styles.greetingSubtitle}>
            Olá, {userName}. Vamos atender?
          </Text>
        </View>

        <SalesCard />

        <View style={styles.actionsRow}>
          <ActionCard icon="plus" title="Nova venda" description="Começar venda" accent disabled />
          <ActionCard icon="barcode-scan" title="Escanear" description="Encontrar produto" disabled />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Atalhos</Text>
        </View>
        <View style={styles.shortcutsRow}>
          {SHORTCUTS.map((shortcut) => (
            <ShortcutTile
              key={shortcut.id}
              icon={shortcut.icon}
              label={shortcut.label}
              screen={shortcut.screen}
              navigation={navigation}
            />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>De olho no estoque</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Produtos')} activeOpacity={0.7}>
            <Text style={styles.seeAll}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {isProductsLoading ? (
          <View style={styles.dataState}>
            <ActivityIndicator color="#C94700" />
            <Text style={styles.dataStateText}>Carregando produtos...</Text>
          </View>
        ) : productsError ? (
          <View style={styles.dataState}>
            <Text style={styles.dataError}>{productsError}</Text>
            <Button title="Tentar novamente" variant="secondary" onPress={retry} />
          </View>
        ) : lowStockProducts.length > 0 ? (
          <View style={styles.stockList}>
            {lowStockProducts.map((item) => (
              <StockItem key={item.id} item={{ ...item, detail: item.measure || 'Sem medida' }} />
            ))}
          </View>
        ) : (
          <Text style={styles.dataStateText}>
            {products.length === 0
              ? 'Nenhum produto cadastrado ainda.'
              : 'Nenhum produto com estoque baixo.'}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  signOutError: { color: '#B42318', paddingHorizontal: 14, paddingBottom: 8 },
  scroll: { flex: 1, backgroundColor: '#F6F6F7' },
  content: { paddingHorizontal: 14, paddingTop: 15, paddingBottom: 28 },
  greeting: { marginBottom: 12 },
  pageTitle: { fontSize: 20, lineHeight: 25, fontWeight: '800', color: '#202126', letterSpacing: -0.55 },
  greetingSubtitle: { fontSize: 11, color: '#858A93', marginTop: 2 },
  salesCard: {
    backgroundColor: '#090A0B',
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingTop: 13,
    paddingBottom: 11,
    minHeight: 101,
    marginBottom: 12,
  },
  salesEyebrow: { color: '#F2F2F2', fontSize: 8, fontWeight: '600', letterSpacing: 0.15 },
  salesAmount: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginTop: 9, letterSpacing: -0.5 },
  mutedOnDark: { color: '#777B81', fontSize: 8, marginTop: 7 },
  actionsRow: { flexDirection: 'row', gap: 9, marginBottom: 14 },
  actionCard: {
    flex: 1,
    minWidth: 0,
    height: 86,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E1E4',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  actionCardAccent: { backgroundColor: '#F45108', borderColor: '#F45108' },
  actionTitle: { color: '#222328', fontSize: 12, fontWeight: '750', marginTop: 1 },
  actionTitleAccent: { color: '#171717' },
  actionDescription: { color: '#898E97', fontSize: 8 },
  actionDescriptionAccent: { color: '#B93800' },
  shortcutsRow: { flexDirection: 'row', gap: 9, marginBottom: 16 },
  shortcutTile: {
    flex: 1,
    minWidth: 0,
    minHeight: 64,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E1E4',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 9,
    justifyContent: 'space-between',
  },
  shortcutLabel: { color: '#292A2F', fontSize: 9, fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#27282D' },
  seeAll: { fontSize: 9, color: '#747983' },
  stockList: { gap: 9, marginBottom: 16 },
  stockItem: {
    minHeight: 53,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E1E4',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  stockIcon: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockCopy: { flex: 1, minWidth: 0 },
  stockName: { color: '#292A2F', fontSize: 10, fontWeight: '700' },
  stockDetail: { color: '#858A93', fontSize: 8, marginTop: 3 },
  stockCount: { color: '#F45108', fontSize: 15, fontWeight: '800', paddingHorizontal: 2 },
  stockCountLow: { color: '#D9430B' },
  dataState: { alignItems: 'center', gap: 10, marginVertical: 14 },
  dataStateText: { color: '#858A93', fontSize: 11, textAlign: 'center', marginVertical: 12 },
  dataError: { color: '#B42318', fontSize: 12, textAlign: 'center' },
});
