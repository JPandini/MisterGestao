import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Dados demonstrativos. Quando Pandini disponibilizar os dados comuns,
// troque por eles mantendo o mesmo formato. Dinheiro em centavos.
const MOCK_DATA = {
  userName: 'João',
  todaySales: 0,
  salesCount: 0,
  products: [
    { id: '1', name: 'Câmara reforçada Rinaldi', detail: 'R18', stock: 3, minimum: 3 },
    { id: '2', name: 'WD-40 Multiuso', detail: '300 ml', stock: 2, minimum: 3 },
  ],
};

// Rotas ainda não confirmadas por Pandini: estes atalhos ficam desativados.
const SHORTCUTS = [
  { id: 'orcamento', label: 'Monte um orçamento', icon: 'file-document-edit-outline' },
  { id: 'salvos', label: 'Orçamentos salvos', icon: 'content-save-outline' },
  { id: 'produtos', label: 'Produtos', icon: 'cart-outline' },
];

const formatCurrency = (cents) =>
  (Number(cents || 0) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const isLowStock = (item) => item.stock <= item.minimum;

function Header({ userName }) {
  return (
    <View style={styles.header}>
      <View>
        <View style={styles.brandLine}>
          <Text style={styles.brandMister}>Mister</Text>
          <Text style={styles.brandGestao}>Gestão</Text>
        </View>
        <Text style={styles.subtitle}>Mister MotoPlace</Text>
      </View>

      <View style={styles.headerActions}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(userName || 'JP').slice(0, 2).toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
}

function SalesCard({ data }) {
  return (
    <View style={styles.salesCard}>
      <Text style={styles.salesEyebrow}>VENDAS DO DIA · DEMONSTRAÇÃO</Text>
      <Text style={styles.salesAmount}>{formatCurrency(data.todaySales)}</Text>
      <Text style={styles.mutedOnDark}>{data.salesCount} vendas registradas</Text>
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

function ShortcutTile({ icon, label }) {
  return (
    <TouchableOpacity style={styles.shortcutTile} disabled activeOpacity={0.8}>
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

export default function MisterGestaoHome() {
  // Depois, obtenha estes dados do contexto comum mantendo o mesmo formato.
  const data = MOCK_DATA;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <Header userName={data.userName} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greeting}>
          <Text style={styles.pageTitle}>Seu dia, em um olhar.</Text>
          <Text style={styles.greetingSubtitle}>
            Olá, {data.userName}. Vamos atender?
          </Text>
        </View>

        <SalesCard data={data} />

        <View style={styles.actionsRow}>
          <ActionCard icon="plus" title="Nova venda" description="Começar venda" accent disabled />
          <ActionCard icon="barcode-scan" title="Escanear" description="Encontrar produto" disabled />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Atalhos</Text>
        </View>
        <View style={styles.shortcutsRow}>
          {SHORTCUTS.map((shortcut) => (
            <ShortcutTile key={shortcut.id} icon={shortcut.icon} label={shortcut.label} />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>De olho no estoque</Text>
          <TouchableOpacity disabled activeOpacity={0.7}>
            <Text style={styles.seeAll}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.stockList}>
          {data.products.map((item) => (
            <StockItem key={item.id} item={item} />
          ))}
        </View>

        <Text style={styles.demoNote}>
          Valores demonstrativos. Atalhos e botões aguardam as rotas e os dados confirmados por Pandini.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  brandLine: { flexDirection: 'row', alignItems: 'baseline' },
  brandMister: { fontSize: 17, fontWeight: '800', color: '#18191C', letterSpacing: -0.6 },
  brandGestao: { fontSize: 17, fontWeight: '800', color: '#F45108', letterSpacing: -0.6 },
  subtitle: { fontSize: 9, color: '#7C818A', marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F1F3',
  },
  avatarText: { fontSize: 9, fontWeight: '700', color: '#5B606A' },
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
  demoNote: {
    color: '#969AA2',
    fontSize: 8,
    lineHeight: 12,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 10,
  },
});
