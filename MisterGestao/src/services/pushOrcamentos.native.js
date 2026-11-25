import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { AppState, Platform } from 'react-native';
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth } from './auth';
import { db } from './firebase';

const CHAVE = 'mistergestao:push-orcamentos';
const CANAL = 'orcamentos';
const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
export const ambientePush = Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  ? 'expo-go'
  : projectId ? 'disponivel' : 'sem-projeto';

let uidSuspenso = null;
let filaDeVinculo = Promise.resolve();

async function lerVinculo() {
  const dados = await AsyncStorage.getItem(CHAVE);
  return dados ? JSON.parse(dados) : null;
}

function referenciaToken(token) {
  return doc(db, 'dispositivosPush', token);
}

function entrarNaFila(operacao) {
  const pendente = filaDeVinculo.then(operacao);
  filaDeVinculo = pendente.catch(() => {});
  return pendente;
}

async function aguardarBanco(operacao, tempo) {
  let timer;
  try {
    return await Promise.race([operacao, new Promise((_, rejeitar) => {
      timer = setTimeout(() => rejeitar(new Error('O cadastro do aparelho não foi confirmado.')), tempo);
    })]);
  } finally {
    clearTimeout(timer);
  }
}

async function registrarAparelho(uid, token) {
  return entrarNaFila(async () => {
    if (auth.currentUser?.uid !== uid || uidSuspenso === uid) return 'inativo';
    const anterior = await lerVinculo();
    const dados = { uid, token, ativo: false };
    await AsyncStorage.setItem(CHAVE, JSON.stringify(dados));
    await aguardarBanco(setDoc(referenciaToken(token), { uid, vinculadoEm: serverTimestamp() }), 8000);
    await AsyncStorage.setItem(CHAVE, JSON.stringify({ ...dados, ativo: true }));
    if (anterior?.uid === uid && anterior.token !== token) {
      deleteDoc(referenciaToken(anterior.token)).catch(() => {});
    }
    return 'ativo';
  });
}

export async function desvincularPushDoAparelho(uid) {
  if (!uid || ambientePush !== 'disponivel') return;
  uidSuspenso = uid;
  await entrarNaFila(async () => {
    const vinculo = await lerVinculo();
    if (vinculo?.uid !== uid) return;
    try {
      await aguardarBanco(deleteDoc(referenciaToken(vinculo.token)), 2500);
    } finally {
      await AsyncStorage.removeItem(CHAVE);
    }
  }).catch(() => {});
}

export function retomarPushDaConta(uid) {
  if (uidSuspenso === uid) uidSuspenso = null;
}

export async function consultarPushNoAparelho(uid) {
  if (ambientePush !== 'disponivel') return ambientePush;
  const Notifications = await import('expo-notifications');
  const [vinculo, permissao] = await Promise.all([lerVinculo(), Notifications.getPermissionsAsync()]);
  if (!permissao.granted && !permissao.canAskAgain) return 'bloqueado';
  return vinculo?.uid === uid && vinculo.ativo && permissao.granted ? 'ativo' : 'inativo';
}

async function vincularAparelho(uid, { solicitarPermissao = false, devicePushToken } = {}) {
  if (ambientePush !== 'disponivel') return ambientePush;
  if (auth.currentUser?.uid !== uid || uidSuspenso === uid) return 'inativo';
  const Notifications = await import('expo-notifications');
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Lembretes de orçamentos',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
  let permissao = await Notifications.getPermissionsAsync();
  if (!permissao.granted && permissao.canAskAgain && solicitarPermissao) {
    permissao = await Notifications.requestPermissionsAsync();
  }
  if (!permissao.granted) return permissao.canAskAgain ? 'inativo' : 'bloqueado';
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId, devicePushToken });
  return registrarAparelho(uid, token);
}

export function ativarPushNoAparelho(uid) {
  return vincularAparelho(uid, { solicitarPermissao: true });
}

export function iniciarPushOrcamentos(uid) {
  if (ambientePush !== 'disponivel') return undefined;
  retomarPushDaConta(uid);
  let ativo = true;
  let atualizando = false;
  let listenerToken;

  async function atualizar(devicePushToken) {
    if (atualizando || uidSuspenso === uid) return;
    atualizando = true;
    try {
      const vinculo = await lerVinculo();
      if (!ativo || vinculo?.uid !== uid) return;
      await vincularAparelho(uid, { devicePushToken });
    } catch {
      // O próximo retorno ao app pode renovar a inscrição.
    } finally {
      atualizando = false;
    }
  }

  import('expo-notifications').then((Notifications) => {
    if (!ativo) return;
    Notifications.setNotificationHandler({
      handleNotification: async (notificacao) => {
        const dados = notificacao.request.content.data;
        const exibir = dados?.tipo === 'orcamento' && dados.uid === auth.currentUser?.uid && dados.uid !== uidSuspenso;
        return {
          shouldShowBanner: exibir,
          shouldShowList: exibir,
          shouldPlaySound: exibir,
          shouldSetBadge: false,
        };
      },
    });
    listenerToken = Notifications.addPushTokenListener((token) => { atualizar(token); });
    atualizar();
  }).catch(() => {});
  const listenerApp = AppState.addEventListener('change', (estado) => {
    if (estado === 'active') atualizar();
  });
  return () => {
    ativo = false;
    listenerToken?.remove();
    listenerApp.remove();
  };
}

export function acompanharToquesPush(uid, abrirAvisos) {
  if (ambientePush !== 'disponivel') return undefined;
  let ativo = true;
  let listener;
  import('expo-notifications').then((Notifications) => {
    if (!ativo) return;
    function tratarResposta(resposta) {
      const dados = resposta?.notification.request.content.data;
      if (dados?.tipo !== 'orcamento' || resposta.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
      if (dados.uid === uid && !abrirAvisos()) return;
      Notifications.clearLastNotificationResponse();
    }
    listener = Notifications.addNotificationResponseReceivedListener(tratarResposta);
    tratarResposta(Notifications.getLastNotificationResponse());
  }).catch(() => {});
  return () => {
    ativo = false;
    listener?.remove();
  };
}
