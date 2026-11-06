import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import Button from '../components/Button';
import { buscarOrcamento } from '../services/orcamentos';
import { useAuth } from '../context/AuthContext';

function dinheiro(valor) {
  return (valor / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function Orcamento({ route, navigation }) {
  const { user } = useAuth();
  const id = route.params?.id;
  const [resultado, setResultado] = useState(null);
  const atual = resultado?.id === id ? resultado : null;
  const orcamento = atual?.orcamento;
  const mensagem = atual?.mensagem ?? 'Carregando orçamento...';

  useEffect(() => {
    let aberta = true;

    async function carregar() {
      try {
        const dados = await (id ? buscarOrcamento(id) : null);
        if (!aberta) return;
        setResultado({ id, orcamento: dados, mensagem: dados ? '' : 'Orçamento não encontrado.' });
      } catch {
        if (aberta) {
          setResultado({ id, orcamento: null, mensagem: 'Não foi possível carregar o orçamento. Tente abrir novamente.' });
        }
      }
    }

    carregar();

    // Impede atualizar os dados depois de sair desta tela.
    return () => { aberta = false; };
  }, [id]);

  return (
    <SafeAreaView style={styles.tela}>
      <Header userName={user?.displayName || user?.email?.split('@')[0] || 'Equipe'} />

      <ScrollView contentContainerStyle={styles.conteudo}>
        <Button title="Voltar" variant="secondary" onPress={() => navigation.goBack()} />
        <Text style={styles.titulo}>Orçamento</Text>

        {mensagem ? <Text style={styles.texto}>{mensagem}</Text> : null}

        {orcamento ? (
          <View style={styles.card}>
            <Text style={styles.nome}>Mister MotoPlace</Text>
            <Text style={styles.texto}>Número: {orcamento.id}</Text>

            <Text style={styles.nome}>{orcamento.cliente.nome || 'Cliente não informado'}</Text>
            {orcamento.cliente.contato ? (
              <Text style={styles.texto}>{orcamento.cliente.contato}</Text>
            ) : null}
            <Text style={styles.texto}>
              Validade: {orcamento.validade ? orcamento.validade.split('-').reverse().join('/') : 'Não informada'}
            </Text>

            {orcamento.itens.map((item) => (
              <View key={item.id} style={styles.item}>
                <View style={styles.descricao}>
                  <Text style={styles.nome}>{item.nome}</Text>
                  {item.medida ? <Text style={styles.texto}>{item.medida}</Text> : null}
                  <Text style={styles.texto}>{item.quantidade} × {dinheiro(item.preco)}</Text>
                </View>
                <Text style={styles.nome}>{dinheiro(item.preco * item.quantidade)}</Text>
              </View>
            ))}

            <View style={styles.linha}>
              <Text style={styles.texto}>Subtotal</Text>
              <Text style={styles.nome}>{dinheiro(orcamento.subtotal)}</Text>
            </View>
            <View style={styles.linha}>
              <Text style={styles.texto}>Desconto</Text>
              <Text style={styles.nome}>− {dinheiro(orcamento.desconto)}</Text>
            </View>
            <View style={styles.linha}>
              <Text style={styles.texto}>Frete</Text>
              <Text style={styles.nome}>{dinheiro(orcamento.frete)}</Text>
            </View>
            <View style={styles.linha}>
              <Text style={styles.nome}>Total</Text>
              <Text style={styles.total}>{dinheiro(orcamento.total)}</Text>
            </View>

            {orcamento.observacoes ? (
              <View>
                <Text style={styles.nome}>Observações</Text>
                <Text style={styles.texto}>{orcamento.observacoes}</Text>
              </View>
            ) : null}

            <Text style={styles.texto}>Este orçamento não reserva estoque.</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#FFFFFF' },
  conteudo: { padding: 16, gap: 16, backgroundColor: '#F7F7F8', flexGrow: 1 },
  titulo: { fontSize: 26, fontWeight: '800', color: '#151619' },
  card: { padding: 16, gap: 16, borderRadius: 12, borderWidth: 1, borderColor: '#DEE0E4', backgroundColor: '#FFFFFF' },
  nome: { fontSize: 15, fontWeight: '700', color: '#151619' },
  texto: { fontSize: 14, color: '#626975', lineHeight: 21 },
  item: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: '#E9EAED', paddingTop: 16 },
  descricao: { flex: 1, gap: 4 },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  total: { fontSize: 22, fontWeight: '800', color: '#C94700' },
});
