const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const requireFunctions = createRequire(require.resolve('../functions/package.json'));
const { initializeApp, deleteApp } = requireFunctions('firebase-admin/app');
const { getFirestore, Timestamp } = requireFunctions('firebase-admin/firestore');
const clientApp = require('firebase/app');
const client = require('firebase/firestore');
const { acompanharPrazosOrcamentos } = require('../functions/prazosOrcamentos');
const { processarEnviosPush } = require('../functions/pushOrcamentos');

const host = process.env.FIRESTORE_EMULATOR_HOST;
if (!host || !/^(127\.0\.0\.1|localhost):\d+$/.test(host)) {
  throw new Error('Execute com o Firestore Emulator local.');
}

const projectId = 'demo-mistergestao';
const app = initializeApp({ projectId });
const db = getFirestore(app);
const loja = db.doc('lojas/mister-motoplace');
const orcamentos = loja.collection('orcamentos');
const vendas = loja.collection('vendas');
const uid = 'autor-teste-prazos';
const alertas = db.collection('usuarios').doc(uid).collection('notificacoesOrcamentos');
const dia = 24 * 60 * 60 * 1000;
const inicio = Date.now() - 9 * dia;
const dados = { status: 'open', createdAt: Timestamp.fromMillis(inicio), createdBy: uid, total: 500 };
const principal = orcamentos.doc('teste-prazos');
const sessoes = [];

function abrirSessao(nome, userId) {
  const sessao = clientApp.initializeApp({ projectId, apiKey: 'demo' }, nome);
  const firestore = client.getFirestore(sessao);
  const [hostname, port] = host.split(':');
  client.connectFirestoreEmulator(firestore, hostname, Number(port), userId ? { mockUserToken: { sub: userId } } : {});
  sessoes.push({ sessao, firestore });
  return firestore;
}

const negar = (promise) => assert.rejects(promise, { code: 'permission-denied' });

async function verificarPrazos() {
  await principal.set(dados);
  await orcamentos.doc('prazos-vendido').set({ ...dados, status: 'converted' });
  await orcamentos.doc('prazos-cancelado-manualmente').set({ ...dados, status: 'cancelled', cancelledBy: uid });
  await orcamentos.doc('prazos-com-venda').set(dados);
  await vendas.doc('prazos-com-venda').set({ orcamentoId: 'prazos-com-venda' });
  await orcamentos.doc('prazos-sem-data').set({ status: 'open', createdBy: uid });

  assert.deepEqual(await acompanharPrazosOrcamentos(db, inicio + dia - 1), { lembretes: 0, cancelados: 0 });
  const simultaneos = await Promise.all([
    acompanharPrazosOrcamentos(db, inicio + dia),
    acompanharPrazosOrcamentos(db, inicio + dia),
  ]);
  assert.equal(simultaneos.reduce((soma, item) => soma + item.lembretes, 0), 1);
  assert.deepEqual(await acompanharPrazosOrcamentos(db, inicio + 5 * dia - 1), { lembretes: 0, cancelados: 0 });
  assert.deepEqual(await acompanharPrazosOrcamentos(db, inicio + 5 * dia), { lembretes: 1, cancelados: 0 });
  assert.deepEqual(await acompanharPrazosOrcamentos(db, inicio + 7 * dia), { lembretes: 1, cancelados: 0 });
  assert.deepEqual(await acompanharPrazosOrcamentos(db, inicio + 8 * dia - 1), { lembretes: 0, cancelados: 0 });
  assert.equal((await principal.get()).data().status, 'open');
  assert.deepEqual(await acompanharPrazosOrcamentos(db, inicio + 8 * dia), { lembretes: 0, cancelados: 1 });
  assert.deepEqual(await acompanharPrazosOrcamentos(db, inicio + 9 * dia), { lembretes: 0, cancelados: 0 });
  assert.deepEqual((await alertas.get()).docs.map((snapshot) => snapshot.data().dia).sort(), [1, 5, 7]);
  const cancelado = (await principal.get()).data();
  assert.equal(cancelado.status, 'cancelled');
  assert.equal(cancelado.cancelledBy, 'system');
  assert.equal(cancelado.total, dados.total);
  assert.ok(cancelado.cancelledAt instanceof Timestamp);
  assert.equal((await vendas.doc(principal.id).get()).exists, false);
  assert.equal((await orcamentos.doc('prazos-vendido').get()).data().status, 'converted');
  assert.equal((await orcamentos.doc('prazos-cancelado-manualmente').get()).data().cancelledBy, uid);
  assert.equal((await orcamentos.doc('prazos-com-venda').get()).data().status, 'open');
  assert.equal((await orcamentos.doc('prazos-sem-data').get()).data().status, 'open');
  console.log('OK — prazos de 1, 5, 7 e 8 dias, repetição e orçamentos protegidos');
}

async function verificarPermissoes() {
  const autor = abrirSessao('prazos-autor', uid);
  const outraConta = abrirSessao('prazos-outra-conta', 'outra-conta');
  const visitante = abrirSessao('prazos-visitante');
  const aviso = (firestore) => client.doc(firestore, alertas.path, `${principal.id}_1`);
  const pendentes = client.query(client.collection(autor, alertas.path),
    client.where('lida', '==', false), client.orderBy('createdAt', 'desc'), client.limit(50));
  assert.equal((await client.getDocs(pendentes)).size, 3);
  await negar(client.getDoc(aviso(outraConta)));
  await negar(client.getDoc(aviso(visitante)));
  await negar(client.getDocs(client.collection(outraConta, alertas.path)));
  await negar(client.updateDoc(aviso(outraConta), { lida: true }));
  await negar(client.updateDoc(aviso(autor), { lida: true, orcamentoId: 'adulterado' }));
  await negar(client.setDoc(client.doc(autor, alertas.path, 'falso'), { lida: false }));
  await client.updateDoc(aviso(autor), { lida: true });
  await client.updateDoc(aviso(autor), { lida: true });
  await negar(client.updateDoc(aviso(autor), { lida: false }));
  assert.equal((await client.getDocs(pendentes)).size, 2);

  const antigo = orcamentos.doc('prazos-venda-apos-limite');
  await antigo.set(dados);
  const lote = client.writeBatch(autor);
  lote.update(client.doc(autor, antigo.path), { status: 'converted' });
  lote.set(client.doc(autor, vendas.path, antigo.id), {
    orcamentoId: antigo.id, cliente: '', total: dados.total, createdAt: client.serverTimestamp(), createdBy: uid,
  });
  await negar(lote.commit());
  assert.equal((await antigo.get()).data().status, 'open');
  console.log('OK — lembretes privados, leitura idempotente e venda bloqueada aos 8 dias');
}

async function verificarAtrasoEPaginacao() {
  const recente = orcamentos.doc('prazos-lembrete-atrasado');
  await recente.set({ ...dados, createdAt: Timestamp.fromMillis(inicio + 2 * dia) });
  const lote = db.batch();
  for (let i = 0; i < 51; i++) {
    lote.set(orcamentos.doc(`prazos-antigo-${i}`), dados);
  }
  await lote.commit();
  assert.deepEqual(await acompanharPrazosOrcamentos(db, inicio + 9 * dia), { lembretes: 1, cancelados: 52 });
  assert.ok((await alertas.doc(`${recente.id}_7`).get()).exists);
  assert.equal((await alertas.doc(`${recente.id}_5`).get()).exists, false);
  assert.deepEqual(await acompanharPrazosOrcamentos(db, inicio + 9 * dia), { lembretes: 0, cancelados: 0 });
  console.log('OK — orçamentos antigos, várias páginas e lembrete mais recente após atraso');
}

async function verificarPush() {
  const uidPush = 'autor-push';
  const autor = abrirSessao('push-autor', uidPush);
  const outraSessao = abrirSessao('push-outra-conta', 'outra-conta');
  const aparelhos = db.collection('dispositivosPush');
  const tokenA = 'ExponentPushToken[aparelho-A]';
  const tokenB = 'ExpoPushToken[aparelho-B]';
  const tokenDeOutraConta = 'ExpoPushToken[aparelho-C]';
  const registrarAparelho = (firestore, token, uid) => client.setDoc(client.doc(firestore, aparelhos.path, token), {
    uid, vinculadoEm: client.serverTimestamp(),
  });
  await registrarAparelho(autor, tokenA, uidPush);
  await registrarAparelho(autor, tokenB, uidPush);
  await registrarAparelho(outraSessao, tokenDeOutraConta, 'outra-conta');
  await negar(registrarAparelho(outraSessao, tokenB, uidPush));
  await negar(registrarAparelho(autor, 'invalido', uidPush));
  await negar(client.getDoc(client.doc(autor, aparelhos.path, tokenA)));
  await negar(client.getDocs(client.collection(outraSessao, aparelhos.path)));
  await negar(client.deleteDoc(client.doc(outraSessao, aparelhos.path, tokenA)));

  const orcamento = orcamentos.doc('teste-push');
  const convertido = orcamentos.doc('teste-push-convertido');
  const agora = Date.now();
  const dadosPush = { ...dados, createdBy: uidPush, createdAt: Timestamp.fromMillis(agora - 7 * dia) };
  await Promise.all([orcamento.set(dadosPush), convertido.set(dadosPush)]);
  assert.deepEqual(await acompanharPrazosOrcamentos(db, agora), { lembretes: 2, cancelados: 0 });
  await convertido.update({ status: 'converted' });

  const fila = db.collection('enviosPushOrcamentos');
  const envio = fila.doc(`${orcamento.id}_7`);
  await negar(client.getDoc(client.doc(autor, envio.path)));
  await negar(client.deleteDoc(client.doc(autor, envio.path)));

  const chamadas = [];
  let retornarFalha = true;
  let tentativaB = 0;
  const sucesso = (data) => ({ ok: true, json: async () => ({ data }) });
  async function fetchExpo(url, options) {
    const corpo = JSON.parse(options.body);
    chamadas.push(corpo);
    if (url.endsWith('/getReceipts')) {
      return sucesso(Object.fromEntries(corpo.ids.map((id) => [id, {
        status: 'error', details: { error: 'DeviceNotRegistered' },
      }])));
    }
    if (retornarFalha) return { ok: false, status: 503 };
    return sucesso(corpo.map(({ to }) => {
      if (to === tokenB && tentativaB++ === 0) {
        return { status: 'error', details: { error: 'MessageRateExceeded' } };
      }
      return { status: 'ok', id: to === tokenA ? 'ticket-a' : 'ticket-b' };
    }));
  }

  const intervalo = 15 * 60 * 1000 + 20;
  let agoraEnvio = Date.now() + 50;
  const executarPush = () => processarEnviosPush(db, { fetchExpo, agora: agoraEnvio });
  await executarPush();
  assert.equal(chamadas.length, 1);
  assert.ok((await envio.get()).exists);
  assert.equal((await fila.doc(`${convertido.id}_7`).get()).exists, false);
  retornarFalha = false;
  agoraEnvio += intervalo;
  await Promise.all([executarPush(), executarPush()]);
  assert.equal(chamadas.length, 2);
  assert.deepEqual(chamadas[1].map(({ to }) => to).sort(), [tokenA, tokenB].sort());
  assert.deepEqual(chamadas[1][0].data, { tipo: 'orcamento', uid: uidPush });
  assert.equal(chamadas[1][0].channelId, 'orcamentos');
  assert.match(chamadas[1][0].body, /8 dias/);
  assert.equal(chamadas[0][0].collapseId, chamadas[1][0].collapseId);

  await registrarAparelho(outraSessao, tokenA, 'outra-conta');
  agoraEnvio += intervalo;
  await executarPush();
  assert.equal(chamadas.length, 4);
  assert.deepEqual(chamadas[2].map(({ to }) => to), [tokenB]);
  assert.deepEqual(chamadas[3].ids, ['ticket-a']);
  assert.equal((await aparelhos.doc(tokenA).get()).data().uid, 'outra-conta');
  agoraEnvio += intervalo;
  await executarPush();
  assert.deepEqual(chamadas[4].ids, ['ticket-b']);
  assert.equal((await aparelhos.doc(tokenB).get()).exists, false);
  assert.equal((await envio.get()).exists, false);
  await client.deleteDoc(client.doc(outraSessao, aparelhos.path, tokenA));
  assert.equal((await aparelhos.doc(tokenA).get()).exists, false);
  console.log('OK — push ao dono, reenvio seletivo, concorrência, recibos e troca de conta');
}

async function main() {
  await verificarPrazos();
  await verificarPermissoes();
  await verificarAtrasoEPaginacao();
  await verificarPush();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await Promise.all(sessoes.map(async ({ sessao, firestore }) => {
    await client.terminate(firestore);
    await clientApp.deleteApp(sessao);
  }));
  await db.terminate();
  await deleteApp(app);
});
