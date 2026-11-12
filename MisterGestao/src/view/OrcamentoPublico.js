import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import { buscarOrcamento } from '../services/orcamentos';
import { enviarPdfOrcamento, montarHtmlOrcamento } from '../utils/pdfOrcamento';

// Página aberta pelo cliente no navegador (só web)
export default function OrcamentoPublico({ id }) {
  const [orcamento, setOrcamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const carregar = async () => {
      try {
        const dados = await buscarOrcamento(id);
        if (dados) setOrcamento(dados);
        else setErro('Orçamento não encontrado.');
      } catch (e) {
        console.error('Erro ao abrir o orçamento:', e);
        setErro('Não foi possível abrir o orçamento.');
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [id]);

  if (loading || erro) {
    return (
      <View style={styles.centro}>
        {loading ? <ActivityIndicator color="#C94700" /> : <Text style={styles.erro}>{erro}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.tela}>
      <iframe title="Orçamento" srcDoc={montarHtmlOrcamento(orcamento)} style={{ flex: 1, border: 0 }} />
      <View style={styles.botao}>
        <Button title="Baixar PDF" onPress={() => enviarPdfOrcamento(orcamento)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#FFFFFF' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  erro: { color: '#B42318', fontSize: 16 },
  botao: { padding: 16, borderTopWidth: 1, borderTopColor: '#EFF0F2' },
});
