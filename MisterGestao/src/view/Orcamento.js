import { useEffect, useRef, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import Header from '../components/Header';
import Button from '../components/Button';
import { acompanharOrcamento, buscarOrcamento, cancelarOrcamento } from '../services/orcamentos';
import { useAuth } from '../context/AuthContext';
import { enviarPdfOrcamento } from '../utils/pdfOrcamento';
import { statusOrcamento } from '../utils/orcamento';

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
  const focada = useIsFocused();
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [erroPdf, setErroPdf] = useState('');
  const pdfEmAndamento = useRef(false);
  const [cancelamento, setCancelamento] = useState(null);
  const cancelamentoAtual = cancelamento?.id === id ? cancelamento : null;
  const cancelando = useRef(false);

  async function confirmarCancelamento() {
    if (cancelando.current || !cancelamentoAtual?.confirmando || orcamento?.status !== 'open') return;
    cancelando.current = true;
    setCancelamento({ id, confirmando: true, salvando: true });
    try {
      const dados = await cancelarOrcamento(id, user?.uid);
      setResultado((current) => current?.id === id ? { id, orcamento: dados, mensagem: '' } : current);
      setCancelamento(null);
    } catch (error) {
      setCancelamento({ id, confirmando: true, erro: error.code === 'permission-denied'
        ? 'O Firebase bloqueou o cancelamento. Publique as regras atualizadas e tente novamente.'
        : error.message || 'Não foi possível cancelar. Confira sua conexão e tente novamente.' });
      const dados = await buscarOrcamento(id).catch(() => null);
      if (dados) setResultado((current) => current?.id === id ? { id, orcamento: dados, mensagem: '' } : current);
    } finally {
      cancelando.current = false;
    }
  }

  async function abrirPdf() {
    if (!orcamento || pdfEmAndamento.current) return;
    pdfEmAndamento.current = true;
    setGerandoPdf(true);
    setErroPdf('');
    try {
      await enviarPdfOrcamento(orcamento);
    } catch (error) {
      setErroPdf(error.message || 'Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      pdfEmAndamento.current = false;
      setGerandoPdf(false);
    }
  }

  useEffect(() => {
    if (!focada || !id) return;
    return acompanharOrcamento(id,
      (dados) => {
        setResultado({ id, orcamento: dados, mensagem: dados ? '' : 'Orçamento não encontrado.' });
      },
      () => {
        setResultado({ id, orcamento: null, mensagem: 'Não foi possível carregar o orçamento. Tente abrir novamente.' });
      }
    );
  }, [id, focada]);

  return (
    <SafeAreaView style={styles.tela}>
      <Header userName={user?.displayName || user?.email?.split('@')[0] || 'Equipe'} />

      <ScrollView contentContainerStyle={styles.conteudo}>
        <Button title="Voltar" variant="secondary" onPress={() => navigation.goBack()} disabled={cancelamentoAtual?.salvando} />
        <Text style={styles.titulo}>Orçamento</Text>

        {mensagem ? <Text style={styles.texto}>{id ? mensagem : 'Orçamento não encontrado.'}</Text> : null}

        {orcamento ? (
          <View style={styles.card}>
            <Text style={styles.nome}>Mister MotoPlace</Text>
            <Text style={styles.texto}>Número: {orcamento.id}</Text>
            <Text style={styles.nome}>{statusOrcamento(orcamento)}</Text>
            {orcamento.status === 'cancelled' ? (
              <Text style={styles.erro}>
                {orcamento.cancelledBy === 'system'
                  ? 'Cancelado automaticamente após 8 dias em aberto.'
                  : 'Este orçamento foi cancelado e não pode ser convertido em venda.'}
              </Text>
            ) : null}

            <Text style={styles.nome}>{orcamento.cliente?.nome || 'Cliente não informado'}</Text>
            {orcamento.cliente?.contato ? (
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
            <Button title="Gerar / compartilhar PDF" variant="secondary" onPress={abrirPdf} loading={gerandoPdf} disabled={gerandoPdf || cancelamentoAtual?.salvando} />
            {erroPdf ? <Text style={styles.erro} accessibilityRole="alert">{erroPdf}</Text> : null}
            <Button title="Compartilhar pelo WhatsApp" disabled={cancelamentoAtual?.salvando} onPress={() => navigation.navigate('CompartilharOrcamento', { id })} />
            {orcamento.status === 'open' ? (
              cancelamentoAtual?.confirmando ? (
                <View style={styles.confirmacao}>
                  <Text style={styles.nome}>Cancelar este orçamento?</Text>
                  <Text style={styles.texto}>Ele continuará no histórico como cancelado. O estoque não será alterado.</Text>
                  {cancelamentoAtual.erro ? <Text style={styles.erro} accessibilityRole="alert">{cancelamentoAtual.erro}</Text> : null}
                  <Button title="Manter orçamento" variant="secondary" disabled={cancelamentoAtual.salvando} onPress={() => setCancelamento(null)} />
                  <Button title="Confirmar cancelamento" style={styles.botaoCancelar} loading={cancelamentoAtual.salvando} onPress={confirmarCancelamento} />
                </View>
              ) : <Button title="Cancelar orçamento" variant="secondary" textStyle={styles.erro} disabled={gerandoPdf}
                onPress={() => setCancelamento({ id, confirmando: true })} />
            ) : null}
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
  erro: { fontSize: 14, color: '#B42318', lineHeight: 21 },
  confirmacao: { padding: 14, gap: 12, borderWidth: 1, borderColor: '#F2B8B5', backgroundColor: '#FFF5F4', borderRadius: 10 },
  botaoCancelar: { backgroundColor: '#B42318' },
  item: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: '#E9EAED', paddingTop: 16 },
  descricao: { flex: 1, gap: 4 },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  total: { fontSize: 22, fontWeight: '800', color: '#C94700' },
});
