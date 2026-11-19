import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { acompanharMovimentos, acompanharVendas } from '../services/vendas';

const dinheiro = (centavos) => (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const diaMes = (data) => data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

// Segunda-feira da semana de uma data (a semana vai de segunda a domingo)
function inicioDaSemana(data) {
  const segunda = new Date(data);
  const diasDesdeSegunda = (segunda.getDay() + 6) % 7;
  segunda.setDate(segunda.getDate() - diasDesdeSegunda);
  segunda.setHours(0, 0, 0, 0);
  return segunda;
}

// Junta os registros por semana, da mais recente para a mais antiga
function agruparPorSemana(registros) {
  const semanas = {};

  for (const registro of registros) {
    const data = registro.createdAt?.toDate?.();
    if (!data) continue;

    const segunda = inicioDaSemana(data);
    const chave = segunda.getTime();
    if (!semanas[chave]) {
      const domingo = new Date(segunda);
      domingo.setDate(domingo.getDate() + 6);
      semanas[chave] = { chave, titulo: `${diaMes(segunda)} a ${diaMes(domingo)}`, registros: [] };
    }
    semanas[chave].registros.push(registro);
  }

  return Object.values(semanas).sort((a, b) => b.chave - a.chave);
}

export default function Dashboard({ navigation }) {
  const { user } = useAuth();
  const [vendas, setVendas] = useState([]);
  const [movimentos, setMovimentos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fica atualizando vendas e movimentos de estoque sozinho
  useEffect(() => {
    const pararVendas = acompanharVendas(
      (lista) => {
        setVendas(lista);
        setLoading(false);
      },
      (e) => {
        console.error('Erro ao carregar vendas:', e);
        setLoading(false);
      }
    );
    const pararMovimentos = acompanharMovimentos(setMovimentos, (e) => console.error('Erro ao carregar estoque:', e));

    return () => {
      pararVendas();
      pararMovimentos();
    };
  }, []);

  // Vendas: quantidade e total de cada semana
  const semanasVendas = agruparPorSemana(vendas).map((semana) => ({
    ...semana,
    total: semana.registros.reduce((soma, venda) => soma + venda.total, 0),
  }));
  const maiorTotal = Math.max(1, ...semanasVendas.map((semana) => semana.total));

  // Estoque: entradas, saídas e saldo de cada produto na semana
  const semanasEstoque = agruparPorSemana(movimentos).map((semana) => {
    const produtos = {};
    let entradas = 0;
    let saidas = 0;

    for (const movimento of semana.registros) {
      if (movimento.quantidade > 0) entradas += movimento.quantidade;
      else saidas -= movimento.quantidade;

      const atual = produtos[movimento.produtoId] || { id: movimento.produtoId, nome: movimento.produto, saldo: 0 };
      atual.saldo += movimento.quantidade;
      produtos[movimento.produtoId] = atual;
    }

    return { ...semana, entradas, saidas, produtos: Object.values(produtos) };
  });

  return (
    <SafeAreaView style={styles.tela}>
      <Header userName={user?.email?.split('@')[0] || 'Equipe'} />

      <ScrollView style={styles.fundo} contentContainerStyle={styles.conteudo}>
        <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={16} color="#626975" />
          <Text style={styles.voltarTexto}>Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>Dashboard</Text>

        {loading ? <ActivityIndicator color="#C94700" /> : null}

        <Text style={styles.secao}>Vendas por semana</Text>
        {!loading && semanasVendas.length === 0 ? <Text style={styles.vazio}>Nenhuma venda ainda.</Text> : null}
        {semanasVendas.map((semana) => (
          <View key={semana.chave} style={styles.card}>
            <View style={styles.linha}>
              <Text style={styles.semana}>{semana.titulo}</Text>
              <Text style={styles.valor}>{dinheiro(semana.total)}</Text>
            </View>
            <View style={styles.barraFundo}>
              <View style={[styles.barra, { width: `${(semana.total / maiorTotal) * 100}%` }]} />
            </View>
            <Text style={styles.texto}>{semana.registros.length} venda(s)</Text>
          </View>
        ))}

        <Text style={styles.secao}>Estoque por semana</Text>
        {!loading && semanasEstoque.length === 0 ? (
          <Text style={styles.vazio}>Nenhuma entrada ou venda registrada ainda.</Text>
        ) : null}
        {semanasEstoque.map((semana) => (
          <View key={semana.chave} style={styles.card}>
            <View style={styles.linha}>
              <Text style={styles.semana}>{semana.titulo}</Text>
              <Text style={styles.texto}>
                <Text style={styles.entrada}>+{semana.entradas}</Text>
                {'  '}
                <Text style={styles.saida}>-{semana.saidas}</Text>
                {' un.'}
              </Text>
            </View>
            {semana.produtos.map((produto) => (
              <View key={produto.id} style={styles.linha}>
                <Text style={styles.texto}>{produto.nome}</Text>
                <Text style={produto.saldo >= 0 ? styles.entrada : styles.saida}>
                  {produto.saldo > 0 ? '+' : ''}{produto.saldo} un.
                </Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#FFFFFF' },
  fundo: { backgroundColor: '#F7F7F8' },
  conteudo: { padding: 16, gap: 10, paddingBottom: 32 },
  voltar: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  voltarTexto: { fontSize: 13, color: '#626975' },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#151619' },
  secao: { fontSize: 17, fontWeight: 'bold', color: '#151619', marginTop: 12 },
  vazio: { fontSize: 13, color: '#7E8086' },
  card: { padding: 14, gap: 8, borderRadius: 12, borderWidth: 1, borderColor: '#DEE0E4', backgroundColor: '#FFFFFF' },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  semana: { fontSize: 14, fontWeight: 'bold', color: '#151619' },
  valor: { fontSize: 16, fontWeight: 'bold', color: '#C94700' },
  barraFundo: { height: 8, borderRadius: 4, backgroundColor: '#F0F1F3', overflow: 'hidden' },
  barra: { height: 8, borderRadius: 4, backgroundColor: '#F45108' },
  texto: { fontSize: 13, color: '#626975' },
  entrada: { fontSize: 13, fontWeight: 'bold', color: '#1C8856' },
  saida: { fontSize: 13, fontWeight: 'bold', color: '#B42318' },
});
