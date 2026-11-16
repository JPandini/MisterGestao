import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { acompanharOrcamentos } from '../services/orcamentos';
import { confirmarVenda } from '../services/vendas';
import { orcamentoVencido } from '../utils/orcamento';

const dinheiro = (centavos) => (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function NovaVenda({ navigation }) {
  const { user } = useAuth();
  const [orcamentos, setOrcamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendendo, setVendendo] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erroConsulta, setErroConsulta] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const vendaEmAndamento = useRef(false);

  // Carrega os orçamentos em aberto quando a tela abre
  useEffect(() => {
    const parar = acompanharOrcamentos(
      (lista) => {
        setOrcamentos(lista.filter((item) => item.status === 'open'));
        setLoading(false);
        setErroConsulta('');
      },
      (e) => {
        setErroConsulta(e.code === 'permission-denied'
          ? 'O banco recusou a consulta de orçamentos. Confira sua sessão e as regras do Firebase.'
          : 'Não foi possível carregar os orçamentos. Confira sua conexão.');
        setLoading(false);
      }
    );
    return parar;
  }, [tentativa]);

  const vender = async (orcamento) => {
    if (vendaEmAndamento.current) return;
    vendaEmAndamento.current = true;
    setVendendo(true);
    setMensagem('');
    try {
      await confirmarVenda(orcamento.id, user?.uid);
      setMensagem(`Venda de ${dinheiro(orcamento.total)} confirmada!`);
    } catch (e) {
      console.error('Erro ao confirmar venda:', e);
      setMensagem(e.code === 'permission-denied'
        ? 'O banco recusou a venda. Confira sua sessão e as regras do Firebase.' : e.message);
    } finally {
      setVendendo(false);
      vendaEmAndamento.current = false;
    }
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top', 'left', 'right']}>
      <Header userName={user?.email?.split('@')[0] || 'Equipe'} />

      <FlatList
        style={styles.fundo}
        contentContainerStyle={styles.lista}
        data={erroConsulta ? [] : orcamentos}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <Text style={styles.titulo}>Nova venda</Text>
            <Text style={styles.texto}>Escolha um orçamento em aberto e confirme a venda.</Text>
            {mensagem ? <Text style={styles.mensagem}>{mensagem}</Text> : null}
            {erroConsulta ? <View>
              <Text style={styles.mensagem} accessibilityRole="alert">{erroConsulta}</Text>
              <Button title="Tentar novamente" variant="secondary" onPress={() => {
                setLoading(true); setErroConsulta(''); setTentativa((valor) => valor + 1);
              }} />
            </View> : null}
            {loading ? <ActivityIndicator color="#C94700" /> : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.nome}>{item.cliente?.nome || 'Sem cliente'}</Text>
            <Text style={styles.texto}>Nº {item.id}</Text>
            <Text style={styles.texto}>{item.itens.length} produto(s) · {dinheiro(item.total)}</Text>
            <Text style={styles.texto}>Validade: {item.validade ? item.validade.split('-').reverse().join('/') : 'Não informada'}</Text>
            {orcamentoVencido(item) ? <Text style={styles.mensagem}>Orçamento vencido. Gere um novo para vender.</Text> : null}
            <Button title="Ver orçamento" variant="secondary" onPress={() => navigation.navigate('Orcamento', { id: item.id })} />
            <Button title="Confirmar venda" onPress={() => vender(item)} disabled={vendendo || orcamentoVencido(item)} />
          </View>
        )}
        ListEmptyComponent={
          loading || erroConsulta ? null : (
            <View style={styles.card}>
              <Text style={styles.texto}>Nenhum orçamento em aberto.</Text>
              <Button title="Fazer orçamento" variant="secondary" onPress={() => navigation.navigate('Produtos')} />
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#FFFFFF' },
  fundo: { backgroundColor: '#F7F7F8' },
  lista: { padding: 16, gap: 12 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#151619' },
  texto: { fontSize: 14, color: '#626975', marginVertical: 6 },
  mensagem: { fontSize: 14, fontWeight: 'bold', color: '#C94700', marginVertical: 8 },
  card: { padding: 16, gap: 6, borderRadius: 12, borderWidth: 1, borderColor: '#DEE0E4', backgroundColor: '#FFFFFF' },
  nome: { fontSize: 16, fontWeight: 'bold', color: '#151619' },
});
