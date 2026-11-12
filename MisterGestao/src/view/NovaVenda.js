import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { acompanharOrcamentos } from '../services/orcamentos';
import { confirmarVenda } from '../services/vendas';

const dinheiro = (valor) => (Number(valor || 0) / 100).toLocaleString('pt-BR', {
  style: 'currency', currency: 'BRL',
});

export default function NovaVenda({ navigation }) {
  const { user } = useAuth();
  const [orcamentos, setOrcamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendendo, setVendendo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const emAndamento = useRef(false);

  useEffect(() => {
    return acompanharOrcamentos(
      (lista) => {
        setOrcamentos(lista.filter((item) => item.status === 'open'));
        setLoading(false);
      },
      (e) => {
        console.error('Erro ao carregar orçamentos:', e);
        setLoading(false);
      }
    );
  }, []);

  const vender = async (orcamento) => {
    if (emAndamento.current) return;
    emAndamento.current = true;
    setVendendo(orcamento.id);
    setMensagem('');
    try {
      await confirmarVenda(orcamento.id, user.uid);
      setMensagem(`Venda de ${dinheiro(orcamento.total)} confirmada!`);
    } catch (e) {
      console.error('Erro ao confirmar venda:', e);
      setMensagem(e.message || 'Não foi possível confirmar a venda.');
    } finally {
      emAndamento.current = false;
      setVendendo('');
    }
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top', 'left', 'right']}>
      <Header userName={user?.displayName || user?.email?.split('@')[0] || 'Equipe'} />
      <FlatList
        style={styles.fundo}
        contentContainerStyle={styles.lista}
        data={orcamentos}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={(
          <View>
            <Text style={styles.titulo}>Nova venda</Text>
            <Text style={styles.texto}>Escolha um orçamento em aberto e confirme a venda. O estoque é baixado na hora.</Text>
            {mensagem ? <Text style={styles.mensagem}>{mensagem}</Text> : null}
            {loading ? <ActivityIndicator color="#C94700" /> : null}
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.nome}>{item.cliente?.nome || 'Sem cliente'}</Text>
            <Text style={styles.texto}>
              {item.itens.length} {item.itens.length === 1 ? 'produto' : 'produtos'} · {dinheiro(item.total)}
            </Text>
            <Button
              title="Confirmar venda"
              onPress={() => vender(item)}
              loading={vendendo === item.id}
              disabled={!!vendendo}
            />
          </View>
        )}
        ListEmptyComponent={loading ? null : (
          <View style={styles.card}>
            <Text style={styles.texto}>Nenhum orçamento em aberto.</Text>
            <Button title="Fazer orçamento" variant="secondary" onPress={() => navigation.navigate('Produtos')} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#FFFFFF' },
  fundo: { backgroundColor: '#F7F7F8' },
  lista: { padding: 16, gap: 12 },
  titulo: { fontSize: 26, fontWeight: '800', color: '#151619' },
  texto: { fontSize: 14, color: '#626975', marginVertical: 6 },
  mensagem: { fontSize: 14, fontWeight: '600', color: '#C94700', marginVertical: 8 },
  card: { padding: 16, gap: 6, borderRadius: 12, borderWidth: 1, borderColor: '#DEE0E4', backgroundColor: '#FFFFFF' },
  nome: { fontSize: 16, fontWeight: '700', color: '#151619' },
});
