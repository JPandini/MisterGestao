// Executar somente com o Firestore Emulator: nunca acessa o banco de produção.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const { initializeApp, deleteApp } = require('firebase/app');
const firestore = require('firebase/firestore');

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Execute com firebase emulators:exec --only firestore.');
const projectId = 'demo-mistergestao';
const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
const app = initializeApp({ projectId, apiKey: 'demo' }, 'test-clientes');
const anonApp = initializeApp({ projectId, apiKey: 'demo' }, 'test-anonimo');
const db = firestore.getFirestore(app);
const anonDb = firestore.getFirestore(anonApp);
firestore.connectFirestoreEmulator(db, host, Number(port), { mockUserToken: { sub: 'vendedor-teste' } });
firestore.connectFirestoreEmulator(anonDb, host, Number(port));

const cache = new Map();
function load(file) {
  const absolute = path.resolve(__dirname, '..', file);
  if (cache.has(absolute)) return cache.get(absolute);
  const code = babel.transformSync(fs.readFileSync(absolute, 'utf8'), {
    configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
  }).code;
  const exports = {};
  const customRequire = (name) => {
    if (name === './firebase') return { db };
    if (name === './products') return { PRODUCT_STORE_ID: 'mister-motoplace' };
    if (name.startsWith('.')) return load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(absolute), name + '.js')));
    return require(name);
  };
  vm.runInThisContext(`(function(exports, require) {\n${code}\n})`, { filename: absolute })(exports, customRequire);
  cache.set(absolute, exports);
  return exports;
}
const clientes = load('src/services/clientes.js');
const orcamentos = load('src/services/orcamentos.js');
const telefones = load('src/utils/clientes.js');
const compartilhar = load('src/utils/compartilharOrcamento.js');
const colecao = (...segments) => firestore.doc(db, 'lojas', 'mister-motoplace', ...segments);
let checks = 0;
async function check(name, callback) { await callback(); checks++; console.log('OK:', name); }
const denied = (promise) => assert.rejects(promise, (error) => error.code === 'permission-denied');

async function run() {
  await check('normalizacao, DDI e formatacao sem duplicar +55', () => {
    assert.equal(telefones.normalizarTelefone('+55 (11) 99999-9999'), '11999999999');
    assert.equal(telefones.normalizarTelefone('(55) 99999-9999'), '55999999999');
    assert.equal(telefones.formatarTelefone('1133334444'), '(11) 3333-4444');
    for (const telefone of ['', '999999999', '00999999999', '11123456789', '11999999999999']) {
      assert.throws(() => telefones.normalizarTelefone(telefone));
    }
    assert.throws(() => telefones.validarCliente({ nome: ' ', telefone: '11999999999' }));
  });
  let cliente;
  await check('cadastro autenticado e reutilizacao de telefone existente', async () => {
    cliente = await clientes.salvarCliente({ nome: ' Ana ', telefone: '(11) 99999-9999' }, 'vendedor-teste');
    assert.equal(cliente.nome, 'Ana');
    const repetido = await clientes.salvarCliente({ nome: 'Outro nome', telefone: '+5511999999999' }, 'vendedor-teste');
    assert.equal(repetido.id, cliente.id); assert.equal(repetido.nome, 'Ana');
    const dados = (await firestore.getDoc(colecao('clientes', cliente.id))).data();
    assert.equal(dados.createdBy, 'vendedor-teste'); assert.ok(dados.createdAt);
  });
  await check('regras recusam acesso sem sessao, telefone invalido e autor incorreto', async () => {
    await denied(firestore.getDoc(firestore.doc(anonDb, 'lojas/mister-motoplace/clientes/11999999999')));
    await denied(firestore.setDoc(colecao('clientes', 'invalido'), { nome: 'Teste', telefone: '123', createdAt: firestore.serverTimestamp(), createdBy: 'vendedor-teste' }));
    await denied(firestore.setDoc(colecao('clientes', '11988888888'), { nome: 'Teste', telefone: '11988888888', createdAt: firestore.serverTimestamp(), createdBy: 'outro' }));
    await denied(firestore.setDoc(colecao('clientes', '11988888888'), { nome: 'Teste', telefone: '11988888888', cpf: 'campo-extra', createdAt: firestore.serverTimestamp(), createdBy: 'vendedor-teste' }));
  });
  let id;
  await check('orcamento salvo recebe cliente real sem mudar valores', async () => {
    id = await orcamentos.salvarOrcamento({ itens: [{ id: 'pneu', nome: 'Pneu & Câmara', medida: '90/90', preco: 10050, quantidade: 2 }], desconto: 100, frete: 500, validade: '2026-12-31', observacoes: 'Retirar na loja' }, 'vendedor-teste');
    const antes = await orcamentos.buscarOrcamento(id);
    const atualizado = await orcamentos.vincularClienteAoOrcamento(id, cliente.id);
    assert.equal(atualizado.cliente.nome, 'Ana'); assert.equal(atualizado.cliente.contato, '11999999999');
    assert.equal(atualizado.total, antes.total); assert.equal(JSON.stringify(atualizado.itens), JSON.stringify(antes.itens));
    const salvo = await orcamentos.buscarOrcamento(id); assert.equal(salvo.cliente.id, cliente.id);
    const url = new URL(compartilhar.montarLinkWhatsApp(salvo));
    assert.equal(url.origin + url.pathname, 'https://wa.me/5511999999999');
    const mensagem = url.searchParams.get('text');
    assert.match(mensagem, /Pneu & Câmara/); assert.match(mensagem, /Ana/); assert.match(mensagem, /205,00/);
    assert.match(mensagem, /31\/12\/2026/); assert.match(mensagem, /Retirar na loja/);
  });
  await check('regras impedem mudar total, itens e status durante escolha do cliente', async () => {
    for (const dados of [{ total: 1 }, { itens: [] }, { status: 'converted' }, { createdBy: 'outro' }]) {
      await denied(firestore.updateDoc(colecao('orcamentos', id), dados));
    }
    await denied(firestore.updateDoc(colecao('orcamentos', id), { cliente: { id: cliente.id, nome: 'Inventado', contato: cliente.telefone } }));
    await denied(firestore.updateDoc(colecao('orcamentos', id), { cliente: { id: '11988888888', nome: 'Inexistente', contato: '11988888888' } }));
    await denied(firestore.updateDoc(colecao('clientes', cliente.id), { nome: 'Alterado' }));
    await denied(firestore.deleteDoc(colecao('clientes', cliente.id)));
  });
  await check('dois vendedores nao duplicam o mesmo telefone', async () => {
    const results = await Promise.all([
      clientes.salvarCliente({ nome: 'Bruno', telefone: '48999998888' }, 'vendedor-teste'),
      clientes.salvarCliente({ nome: 'Bruno duplicado', telefone: '(48) 99999-8888' }, 'vendedor-teste'),
    ]);
    assert.equal(results[0].id, results[1].id); assert.equal(results[0].nome, results[1].nome);
  });
  await check('lista compartilhada retorna cadastro persistido', () => new Promise((resolve, reject) => {
    const cancelar = clientes.acompanharClientes((lista) => {
      if (lista.length < 2) return;
      cancelar();
      try { assert.ok(lista.some((item) => item.id === cliente.id)); resolve(); } catch (error) { reject(error); }
    }, reject);
  }));
  console.log(`${checks} cenarios passaram no Firestore Emulator. Nenhuma mensagem enviada.`);
}
run().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await Promise.all([firestore.terminate(db), firestore.terminate(anonDb)]);
  await Promise.all([deleteApp(app), deleteApp(anonApp)]);
});
