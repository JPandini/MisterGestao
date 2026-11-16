import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import { buscarOrcamento } from '../services/orcamentos';
import { enviarPdfOrcamento, montarHtmlOrcamento } from '../utils/pdfOrcamento';

// Página que o cliente abre pelo link do WhatsApp (só no navegador, sem login)
export default function OrcamentoPublico({ id }) {
  const [orcamento, setOrcamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  // Busca o orçamento quando a página abre
  useEffect(() => {
    const carregar = async () => {
      try {
        const dados = await buscarOrcamento(id);
        if (dados) {
          setOrcamento(dados);
        } else {
          setErro('Orçamento não encontrado.');
        }
      } catch (e) {
        console.error('Erro ao abrir o orçamento:', e);
        setErro('Não foi possível abrir o orçamento.');
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color="#C94700" />
      </View>
    );
  }

  if (erro) {
    return (
      <View style={styles.centro}>
        <Text style={styles.erro}>{erro}</Text>
      </View>
    );
  }

  return (
    <View style={styles.tela}>
      {/* Mostra o mesmo HTML usado no PDF */}
      <iframe title="Orçamento" srcDoc={montarHtmlOrcamento(orcamento)} style={{ flex: 1, border: 0 }} />
      <View style={styles.rodape}>
        <Button title="Baixar PDF" onPress={() => enviarPdfOrcamento(orcamento)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#FFFFFF' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  erro: { color: '#B42318', fontSize: 16 },
  rodape: { padding: 16, borderTopWidth: 1, borderTopColor: '#EFF0F2' },
});
