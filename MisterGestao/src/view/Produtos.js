import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

// Dados demonstrativos (tabela de referência do GUIA_CODEX). Quando Pandini
// disponibilizar a lista comum de produtos, troque por ela mantendo o formato.
// Preços em centavos.
const MOCK_PRODUCTS = [
  { id: '1', name: 'Pneu Borilli EXC Soft (T)', category: 'Pneus', brand: 'Borilli', code: 'PNE-001', measure: '110/100-18', price: 47090, stock: 10, minimum: 3 },
  { id: '2', name: 'Óleo Repsol Smarter Sport 4T', category: 'Óleos', brand: 'Repsol', code: 'OLE-002', measure: '15W50 • 1 litro', price: 5490, stock: 18, minimum: 5 },
  { id: '3', name: 'Câmara reforçada Rinaldi', category: 'Câmaras', brand: 'Rinaldi', code: 'CAM-003', measure: 'RD18', price: 13678, stock: 3, minimum: 3 },
  { id: '4', name: 'WD-40 Multiuso', category: 'Óleos', brand: 'WD-40', code: 'OLE-004', measure: '300 ml', price: 5490, stock: 2, minimum: 3 },
];

const CATEGORIES = ['Pneus', 'Óleos', 'Câmaras'];

// Menu inferior apenas visual; a navegação real fica com Pandini.
const TABS = [
  { label: 'Hoje', icon: 'home' },
  { label: 'Produtos', icon: 'package', active: true },
  { label: 'Escanear', barcode: true },
  { label: 'Venda', icon: 'shopping-bag' },
];

const formatCurrency = (cents) =>
  (Number(cents || 0) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const isLowStock = (product) => product.stock <= product.minimum;

const matchesSearch = (product, query) => {
  const term = query.trim().toLowerCase();
  if (!term) return true;

  return [product.name, product.brand, product.measure, product.code].some((value) =>
    value.toLowerCase().includes(term)
  );
};

function Barcode({ color, height }) {
  return (
    <View style={[styles.barcode, { height }]}>
      {[2, 1, 2, 2, 1, 2].map((width, index) => (
        <View key={index} style={{ width, height, backgroundColor: color }} />
      ))}
    </View>
  );
}

function ProductCard({ product }) {
  const stockLabel = isLowStock(product) ? 'Estoque baixo' : 'Em estoque';

  return (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <View style={styles.photo}>
          <Feather name="package" size={28} color="#626975" />
          <Text style={styles.photoText}>Sem foto</Text>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardBrand}>{product.brand} · {product.code}</Text>
          <Text style={styles.cardName}>{product.name}</Text>
          <Text style={styles.cardMeasure}>{product.measure}</Text>
          <Text style={styles.cardPrice}>{formatCurrency(product.price)}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.stockText}>
          {stockLabel} · {product.stock} un.
        </Text>
        {/* Aguarda o carrinho comum de Pandini. */}
        <TouchableOpacity style={styles.addButton} disabled activeOpacity={0.7}>
          <Feather name="plus" size={20} color="#C94700" />
          <Text style={styles.addText}>Adicionar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function MisterGestaoProdutos() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(null);
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const products = MOCK_PRODUCTS.filter(
    (product) =>
      matchesSearch(product, query) &&
      (!category || product.category === category) &&
      (!onlyLowStock || isLowStock(product))
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.prototypeBar}>
        <View style={styles.prototypeGroup}>
          <View style={styles.prototypeDot} />
          <Text style={styles.prototypeText}>Protótipo · dados fictícios</Text>
        </View>
        <View style={styles.prototypeGroup}>
          <Feather name="wifi" size={14} color="#666D78" />
          <Text style={styles.prototypeText}>Simular offline</Text>
        </View>
      </View>

      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>
            <Text style={styles.brandMister}>Mister </Text>
            <Text style={styles.brandGestao}>Gestão</Text>
          </Text>
          <Text style={styles.brandSubtitle}>Mister MotoPlace</Text>
        </View>
        <View style={styles.headerActions}>
          <Feather name="bell" size={24} color="#626975" />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JP</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>Produtos e estoque</Text>
        <Text style={styles.pageSubtitle}>
          {MOCK_PRODUCTS.length} produtos · preços de demonstração
        </Text>

        <Text style={styles.searchLabel}>Buscar produto</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Nome, marca, medida ou código"
          placeholderTextColor="#787B81"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />

        <View style={styles.chipsRow}>
          {['Todos', ...CATEGORIES].map((chip) => {
            const selected = chip === category;
            return (
              <TouchableOpacity
                key={chip}
                style={styles.chip}
                activeOpacity={0.7}
                onPress={() => setCategory(chip === 'Todos' || selected ? null : chip)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{chip}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.lowStockToggle}
            activeOpacity={0.7}
            onPress={() => setOnlyLowStock((value) => !value)}
          >
            <Feather
              name="sliders"
              size={18}
              color={onlyLowStock ? '#C94700' : '#626975'}
              style={styles.filterIcon}
            />
            <Text style={[styles.filterText, onlyLowStock && styles.filterTextActive]}>
              Filtrar estoque baixo
            </Text>
          </TouchableOpacity>
          <View style={styles.filterBarcode}>
            <Barcode color="#626975" height={16} />
          </View>
        </View>

        {products.length > 0 ? (
          <View style={styles.productList}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>Nenhum produto encontrado.</Text>
        )}
      </ScrollView>

      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const color = tab.active ? '#B83F00' : '#8A93A0';
          return (
            <View key={tab.label} style={[styles.tab, tab.active && styles.tabActive]}>
              <View style={styles.tabIcon}>
                {tab.barcode ? (
                  <Barcode color={color} height={19} />
                ) : (
                  <Feather name={tab.icon} size={24} color={color} />
                )}
              </View>
              <Text style={[styles.tabLabel, tab.active && styles.tabLabelActive]}>{tab.label}</Text>
            </View>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  prototypeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingLeft: 3,
    paddingRight: 22,
  },
  prototypeGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  prototypeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8E9299',
  },
  prototypeText: { fontSize: 10, lineHeight: 14, color: '#74777D' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 14,
    paddingLeft: 14,
    paddingRight: 16,
  },
  brand: { fontSize: 21, lineHeight: 26, fontWeight: '800', letterSpacing: -0.4 },
  brandMister: { color: '#151619' },
  brandGestao: { color: '#C94700' },
  brandSubtitle: { fontSize: 12, lineHeight: 15, color: '#84878B', marginTop: 5 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar: {
    width: 33,
    height: 33,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F7F8',
  },
  avatarText: { fontSize: 11, fontWeight: '700', color: '#16171A' },
  scroll: { flex: 1, backgroundColor: '#F7F7F8' },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 24 },
  pageTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: '#151619',
  },
  pageSubtitle: { fontSize: 14, lineHeight: 18, color: '#7E8086', marginTop: 4 },
  searchLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    color: '#797C82',
    marginTop: 20,
  },
  searchInput: {
    height: 51,
    marginTop: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DEE0E4',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    fontSize: 14,
    color: '#151619',
  },
  chipsRow: { flexDirection: 'row', gap: 12, marginTop: 19 },
  chip: {
    height: 34,
    paddingHorizontal: 9,
    borderRadius: 7,
    backgroundColor: '#FFF3ED',
    justifyContent: 'center',
  },
  chipText: { fontSize: 12, fontWeight: '500', color: '#76797F' },
  chipTextSelected: { color: '#C94700', fontWeight: '700' },
  filterRow: { flexDirection: 'row', alignItems: 'center', height: 17, marginTop: 19 },
  lowStockToggle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  filterIcon: { transform: [{ rotate: '90deg' }] },
  filterText: { fontSize: 12, color: '#8F9297' },
  filterTextActive: { color: '#C94700', fontWeight: '600' },
  filterBarcode: { marginLeft: 14 },
  barcode: { flexDirection: 'row', gap: 2 },
  productList: { gap: 15, marginTop: 19 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DEE0E4',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  cardBody: {
    flexDirection: 'row',
    gap: 13,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 15,
  },
  photo: {
    width: 80,
    height: 92,
    borderRadius: 8,
    backgroundColor: '#F7F7F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: { fontSize: 10, lineHeight: 12, color: '#9A9CA1', marginTop: 15 },
  cardInfo: { flex: 1, minWidth: 0 },
  cardBrand: { fontSize: 11, lineHeight: 14, color: '#75787E' },
  cardName: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: '#151619',
    marginTop: 3,
  },
  cardMeasure: { fontSize: 13, lineHeight: 16, color: '#85888D', marginTop: 5 },
  cardPrice: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: '#C94700',
    marginTop: 5,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EFF0F2',
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 46,
  },
  stockText: { fontSize: 11, lineHeight: 15, fontWeight: '500', color: '#1C8856' },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  addText: { fontSize: 13, lineHeight: 16, fontWeight: '600', color: '#C94700' },
  emptyText: {
    fontSize: 13,
    color: '#7E8086',
    textAlign: 'center',
    marginTop: 32,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAEBEE',
    paddingVertical: 8,
    paddingLeft: 2,
    paddingRight: 16,
  },
  tab: {
    flex: 1,
    height: 62,
    marginHorizontal: 1.5,
    borderRadius: 10,
    alignItems: 'center',
    paddingTop: 5,
    gap: 6,
  },
  tabActive: { backgroundColor: '#FFF3ED' },
  tabIcon: { height: 26, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 12, lineHeight: 15, fontWeight: '500', color: '#858B95' },
  tabLabelActive: { fontWeight: '600', color: '#B83F00' },
});
