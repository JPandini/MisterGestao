const { createHash } = require('node:crypto');
const { Timestamp } = require('firebase-admin/firestore');

const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push';
const INTERVALO_MS = 15 * 60 * 1000;
const VALIDADE_RECIBO_MS = 24 * 60 * 60 * 1000;

function montarMensagem(envio, id, to) {
  const idade = envio.dia === 1 ? '1 dia' : `${envio.dia} dias`;
  const identificador = createHash('sha256').update(id).digest('hex').slice(0, 32);
  return {
    to,
    title: envio.dia === 7 ? 'MisterGestão · último lembrete' : 'MisterGestão · orçamento em aberto',
    body: envio.dia === 7
      ? 'Um orçamento completou 7 dias. Se continuar em aberto, será cancelado ao completar 8 dias.'
      : `Um orçamento seu completou ${idade} em aberto.`,
    data: { tipo: 'orcamento', uid: envio.uid },
    sound: 'default',
    channelId: 'orcamentos',
    expiration: Math.floor(envio.expiraEm.toMillis() / 1000),
    collapseId: identificador,
    tag: identificador,
  };
}

async function consultarExpo(caminho, dados, fetchExpo) {
  const resposta = await fetchExpo(`${EXPO_PUSH_API}/${caminho}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(dados),
    signal: AbortSignal.timeout(10000),
  });
  if (!resposta.ok) {
    if (resposta.status === 429 || resposta.status >= 500) {
      throw new Error(`Serviço de push indisponível (HTTP ${resposta.status}).`);
    }
    console.error('Expo recusou a solicitação de push', caminho, resposta.status);
    return null;
  }
  return (await resposta.json()).data;
}

async function removerTokenInvalido(db, entrega) {
  try {
    await db.collection('dispositivosPush').doc(entrega.token).delete({ lastUpdateTime: entrega.registro });
  } catch (error) {
    // Um novo login pode ter registrado novamente o aparelho desde o envio.
    if (error.code !== 5 && error.code !== 9) throw error;
  }
}

async function enviarParaAparelhos(db, ref, aviso, entregas, fetchExpo, agora) {
  if (aviso.expiraEm.toMillis() <= agora) return true;
  const orcamento = (await db.collection('lojas').doc('mister-motoplace')
    .collection('orcamentos').doc(aviso.orcamentoId).get()).data();
  if (orcamento?.status !== 'open' || orcamento.createdBy !== aviso.uid || orcamento.reminderDay !== aviso.dia) return true;

  const jaProcessados = new Set(entregas.map(({ token }) => token));
  const aparelhos = await db.collection('dispositivosPush').where('uid', '==', aviso.uid).get();
  const pendentes = aparelhos.docs.filter((aparelho) => !jaProcessados.has(aparelho.id));
  let repetir = false;

  for (let i = 0; i < pendentes.length; i += 100) {
    const lote = pendentes.slice(i, i + 100);
    const tickets = await consultarExpo('send', lote.map(({ id }) => montarMensagem(aviso, ref.id, id)), fetchExpo);
    if (tickets === null) return true;
    if (!Array.isArray(tickets) || tickets.length !== lote.length) throw new Error('Resposta de envio do Expo incompleta.');

    for (const [indice, ticket] of tickets.entries()) {
      const { id: token, updateTime: registro } = lote[indice];
      const erro = ticket.details?.error;
      const entrega = { token, registro };
      if (ticket.status === 'ok' && ticket.id) {
        entrega.recibo = ticket.id;
        entrega.enviadaEm = Timestamp.fromMillis(agora);
      } else if (erro === 'MessageRateExceeded' || !erro) {
        repetir = true;
        continue;
      } else if (erro === 'DeviceNotRegistered') {
        await removerTokenInvalido(db, entrega);
      } else {
        console.error('Expo recusou um aviso', erro);
      }
      entregas.push(entrega);
    }
    await ref.update({ entregas });
  }
  return !repetir;
}

async function atualizarRecibos(db, entregas, fetchExpo, agora) {
  const pendentes = entregas.filter(({ recibo, enviadaEm }) => (
    recibo && enviadaEm.toMillis() + VALIDADE_RECIBO_MS > agora
  ));
  const aguardar = new Set(pendentes.map(({ recibo }) => recibo));
  const consultar = pendentes.filter(({ enviadaEm }) => enviadaEm.toMillis() + INTERVALO_MS <= agora);
  for (let i = 0; i < consultar.length; i += 300) {
    const lote = consultar.slice(i, i + 300);
    const recibos = await consultarExpo('getReceipts', { ids: lote.map(({ recibo }) => recibo) }, fetchExpo);
    for (const entrega of lote) {
      const recibo = recibos?.[entrega.recibo];
      if (!recibo && recibos !== null) continue;
      aguardar.delete(entrega.recibo);
      const erro = recibo?.details?.error;
      if (erro === 'DeviceNotRegistered') await removerTokenInvalido(db, entrega);
      else if (erro) console.error('A entrega de um aviso falhou', erro);
    }
  }
  return entregas.map(({ token, registro, recibo, enviadaEm }) => (
    aguardar.has(recibo) ? { token, registro, recibo, enviadaEm } : { token, registro }
  ));
}

async function processarEnvio(db, ref, fetchExpo, agora) {
  const aviso = await db.runTransaction(async (transacao) => {
    const dados = (await transacao.get(ref)).data();
    if (!dados || dados.processarEm.toMillis() > agora) return null;
    transacao.update(ref, { processarEm: Timestamp.fromMillis(agora + INTERVALO_MS) });
    return dados;
  });
  if (!aviso) return;

  const entregas = aviso.entregas || [];
  const envioConcluido = aviso.envioConcluido || await enviarParaAparelhos(db, ref, aviso, entregas, fetchExpo, agora);
  const atualizadas = await atualizarRecibos(db, entregas, fetchExpo, agora);
  if (envioConcluido && !atualizadas.some(({ recibo }) => recibo)) {
    await ref.delete();
  } else {
    await ref.update({ envioConcluido, entregas: atualizadas });
  }
}

async function processarEnviosPush(db, { fetchExpo = fetch, agora = Date.now() } = {}) {
  const consulta = db.collection('enviosPushOrcamentos')
    .where('processarEm', '<=', Timestamp.fromMillis(agora)).orderBy('processarEm').limit(60);
  let pagina = await consulta.get();
  while (!pagina.empty) {
    for (let i = 0; i < pagina.size; i += 6) {
      const resultados = await Promise.allSettled(pagina.docs.slice(i, i + 6).map(({ ref }) => (
        processarEnvio(db, ref, fetchExpo, agora)
      )));
      for (const resultado of resultados) {
        if (resultado.status === 'rejected') console.error('Falha no processamento de um aviso push', resultado.reason?.code || resultado.reason?.name);
      }
    }
    if (pagina.size < 60) break;
    pagina = await consulta.startAfter(pagina.docs.at(-1)).get();
  }
}

module.exports = { processarEnviosPush };
