import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '../components/Header';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { acompanharOrcamentos } from '../services/orcamentos';

const dinheiro = (valor) => (Number(valor || 0) / 100).toLocaleString('pt-BR', {
  style: 'currency', currency: 'BRL',
});

function statusOrcamento(orcamento) {
  if (orcamento.status === 'open') {
    const hoje = new Date();
    const dataLocal = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    return orcamento.validade && orcamento.validade < dataLocal ? 'Vencido' : 'Em aberto';
  }
  return { approved: 'Aprovado', cancelled: 'Cancelado', converted: 'Convertido em venda' }[orcamento.status]
    || 'Status não informado';
}

function OrcamentoCard({ orcamento, onPress }) {
  const data = orcamento.createdAt?.toDate?.();
  const quantidade = (orcamento.itens || []).reduce((soma, item) => soma + item.quantidade, 0);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Abrir orçamento ${orcamento.id}`}
    >
      <View style={styles.linha}>
        <Text style={styles.numero} numberOfLines={1}>Nº {orcamento.id}</Text>
        <Text style={styles.status}>{statusOrcamento(orcamento)}</Text>
      </View>
      <Text style={styles.nome}>{orcamento.cliente?.nome || 'Cliente não informado'}</Text>
      {orcamento.cliente?.contato ? <Text style={styles.texto}>{orcamento.cliente.contato}</Text> : null}
      <Text style={styles.texto}>Criado em {data ? data.toLocaleDateString('pt-BR') : 'aguardando confirmação'}</Text>
      <Text style={styles.texto}>
        Validade: {orcamento.validade ? orcamento.validade.split('-').reverse().join('/') : 'Não informada'}
      </Text>
      <View style={styles.rodapeCard}>
        <Text style={styles.texto}>{quantidade} {quantidade === 1 ? 'item' : 'itens'}</Text>
        <Text style={styles.total}>{dinheiro(orcamento.total)}</Text>
        <Feather name="chevron-right" size={20} color="#626975" />
      </View>
    </TouchableOpacity>
  );
}

export default function Orcamentos({ navigation }) {
  const { user } = useAuth();
  const [orcamentos, setOrcamentos] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const focada = useIsFocused();

  useEffect(() => {
    if (!focada) return;
    let ativa = true;

    function falhar(error) {
      if (!ativa) return;
      setOrcamentos([]);
      setCarregando(false);
      setErro(error.code === 'permission-denied'
        ? 'O banco recusou a consulta. Confira sua sessão e as permissões de orçamentos no Firebase.'
        : 'Não foi possível carregar os orçamentos. Verifique a conexão e tente novamente.');
    }

    let cancelar;
    try {
      cancelar = acompanharOrcamentos((dados) => {
        if (!ativa) return;
        setOrcamentos(dados);
        setCarregando(false);
        setErro('');
      }, falhar);
    } catch (error) {
      falhar(error);
    }

    return () => {
      ativa = false;
      cancelar?.();
    };
  }, [focada, tentativa]);

  function tentarNovamente() {
    setCarregando(true);
    setErro('');
    setTentativa((valor) => valor + 1);
  }

  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  const filtrados = orcamentos.filter((orcamento) => (
    [orcamento.id, orcamento.cliente?.nome, orcamento.cliente?.contato].some((valor) => (
      String(valor || '').toLocaleLowerCase('pt-BR').includes(termo)
    ))
  ));

  return (
    <SafeAreaView style={styles.tela} edges={['top', 'left', 'right']}>
      <Header userName={user?.displayName || user?.email?.split('@')[0] || 'Equipe'} />
      <View style={styles.conteudo}>
        <View style={styles.cabecalho}>
          <Text style={styles.titulo}>Orçamentos</Text>
          <Text style={styles.texto}>
            {carregando ? 'Carregando orçamentos salvos...' : erro ? 'Consulta indisponível' : `${orcamentos.length} orçamentos salvos`}
          </Text>
          <Button title="Novo orçamento" onPress={() => navigation.navigate('Produtos')} />
          <Text style={styles.label}>Buscar orçamento</Text>
          <TextInput
            style={styles.busca}
            value={busca}
            onChangeText={setBusca}
            placeholder="Número, cliente ou contato"
            placeholderTextColor="#787B81"
            accessibilityLabel="Buscar orçamento por número, cliente ou contato"
            autoCorrect={false}
          />
        </View>
        {carregando ? (
          <View style={styles.estado}>
            <ActivityIndicator color="#C94700" />
            <Text style={styles.texto}>Carregando orçamentos...</Text>
          </View>
        ) : erro ? (
          <View style={styles.estado}>
            <Text style={styles.erro} accessibilityRole="alert">{erro}</Text>
            <Button title="Tentar novamente" variant="secondary" onPress={tentarNovamente} />
          </View>
        ) : (
          <FlatList
            data={filtrados}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <OrcamentoCard orcamento={item} onPress={() => navigation.navigate('Orcamento', { id: item.id })} />
            )}
            contentContainerStyle={styles.lista}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={(
              <View style={styles.estado}>
                <Feather name="file-text" size={32} color="#858A93" />
                <Text style={styles.nome}>
                  {orcamentos.length ? 'Nenhum orçamento encontrado.' : 'Nenhum orçamento salvo ainda.'}
                </Text>
                <Text style={styles.texto}>
                  {orcamentos.length ? 'Tente outro número, nome ou contato.' : 'Selecione os produtos e gere seu primeiro orçamento no carrinho.'}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#FFFFFF' },
  conteudo: { flex: 1, backgroundColor: '#F7F7F8' },
  cabecalho: { padding: 16, gap: 12 },
  titulo: { fontSize: 26, fontWeight: '800', color: '#151619' },
  texto: { fontSize: 14, lineHeight: 21, color: '#626975' },
  label: { fontSize: 14, fontWeight: '500', color: '#797C82' },
  busca: { minHeight: 48, paddingHorizontal: 13, borderRadius: 12, borderWidth: 1, borderColor: '#DEE0E4', backgroundColor: '#FFFFFF', color: '#151619', fontSize: 14 },
  lista: { paddingHorizontal: 16, paddingBottom: 24, gap: 12, flexGrow: 1 },
  card: { padding: 16, gap: 8, borderRadius: 12, borderWidth: 1, borderColor: '#DEE0E4', backgroundColor: '#FFFFFF' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  numero: { flex: 1, fontSize: 12, color: '#626975', minWidth: 120 },
  status: { fontSize: 12, fontWeight: '600', color: '#C94700', backgroundColor: '#FFF0E6', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  nome: { fontSize: 16, fontWeight: '700', color: '#151619' },
  rodapeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: '#E9EAED', paddingTop: 12, marginTop: 4 },
  total: { flex: 1, textAlign: 'right', fontSize: 21, fontWeight: '800', color: '#C94700' },
  estado: { padding: 24, gap: 12, alignItems: 'center' },
  erro: { fontSize: 14, lineHeight: 21, color: '#B42318', textAlign: 'center' },
});
