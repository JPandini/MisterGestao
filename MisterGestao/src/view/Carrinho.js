import { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, View, Text, TouchableOpacity, StatusBar, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import Button from '../components/Button';
import FormField from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { salvarOrcamento } from '../services/orcamentos';
import { dataLocal, lerValidade, parsePriceToCents, validadePadrao } from '../utils/orcamento';

const formatCurrency = (cents) =>
  (Number(cents || 0) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

function ItemCarrinho({ item, onAlterar, onRemover, disabled }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.nome}>{item.nome}</Text>
        {item.medida ? <Text style={styles.medida}>{item.medida}</Text> : null}
        <Text style={styles.preco}>{formatCurrency(item.preco)}</Text>
      </View>

      <View style={styles.acoes}>
        <TouchableOpacity disabled={disabled} style={styles.botaoQtd} onPress={() => onAlterar(item.id, item.quantidade - 1)}>
          <Feather name="minus" size={16} color="#C94700" />
        </TouchableOpacity>
        <Text style={styles.quantidade}>{item.quantidade}</Text>
        <TouchableOpacity disabled={disabled} style={styles.botaoQtd} onPress={() => onAlterar(item.id, item.quantidade + 1)}>
          <Feather name="plus" size={16} color="#C94700" />
        </TouchableOpacity>
        <TouchableOpacity disabled={disabled} style={styles.remover} onPress={() => onRemover(item.id)}>
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
  const [salvando, setSalvando] = useState(false);
  const [desconto, setDesconto] = useState('');
  const [frete, setFrete] = useState('');
  const [validade, setValidade] = useState(() => validadePadrao().split('-').reverse().join('/'));
  const [observacoes, setObservacoes] = useState('');
  const [erros, setErros] = useState({});
  const [erroEnvio, setErroEnvio] = useState('');
  const envioEmAndamento = useRef(false);
  const descontoCentavos = parsePriceToCents(desconto || '0');
  const freteCentavos = parsePriceToCents(frete || '0');
  const totalValido = descontoCentavos !== null && freteCentavos !== null && descontoCentavos <= total
    && Number.isSafeInteger(total - descontoCentavos + freteCentavos);
  const totalOrcamento = totalValido ? total - descontoCentavos + freteCentavos : null;

  async function gerarOrcamento() {
    if (envioEmAndamento.current) return;
    const novosErros = {};
    const data = lerValidade(validade);
    if (descontoCentavos === null) novosErros.desconto = 'Use o formato 10,00.';
    else if (descontoCentavos > total) novosErros.desconto = 'O desconto não pode superar o subtotal.';
    if (freteCentavos === null) novosErros.frete = 'Use o formato 10,00.';
    if (!data || data < dataLocal()) novosErros.validade = 'Informe uma data a partir de hoje (DD/MM/AAAA).';
    setErros(novosErros);
    setErroEnvio('');
    if (Object.keys(novosErros).length || !totalValido) return;
    envioEmAndamento.current = true;
    setSalvando(true);
    try {
      const id = await salvarOrcamento({ itens, desconto: descontoCentavos, frete: freteCentavos,
        validade: data, observacoes }, user?.uid);
      limpar();
      navigation.navigate('Orcamento', { id });
    } catch (erro) {
      setErroEnvio(erro.code === 'permission-denied'
        ? 'O banco recusou o orçamento. Confira sua sessão e as permissões no Firebase.'
        : erro.message || 'Verifique sua conexão e tente novamente.');
    } finally {
      envioEmAndamento.current = false;
      setSalvando(false);
    }
  }
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Header userName={userName} />

      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={16} color="#626975" />
          <Text style={styles.voltarTexto}>Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>Carrinho</Text>

        <FlatList
          data={itens}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemCarrinho item={item} onAlterar={alterarQuantidade} onRemover={remover} disabled={salvando} />
          )}
          ListEmptyComponent={<Text style={styles.vazio}>Nenhum produto no carrinho.</Text>}
          contentContainerStyle={styles.lista}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={itens.length > 0 ? (
          <View style={styles.rodape}>
            <Text style={styles.totalLabel}>Condições do orçamento</Text>
            <FormField label="Validade" placeholder="DD/MM/AAAA" value={validade} onChangeText={setValidade}
              keyboardType="numbers-and-punctuation" maxLength={10} editable={!salvando} error={erros.validade} />
            <Text style={styles.medida}>Validade inicial de 7 dias. Você pode alterar a data.</Text>
            <FormField label="Desconto (R$)" placeholder="0,00" value={desconto} onChangeText={setDesconto}
              keyboardType="decimal-pad" maxLength={16} editable={!salvando} error={erros.desconto} />
            <FormField label="Frete (R$)" placeholder="0,00" value={frete} onChangeText={setFrete}
              keyboardType="decimal-pad" maxLength={16} editable={!salvando} error={erros.frete} />
            <FormField label="Observações" optional placeholder="Condições de entrega, pagamento..." value={observacoes}
              onChangeText={setObservacoes} maxLength={1000} editable={!salvando} />
            <View style={styles.linhaTotal}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalLabel}>{formatCurrency(total)}</Text>
            </View>
            <View style={styles.linhaTotal}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValor}>{totalOrcamento === null ? 'Confira os valores' : formatCurrency(totalOrcamento)}</Text>
            </View>
            {erroEnvio ? <Text style={styles.erro} accessibilityRole="alert">{erroEnvio}</Text> : null}
            <Button title={salvando ? 'Salvando orçamento...' : 'Gerar orçamento'} loading={salvando} onPress={gerarOrcamento} />
            <Button title="Limpar carrinho" variant="secondary" onPress={limpar} disabled={salvando} />
          </View>
          ) : null}
        />
      </KeyboardAvoidingView>
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
  erro: { fontSize: 14, color: '#B42318' },
  rodape: { gap: 12, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#E9EAED' },
  linhaTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#151619' },
  totalValor: { fontSize: 22, fontWeight: '800', color: '#C94700' },
});
