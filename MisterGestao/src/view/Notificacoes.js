import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../components/Button';
import PushOrcamentosConfig from '../components/PushOrcamentosConfig';
import { useNotificacoes } from '../context/NotificacoesContext';

export default function Notificacoes({ navigation }) {
  const { notificacoes, carregando, erro, erroLeitura, tentarNovamente, marcarComoLida } = useNotificacoes();

  function abrirOrcamento(notificacao) {
    marcarComoLida(notificacao.id);
    navigation.navigate('Orcamento', { id: notificacao.orcamentoId });
  }

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.cabecalho}>
        <Button title="Voltar" variant="secondary" onPress={() => navigation.goBack()} />
        <Text style={styles.titulo} accessibilityRole="header">Notificações</Text>
        <PushOrcamentosConfig />
      </View>

      {carregando ? <ActivityIndicator color="#C94700" accessibilityLabel="Carregando notificações" /> : null}
      {erro ? (
        <View style={styles.estado}>
          <Text style={styles.erro} accessibilityRole="alert">{erro}</Text>
          <Button title="Tentar novamente" variant="secondary" onPress={tentarNovamente} />
        </View>
      ) : null}
      {erroLeitura ? <Text style={styles.erro} accessibilityRole="alert">{erroLeitura}</Text> : null}
      {!carregando && !erro ? (
        <FlatList
          data={notificacoes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={<Text style={styles.texto}>Você está em dia com seus lembretes.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity accessibilityRole="button" style={styles.card} onPress={() => abrirOrcamento(item)}>
              <Feather name="bell" size={18} color="#C94700" />
              <View style={styles.conteudoCard}>
                <Text style={styles.subtitulo}>{item.dia === 7 ? 'Último lembrete de orçamento' : 'Orçamento em aberto'}</Text>
                <Text style={styles.texto}>O orçamento nº {item.orcamentoId} completou {item.dia === 1 ? '1 dia' : `${item.dia} dias`} em aberto.</Text>
                {item.dia === 7 ? (
                  <Text style={styles.texto}>Se continuar em aberto, será cancelado quando completar 8 dias.</Text>
                ) : null}
              </View>
              <Feather name="chevron-right" size={18} color="#626975" />
            </TouchableOpacity>
          )}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#F6F6F7' },
  cabecalho: { gap: 14, margin: 14 },
  titulo: { fontSize: 20, fontWeight: '800', color: '#202126' },
  lista: { paddingHorizontal: 14, paddingBottom: 20, gap: 8 },
  estado: { paddingHorizontal: 14, gap: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E0E1E4',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  conteudoCard: { flex: 1, gap: 4 },
  subtitulo: { color: '#202126', fontWeight: '700', fontSize: 14 },
  texto: { color: '#626975', fontSize: 13, lineHeight: 18 },
  erro: { color: '#B42318', fontSize: 13 },
});
