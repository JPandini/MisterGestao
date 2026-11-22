import { useEffect, useRef, useState } from 'react';
import { AppState, Linking, StyleSheet, Text, View } from 'react-native';

import Button from './Button';
import { useAuth } from '../context/AuthContext';
import { ativarPushNoAparelho, consultarPushNoAparelho, ambientePush } from '../services/pushOrcamentos.native';

const MENSAGENS = {
  'expo-go': 'Os avisos no celular precisam de uma versão instalada do MisterGestão.',
  'sem-projeto': 'Os avisos no celular ainda precisam ser configurados nesta versão.',
  ativo: 'Avisos no celular ativados.',
  bloqueado: 'Permita as notificações nos ajustes do celular para receber os lembretes.',
};

export default function PushOrcamentosConfig() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [estado, setEstado] = useState(ambientePush);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const ativando = useRef(false);

  useEffect(() => {
    if (!uid || ambientePush !== 'disponivel') return undefined;
    let aberta = true;
    function consultar() {
      consultarPushNoAparelho(uid).then((valor) => {
        if (aberta && !ativando.current) setEstado(valor);
      }).catch(() => {
        if (aberta) setEstado('inativo');
      });
    }
    consultar();
    const listener = AppState.addEventListener('change', (valor) => {
      if (valor === 'active') consultar();
    });
    return () => {
      aberta = false;
      listener.remove();
    };
  }, [uid]);

  async function ativar() {
    if (!uid || ativando.current) return;
    ativando.current = true;
    setSalvando(true);
    setErro('');
    try {
      if (estado === 'bloqueado') await Linking.openSettings();
      else setEstado(await ativarPushNoAparelho(uid));
    } catch {
      setErro('Não foi possível ativar os avisos. Confira sua conexão e tente novamente.');
    } finally {
      ativando.current = false;
      setSalvando(false);
    }
  }

  const podeAtivar = ambientePush === 'disponivel' && estado !== 'ativo' && estado !== 'disponivel';
  return (
    <View style={styles.configuracao}>
      {MENSAGENS[estado] ? <Text style={styles.texto}>{MENSAGENS[estado]}</Text> : null}
      {podeAtivar ? <Button
        title={estado === 'bloqueado' ? 'Abrir ajustes do celular' : 'Ativar avisos no celular'}
        variant="secondary"
        onPress={ativar}
        disabled={salvando}
      /> : null}
      {erro ? <Text style={styles.erro} accessibilityRole="alert">{erro}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  configuracao: { gap: 8 },
  texto: { color: '#626975', fontSize: 13, lineHeight: 18 },
  erro: { color: '#B42318', fontSize: 13 },
});
