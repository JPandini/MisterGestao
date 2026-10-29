import { FlatList, View, Text, TouchableOpacity, StatusBar, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const formatCurrency = (cents) =>
  (Number(cents || 0) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

function ItemCarrinho({ item, onAlterar, onRemover }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.nome}>{item.nome}</Text>
        {item.medida ? <Text style={styles.medida}>{item.medida}</Text> : null}
        <Text style={styles.preco}>{formatCurrency(item.preco)}</Text>
      </View>

      <View style={styles.acoes}>
        <TouchableOpacity style={styles.botaoQtd} onPress={() => onAlterar(item.id, item.quantidade - 1)}>
          <Feather name="minus" size={16} color="#C94700" />
        </TouchableOpacity>
        <Text style={styles.quantidade}>{item.quantidade}</Text>
        <TouchableOpacity style={styles.botaoQtd} onPress={() => onAlterar(item.id, item.quantidade + 1)}>
          <Feather name="plus" size={16} color="#C94700" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.remover} onPress={() => onRemover(item.id)}>
          <Feather name="trash-2" size={18} color="#8F9297" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function Carrinho({ navigation }) {
  const { user } = useAuth();
  const { itens, total, alterarQuantidade, remover, limpar } = useCart();
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Equipe';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Header userName={userName} />

      <View style={styles.content}>
        <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={16} color="#626975" />
          <Text style={styles.voltarTexto}>Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>Carrinho</Text>

        <FlatList
          data={itens}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemCarrinho item={item} onAlterar={alterarQuantidade} onRemover={remover} />
          )}
          ListEmptyComponent={<Text style={styles.vazio}>Nenhum produto no carrinho.</Text>}
          contentContainerStyle={styles.lista}
        />

        {itens.length > 0 ? (
          <View style={styles.rodape}>
            <View style={styles.linhaTotal}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValor}>{formatCurrency(total)}</Text>
            </View>
            <Button title="Limpar carrinho" variant="secondary" onPress={limpar} />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, backgroundColor: '#F7F7F8', paddingHorizontal: 16, paddingTop: 12 },
  voltar: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  voltarTexto: { fontSize: 13, color: '#626975' },
  titulo: { fontSize: 26, fontWeight: '800', color: '#151619', marginBottom: 16 },
  lista: { gap: 12, paddingBottom: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DEE0E4',
    backgroundColor: '#FFFFFF',
  },
  cardInfo: { flex: 1 },
  nome: { fontSize: 15, fontWeight: '700', color: '#151619' },
  medida: { fontSize: 13, color: '#85888D', marginTop: 2 },
  preco: { fontSize: 15, fontWeight: '700', color: '#C94700', marginTop: 4 },
  acoes: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  botaoQtd: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FFF3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantidade: { minWidth: 24, textAlign: 'center', fontSize: 15, fontWeight: '700' },
  remover: { marginLeft: 6, padding: 4 },
  vazio: { fontSize: 13, color: '#7E8086', textAlign: 'center', marginTop: 32 },
  rodape: { gap: 12, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#E9EAED' },
  linhaTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#151619' },
  totalValor: { fontSize: 22, fontWeight: '800', color: '#C94700' },
});
