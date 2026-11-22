const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { info } = require('firebase-functions/logger');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { acompanharPrazosOrcamentos } = require('./prazosOrcamentos');
const { processarEnviosPush } = require('./pushOrcamentos');

initializeApp();

exports.verificarPrazosOrcamentos = onSchedule({
  schedule: '*/15 * * * *',
  timeZone: 'America/Sao_Paulo',
  region: 'southamerica-east1',
  timeoutSeconds: 540,
  retryCount: 2,
}, async () => {
  const db = getFirestore();
  try {
    const resultado = await acompanharPrazosOrcamentos(db);
    info('Prazos de orçamentos verificados', resultado);
  } finally {
    await processarEnviosPush(db);
  }
});
