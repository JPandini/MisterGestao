const { FieldValue, Timestamp } = require('firebase-admin/firestore');

const DIA_MS = 24 * 60 * 60 * 1000;
const CANCELAMENTO = 8;
const LEMBRETES = [7, 5, 1];
const TAMANHO_PAGINA = 50;

function etapaPendente(orcamento, agora) {
  if (orcamento?.status !== 'open' || !(orcamento.createdAt instanceof Timestamp)) return null;

  const idade = Math.floor((agora - orcamento.createdAt.toMillis()) / DIA_MS);
  if (idade >= CANCELAMENTO) return CANCELAMENTO;
  if (typeof orcamento.createdBy !== 'string' || !orcamento.createdBy || orcamento.createdBy.includes('/')) return null;

  const dia = LEMBRETES.find((marco) => idade >= marco);
  return dia > (orcamento.reminderDay ?? 0) ? dia : null;
}

async function processarOrcamento(db, loja, referencia, agora) {
  return db.runTransaction(async (transacao) => {
    const snapshot = await transacao.get(referencia);
    const orcamento = snapshot.data();
    const dia = etapaPendente(orcamento, agora);
    if (!dia) return null;

    const venda = await transacao.get(loja.collection('vendas').doc(referencia.id));
    if (venda.exists) return null;

    if (dia === CANCELAMENTO) {
      transacao.update(referencia, {
        status: 'cancelled',
        cancelledAt: FieldValue.serverTimestamp(),
        cancelledBy: 'system',
      });
      return 'cancelados';
    }

    const notificacao = db.collection('usuarios').doc(orcamento.createdBy)
      .collection('notificacoesOrcamentos').doc(`${referencia.id}_${dia}`);
    transacao.create(notificacao, {
      orcamentoId: referencia.id,
      dia,
      createdAt: FieldValue.serverTimestamp(),
      lida: false,
    });
    const proximoDia = { 1: 5, 5: 7, 7: CANCELAMENTO }[dia];
    transacao.create(db.collection('enviosPushOrcamentos').doc(notificacao.id), {
      uid: orcamento.createdBy,
      orcamentoId: referencia.id,
      dia,
      processarEm: FieldValue.serverTimestamp(),
      expiraEm: Timestamp.fromMillis(orcamento.createdAt.toMillis() + proximoDia * DIA_MS),
    });
    transacao.update(referencia, { reminderDay: dia });
    return 'lembretes';
  });
}

async function acompanharPrazosOrcamentos(db, agora = Date.now()) {
  const loja = db.collection('lojas').doc('mister-motoplace');
  const consulta = loja.collection('orcamentos')
    .where('status', '==', 'open')
    .where('createdAt', '<=', Timestamp.fromMillis(agora - DIA_MS))
    .orderBy('createdAt')
    .select('status', 'createdAt', 'createdBy', 'reminderDay')
    .limit(TAMANHO_PAGINA);
  const totais = { lembretes: 0, cancelados: 0 };
  let pagina = await consulta.get();
  let falhas = 0;

  while (!pagina.empty) {
    const pendentes = pagina.docs.filter((snapshot) => etapaPendente(snapshot.data(), agora));
    const resultados = await Promise.allSettled(pendentes.map(({ ref }) => processarOrcamento(db, loja, ref, agora)));
    resultados.forEach((resultado, indice) => {
      if (resultado.status === 'rejected') {
        falhas++;
        console.error('Falha ao verificar o orçamento', pendentes[indice].id, resultado.reason);
      } else if (resultado.value) {
        totais[resultado.value]++;
      }
    });
    if (pagina.size < TAMANHO_PAGINA) break;
    pagina = await consulta.startAfter(pagina.docs.at(-1)).get();
  }

  if (falhas) throw new Error(`Falha ao verificar ${falhas} orçamento(s).`);
  return totais;
}

module.exports = { acompanharPrazosOrcamentos };
