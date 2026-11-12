import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '../components/Header';
import Button from '../components/Button';
import FormField from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { acompanharClientes, salvarCliente } from '../services/clientes';
import { buscarOrcamento, vincularClienteAoOrcamento } from '../services/orcamentos';
import { formatarTelefone, validarCliente } from '../utils/clientes';
import { montarLinkWhatsApp, montarMensagemOrcamento } from '../utils/compartilharOrcamento';
import { enviarPdfOrcamento } from '../utils/pdfOrcamento';

export default function CompartilharOrcamento({ route, navigation }) {
  const id = route.params?.id;
  const { user } = useAuth();
  const [resultado, setResultado] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [carregandoClientes, setCarregandoClientes] = useState(true);
  const [erroClientes, setErroClientes] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const [busca, setBusca] = useState('');
  const [cadastrando, setCadastrando] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [erroAcao, setErroAcao] = useState('');
  const [aviso, setAviso] = useState('');
  const [verMensagem, setVerMensagem] = useState(false);
  const emAndamento = useRef(false);
  const listaRef = useRef(null);
  const atual = resultado?.id === id ? resultado : null;
  const orcamento = atual?.orcamento;

  useEffect(() => {
    let ativa = true;
    buscarOrcamento(id).then((dados) => {
      if (ativa) setResultado({ id, orcamento: dados, erro: dados ? '' : 'Orçamento não encontrado.' });
    }).catch(() => {
      if (ativa) setResultado({ id, erro: 'Não foi possível carregar o orçamento. Tente novamente.' });
    });

    function falhar(error) {
      if (!ativa) return;
      setCarregandoClientes(false);
      setErroClientes(error.code === 'permission-denied'
        ? 'O banco recusou a consulta de clientes. Confira sua sessão e as permissões no Firebase.'
        : 'Não foi possível carregar os clientes. Confira a conexão e tente novamente.');
    }
    let cancelar;
    try {
      cancelar = acompanharClientes((dados) => {
        if (!ativa) return;
        setClientes(dados);
        setCarregandoClientes(false);
        setErroClientes('');
      }, falhar);
    } catch (error) {
      falhar(error);
    }
    return () => { ativa = false; cancelar?.(); };
  }, [id, tentativa]);

  function tentarNovamente() {
    setResultado(null);
    setCarregandoClientes(true);
    setErroClientes('');
    setTentativa((valor) => valor + 1);
  }

  async function escolherCliente(cliente, novo = false) {
    if (emAndamento.current || !orcamento) return;
    setErroAcao('');
    setAviso('');
    try {
      if (novo) validarCliente(cliente);
      emAndamento.current = true;
      setOcupado(true);
      const escolhido = novo ? await salvarCliente(cliente, user?.uid) : cliente;
      const atualizado = await vincularClienteAoOrcamento(id, escolhido.id);
      setResultado({ id, orcamento: atualizado });
      // No celular já abre o PDF para enviar ao cliente escolhido
      if (Platform.OS !== 'web') enviarPdfOrcamento(atualizado).catch((e) => console.error('Erro ao gerar o PDF:', e));
      listaRef.current?.scrollToOffset({ offset: 0, animated: true });
      if (novo) {
        setCadastrando(false);
        setNome('');
        setTelefone('');
        setAviso(escolhido.nome !== cliente.nome.trim()
          ? `Esse telefone já estava cadastrado. Selecionado: ${escolhido.nome}.`
          : 'Cliente salvo e selecionado.');
      }
    } catch (error) {
      setErroAcao(error.code === 'permission-denied'
        ? 'O banco recusou o cadastro ou a seleção. Confira sua sessão e as permissões de clientes e orçamentos no Firebase.'
        : error.message || 'Não foi possível selecionar o cliente. Tente novamente.');
    } finally {
      emAndamento.current = false;
      setOcupado(false);
    }
  }

  let link = '';
  let contato = '';
  if (orcamento?.cliente?.id) {
    try {
      link = montarLinkWhatsApp(orcamento);
      contato = formatarTelefone(orcamento.cliente.contato);
    } catch { /* O destinatário precisa ser escolhido com telefone válido. */ }
  }

  async function abrirWhatsApp() {
    if (!link || emAndamento.current) return;
    emAndamento.current = true;
    setOcupado(true);
    setErroAcao('');
    setAviso('');
    try {
      // Sem operações de banco antes de abrir o link: preserva o clique também na web.
      await Linking.openURL(link);
      setAviso('Confira a conversa e confirme o envio no WhatsApp.');
    } catch {
      setErroAcao('Não foi possível abrir o WhatsApp. Confira se ele está disponível no aparelho ou navegador e tente novamente.');
    } finally {
      emAndamento.current = false;
      setOcupado(false);
    }
  }

  async function enviarPdf() {
    setErroAcao('');
    setAviso('');
    try {
      await enviarPdfOrcamento(orcamento);
    } catch (e) {
      console.error('Erro ao gerar o PDF:', e);
      setErroAcao('Não foi possível gerar o PDF do orçamento.');
    }
  }

  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  const digitos = busca.replace(/\D/g, '');
  const filtrados = clientes.filter((cliente) => (
    cliente.nome.toLocaleLowerCase('pt-BR').includes(termo)
    || (digitos && cliente.telefone.includes(digitos))
  ));

  return (
    <SafeAreaView style={styles.tela}>
      <Header userName={user?.displayName || user?.email?.split('@')[0] || 'Equipe'} />
      <KeyboardAvoidingView style={styles.conteudo} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listaRef}
          data={carregandoClientes || erroClientes ? [] : filtrados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={(
            <View style={styles.cabecalho}>
              <Button title="Voltar" variant="secondary" onPress={() => navigation.goBack()} disabled={ocupado} />
              <Text style={styles.titulo}>Compartilhar orçamento</Text>
              <Text style={styles.texto}>Escolha o cliente ou cadastre na hora. O orçamento será enviado como mensagem de texto.</Text>
              {!atual ? <ActivityIndicator color="#C94700" /> : null}
              {atual?.erro ? (
                <View style={styles.card}>
                  <Text style={styles.erro}>{atual.erro}</Text>
                  <Button title="Tentar novamente" variant="secondary" onPress={tentarNovamente} />
                </View>
              ) : null}
              {erroAcao ? <Text style={styles.erro} accessibilityRole="alert">{erroAcao}</Text> : null}
              {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}
              {link ? (
                <View style={styles.card}>
                  <Text style={styles.subtitulo}>Enviar para</Text>
                  <Text style={styles.nome}>{orcamento.cliente.nome}</Text>
                  <Text style={styles.texto}>{contato}</Text>
                  <Button title="Abrir WhatsApp" loading={ocupado} onPress={abrirWhatsApp} />
                  <Text style={styles.texto}>A mensagem abre preenchida. Confirme o envio no WhatsApp.</Text>
                  <Button title="Enviar PDF" variant="secondary" onPress={enviarPdf} disabled={ocupado} />
                  <Text style={styles.texto}>Ao escolher o cliente, o PDF abre sozinho. Na janela que abrir, toque em WhatsApp e escolha o cliente. Use este botão para enviar de novo.</Text>
                  <Button title={verMensagem ? 'Ocultar mensagem' : 'Ver mensagem'} variant="secondary" onPress={() => setVerMensagem((valor) => !valor)} />
                  {verMensagem ? <Text style={styles.texto} selectable>{montarMensagemOrcamento(orcamento)}</Text> : null}
                </View>
              ) : null}
              <Button
                title={cadastrando ? 'Fechar cadastro' : 'Cadastrar novo cliente'}
                variant="secondary"
                disabled={ocupado || !orcamento}
                onPress={() => { setCadastrando((valor) => !valor); setErroAcao(''); }}
              />
              {cadastrando ? (
                <View style={styles.card}>
                  <Text style={styles.subtitulo}>Novo cliente</Text>
                  <FormField label="Nome" value={nome} onChangeText={setNome} editable={!ocupado} placeholder="Nome do cliente" maxLength={120} autoCapitalize="words" />
                  <FormField label="Telefone com DDD" value={telefone} onChangeText={setTelefone} editable={!ocupado} placeholder="(11) 99999-9999" keyboardType="phone-pad" maxLength={25} />
                  <Text style={styles.texto}>Brasil (+55). Pode informar o número com ou sem pontuação.</Text>
                  <Button title="Salvar e selecionar cliente" loading={ocupado} onPress={() => escolherCliente({ nome, telefone }, true)} />
                </View>
              ) : null}
              <Text style={styles.subtitulo}>{link ? 'Ou escolha outro cliente' : 'Clientes cadastrados'}</Text>
              <FormField label="Buscar cliente" value={busca} onChangeText={setBusca} placeholder="Nome ou telefone" autoCorrect={false} />
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, orcamento?.cliente?.id === item.id && styles.selecionado]}
              onPress={() => escolherCliente(item)}
              disabled={ocupado || !orcamento}
              accessibilityRole="button"
              accessibilityLabel={`Selecionar ${item.nome}, telefone ${item.telefone}`}
              accessibilityState={{ selected: orcamento?.cliente?.id === item.id, disabled: ocupado || !orcamento }}
            >
              <Text style={styles.nome}>{item.nome}</Text>
              <Text style={styles.texto}>{formatarTelefone(item.telefone)}</Text>
              {orcamento?.cliente?.id === item.id ? <Text style={styles.aviso}>Selecionado</Text> : null}
            </TouchableOpacity>
          )}
          ListEmptyComponent={carregandoClientes ? <ActivityIndicator color="#C94700" /> : erroClientes ? (
            <View style={styles.card}>
              <Text style={styles.erro}>{erroClientes}</Text>
              <Button title="Tentar carregar clientes novamente" variant="secondary" onPress={tentarNovamente} disabled={ocupado} />
            </View>
          ) : <Text style={styles.texto}>{clientes.length ? 'Nenhum cliente encontrado. Você pode cadastrar acima.' : 'Nenhum cliente cadastrado. Cadastre o primeiro acima.'}</Text>}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#FFFFFF' },
  conteudo: { flex: 1, backgroundColor: '#F7F7F8' },
  lista: { padding: 16, paddingBottom: 32, gap: 12 },
  cabecalho: { gap: 16 },
  titulo: { fontSize: 26, fontWeight: '800', color: '#151619' },
  subtitulo: { fontSize: 18, fontWeight: '700', color: '#151619' },
  card: { padding: 16, gap: 10, borderRadius: 12, borderWidth: 1, borderColor: '#DEE0E4', backgroundColor: '#FFFFFF' },
  selecionado: { borderColor: '#C94700', backgroundColor: '#FFF3ED' },
  nome: { fontSize: 16, fontWeight: '700', color: '#151619' },
  texto: { fontSize: 14, lineHeight: 21, color: '#626975' },
  erro: { fontSize: 14, lineHeight: 21, color: '#B42318' },
  aviso: { fontSize: 14, lineHeight: 21, color: '#1C8856' },
});
