import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { acompanharMovimentos, acompanharVendas } from '../services/vendas';

const dinheiro = (centavos) => (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const diaMes = (data) => data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

// Separa os registros por semana (de segunda a domingo), da mais nova para a mais antiga
function separarPorSemana(registros) {
  const semanas = {};

  for (const registro of registros) {
    if (!registro.createdAt) continue;

    // 1. Acha a segunda-feira da semana do registro
    const segunda = registro.createdAt.toDate();
    segunda.setDate(segunda.getDate() - ((segunda.getDay() + 6) % 7));
    segunda.setHours(0, 0, 0, 0);

    // 2. Cria a semana se ainda não existir
    const chave = segunda.getTime();
    if (!semanas[chave]) {
      const domingo = new Date(segunda);
      domingo.setDate(domingo.getDate() + 6);
      semanas[chave] = { chave, titulo: `${diaMes(segunda)} a ${diaMes(domingo)}`, registros: [] };
    }

    // 3. Coloca o registro dentro da semana
    semanas[chave].registros.push(registro);
  }

  return Object.values(semanas).sort((a, b) => b.chave - a.chave);
}

// Card de uma semana de vendas
function SemanaVendas({ semana, maiorTotal }) {
  let total = 0;
  for (const venda of semana.registros) total += venda.total;

  return (
    <View style={styles.card}>
      <View style={styles.linha}>
        <Text style={styles.semana}>{semana.titulo}</Text>
        <Text style={styles.valor}>{dinheiro(total)}</Text>
      </View>
      <View style={styles.barraFundo}>
        <View style={[styles.barra, { width: `${(total / maiorTotal) * 100}%` }]} />
      </View>
      <Text style={styles.texto}>{semana.registros.length} venda(s)</Text>
    </View>
  );
}

// Card de uma semana de estoque: entradas, saídas e saldo de cada produto
function SemanaEstoque({ semana }) {
  let entradas = 0;
  let saidas = 0;
  const produtos = {};

  for (const movimento of semana.registros) {
    if (movimento.quantidade > 0) entradas += movimento.quantidade;
    else saidas += -movimento.quantidade;

    if (!produtos[movimento.produtoId]) {
      produtos[movimento.produtoId] = { id: movimento.produtoId, nome: movimento.produto, saldo: 0 };
    }
    produtos[movimento.produtoId].saldo += movimento.quantidade;
  }

  return (
    <View style={styles.card}>
      <View style={styles.linha}>
        <Text style={styles.semana}>{semana.titulo}</Text>
        <Text style={styles.texto}>
          <Text style={styles.entrada}>+{entradas}</Text>  <Text style={styles.saida}>-{saidas}</Text> un.
        </Text>
      </View>
      {Object.values(produtos).map((produto) => (
        <View key={produto.id} style={styles.linha}>
          <Text style={styles.texto}>{produto.nome}</Text>
          <Text style={produto.saldo >= 0 ? styles.entrada : styles.saida}>
            {produto.saldo > 0 ? '+' : ''}{produto.saldo} un.
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function Dashboard({ navigation }) {
  const { user } = useAuth();
  const [vendas, setVendas] = useState([]);
  const [movimentos, setMovimentos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fica atualizando vendas e estoque sozinho enquanto a tela está aberta
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

  const semanasVendas = separarPorSemana(vendas);
  const semanasEstoque = separarPorSemana(movimentos);

  // Maior total de uma semana, para o tamanho das barras
  let maiorTotal = 1;
  for (const semana of semanasVendas) {
    let total = 0;
    for (const venda of semana.registros) total += venda.total;
    if (total > maiorTotal) maiorTotal = total;
  }

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
          <SemanaVendas key={semana.chave} semana={semana} maiorTotal={maiorTotal} />
        ))}

        <Text style={styles.secao}>Estoque por semana</Text>
        {!loading && semanasEstoque.length === 0 ? (
          <Text style={styles.vazio}>Não houve movimentação no estoque.</Text>
        ) : null}
        {semanasEstoque.map((semana) => (
          <SemanaEstoque key={semana.chave} semana={semana} />
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
