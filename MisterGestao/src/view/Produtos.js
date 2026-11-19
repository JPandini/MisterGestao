import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductsContext';
import { useCart } from '../context/CartContext';
import { aumentarEstoque } from '../services/products';

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
    String(value || '').toLowerCase().includes(term)
  );
};

// Campo para dar entrada de mercadoria em um produto
function EntradaEstoque({ product, userId }) {
  const [quantidade, setQuantidade] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const salvar = async () => {
    const numero = Number(quantidade);
    if (!Number.isInteger(numero) || numero < 1) {
      setMensagem('Digite uma quantidade maior que zero.');
      return;
    }

    setSalvando(true);
    try {
      await aumentarEstoque(product, numero, userId);
      setMensagem(`+${numero} un. no estoque.`);
      setQuantidade('');
    } catch (e) {
      console.error('Erro ao dar entrada no estoque:', e);
      setMensagem('Não foi possível salvar a entrada.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <View>
      <View style={styles.entrada}>
        <TextInput
          style={styles.entradaInput}
          placeholder="Quantidade que chegou"
          placeholderTextColor="#787B81"
          keyboardType="number-pad"
          value={quantidade}
          onChangeText={setQuantidade}
        />
        <Button title="Salvar" onPress={salvar} disabled={salvando} style={styles.entradaBotao} />
      </View>
      {mensagem ? <Text style={styles.entradaMensagem}>{mensagem}</Text> : null}
    </View>
  );
}

function ProductCard({ product, onAdd, userId }) {
  const stockLabel = isLowStock(product) ? 'Estoque baixo' : 'Em estoque';
  const [entradaAberta, setEntradaAberta] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        {product.photo ? (
          <Image source={{ uri: product.photo }} style={styles.photo} />
        ) : (
          <View style={styles.photo}>
            <Feather name="package" size={28} color="#626975" />
            <Text style={styles.photoText}>Sem foto</Text>
          </View>
        )}

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
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.addButton} onPress={() => setEntradaAberta(!entradaAberta)} activeOpacity={0.7}>
            <Feather name="package" size={18} color="#626975" />
            <Text style={styles.entradaText}>Entrada</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => onAdd(product)} activeOpacity={0.7}>
            <Feather name="plus" size={20} color="#C94700" />
            <Text style={styles.addText}>Adicionar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {entradaAberta ? <EntradaEstoque product={product} userId={userId} /> : null}
    </View>
  );
}

export default function MisterGestaoProdutos({ navigation }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(null);
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const { user } = useAuth();
  const { products: allProducts, isLoading, error, retry } = useProducts();
  const { totalItens, adicionar } = useCart();
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Equipe';
  const categories = [...new Set(allProducts.map((product) => product.category).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right, 'pt-BR')
  );

  const products = allProducts.filter(
    (product) =>
      matchesSearch(product, query) &&
      (!category || product.category === category) &&
      (!onlyLowStock || isLowStock(product))
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <Header userName={userName} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <Text style={styles.pageTitle}>Produtos e estoque</Text>
            <Text style={styles.pageSubtitle}>{allProducts.length} produtos cadastrados</Text>
          </View>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => navigation.navigate('Carrinho')}
            activeOpacity={0.8}
          >
            <Feather name="shopping-cart" size={18} color="#C94700" />
            {totalItens > 0 ? <Text style={styles.cartCount}>{totalItens}</Text> : null}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('CadastroProduto')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Cadastrar produto"
          >
            <Feather name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.registerButtonText}>Cadastrar</Text>
          </TouchableOpacity>
        </View>

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
          {['Todos', ...categories].map((chip) => {
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
        </View>

        {isLoading ? (
          <View style={styles.dataState}>
            <ActivityIndicator color="#C94700" />
            <Text style={styles.dataStateText}>Carregando produtos...</Text>
          </View>
        ) : error ? (
          <View style={styles.dataState}>
            <Text style={styles.dataError}>{error}</Text>
            <Button title="Tentar novamente" variant="secondary" onPress={retry} />
          </View>
        ) : products.length > 0 ? (
          <View style={styles.productList}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={adicionar} userId={user?.uid} />
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>
            {allProducts.length === 0
              ? 'Nenhum produto cadastrado ainda.'
              : 'Nenhum produto encontrado com esses filtros.'}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleCopy: { flex: 1, minWidth: 0 },
  registerButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 11,
    borderRadius: 9,
    backgroundColor: '#C94700',
  },
  registerButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  cartButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    borderRadius: 9,
    backgroundColor: '#FFF3ED',
  },
  cartCount: { color: '#C94700', fontSize: 13, fontWeight: '700' },
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
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  entradaText: { fontSize: 13, lineHeight: 16, fontWeight: '600', color: '#626975' },
  entrada: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  entradaInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#DEE0E4',
    borderRadius: 9,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#151619',
  },
  entradaBotao: { minHeight: 44 },
  entradaMensagem: { fontSize: 12, color: '#626975', paddingHorizontal: 12, paddingBottom: 10 },
  addText: { fontSize: 13, lineHeight: 16, fontWeight: '600', color: '#C94700' },
  emptyText: {
    fontSize: 13,
    color: '#7E8086',
    textAlign: 'center',
    marginTop: 32,
  },
  dataState: { alignItems: 'center', gap: 12, marginTop: 28 },
  dataStateText: { color: '#7E8086', fontSize: 13, textAlign: 'center' },
  dataError: { color: '#B42318', fontSize: 13, textAlign: 'center' },
});
