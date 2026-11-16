// Somente no emulador: não lê credenciais nem altera o projeto real.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const { initializeApp, deleteApp } = require('firebase/app');
const firestore = require('firebase/firestore');

const host = process.env.FIRESTORE_EMULATOR_HOST;
if (!host || !/^(127\.0\.0\.1|localhost):\d+$/.test(host)) throw new Error('Execute com o Firestore Emulator local.');
const projectId = 'demo-mistergestao';
const [hostname, port] = host.split(':');
const app = initializeApp({ projectId, apiKey: 'demo' }, 'pendencias');
const db = firestore.getFirestore(app);
firestore.connectFirestoreEmulator(db, hostname, Number(port), { mockUserToken: { sub: 'vendedor-teste' } });
const anonApp = initializeApp({ projectId, apiKey: 'demo' }, 'pendencias-sem-sessao');
const anonDb = firestore.getFirestore(anonApp);
firestore.connectFirestoreEmulator(anonDb, hostname, Number(port));
const cache = new Map();
const platform = { OS: 'web' };
const calls = [];
let sharingAvailable = true;
let photoResult = '/9j/AA==';
const photoCalls = [];
function load(file) {
  const absolute = path.resolve(__dirname, '..', file);
  if (cache.has(absolute)) return cache.get(absolute);
  const code = babel.transformSync(fs.readFileSync(absolute, 'utf8'), {
    configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
  }).code;
  const exports = {};
  const customRequire = (name) => {
    if (name === './firebase') return { db };
    if (name === 'react-native') return { Platform: platform };
    if (name === 'expo-print') return { printToFileAsync: async (options) => {
      calls.push(['print', options]); return { uri: 'file:///teste.pdf' };
    } };
    if (name === 'expo-sharing') return {
      isAvailableAsync: async () => sharingAvailable,
      shareAsync: async (uri, options) => calls.push(['share', uri, options]),
    };
    if (name === 'expo-image-manipulator') return { SaveFormat: { JPEG: 'jpeg' }, ImageManipulator: {
      manipulate: () => ({
        resize: (size) => photoCalls.push(['resize', size]),
        renderAsync: async () => ({
          saveAsync: async (options) => { photoCalls.push(['save', options]); return { base64: photoResult }; },
          release: () => photoCalls.push(['release-image']),
        }),
        release: () => photoCalls.push(['release-context']),
      }),
    } };
    if (name.startsWith('.')) return load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(absolute), name + '.js')));
    return require(name);
  };
  vm.runInThisContext(`(function(exports, require) {\n${code}\n})`, { filename: absolute })(exports, customRequire);
  cache.set(absolute, exports);
  return exports;
}

const products = load('src/services/products.js');
const quotes = load('src/services/orcamentos.js');
const sales = load('src/services/vendas.js');
const dates = load('src/utils/orcamento.js');
const codes = load('src/utils/productCodes.js');
const pdf = load('src/utils/pdfOrcamento.js');
const photo = load('src/utils/productPhoto.js');
const pricing = load('src/utils/productPricing.js');
const sharing = load('src/utils/compartilharOrcamento.js');
const ref = (collection, id) => firestore.doc(db, 'lojas', 'mister-motoplace', collection, id);
const categoryId = (name) => 'categoria-' + name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s/g, '-');
const product = (category = 'Câmara de ar') => ({ name: 'Câmara reforçada', category, categoryId: categoryId(category), brand: 'Teste', measure: '18', price: 5490, costPrice: 4000, profitPercentage: 37.25, stock: 10, minimum: 1 });
const item = (id, quantidade = 1) => ({ id, nome: 'Câmara <reforçada>', medida: '18', preco: 5490, quantidade });
const denied = (promise) => assert.rejects(promise, (error) => error.code === 'permission-denied');
let checks = 0;
async function check(name, callback) { await callback(); checks++; console.log('OK:', name); }

// A API REST de administrador é usada apenas para simular dados antigos no emulador.
function field(value) {
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(field) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, v]) => [key, field(v)])) } };
}
async function seed(collection, id, data) {
  const response = await fetch(`http://${host}/v1/projects/${projectId}/databases/(default)/documents/lojas/mister-motoplace/${collection}/${id}`, {
    method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, field(value)])) }),
  });
  assert.ok(response.ok, await response.text());
}

async function run() {
  for (const name of ['Câmara de ar', 'Camisetas', 'Pneus', 'Óleos', 'Teste de prévia', 'Teste de preço']) {
    await firestore.setDoc(ref('categorias', categoryId(name)), {
      name, createdBy: 'vendedor-teste', createdAt: firestore.serverTimestamp(),
    });
  }
  await check('prefixos, valores em reais, datas reais e virada de mês', () => {
    assert.equal(codes.productCodePrefix('Câmara de ar'), 'CAM');
    assert.equal(codes.formatProductCode('CAM', 1000), 'CAM-1000');
    assert.throws(() => codes.productCodePrefix('123'));
    assert.equal(dates.parsePriceToCents('1.234,56'), 123456);
    for (const value of ['-1', '1.50', 'NaN', '1,234']) assert.equal(dates.parsePriceToCents(value), null);
    assert.equal(dates.lerValidade('29/02/2028'), '2028-02-29');
    assert.equal(dates.lerValidade('31/02/2027'), null);
    assert.equal(dates.validadePadrao(new Date(2026, 11, 28)), '2027-01-04');
    assert.equal(dates.orcamentoVencido({ validade: '2026-11-15' }, new Date(2026, 10, 15, 23, 59)), false);
    assert.equal(dates.orcamentoVencido({ validade: '2026-11-15' }, new Date(2026, 10, 16)), true);
  });
  await check('custo, venda e lucro calculam nos dois sentidos e validam centavos', () => {
    let form = { costPrice: '', price: '', profitPercentage: '', pricingSource: 'profitPercentage' };
    form = pricing.updateProductPricing(form, 'costPrice', '100,00');
    form = pricing.updateProductPricing(form, 'profitPercentage', '25');
    assert.equal(form.price, '125,00');
    form = pricing.updateProductPricing(form, 'costPrice', '200,00');
    assert.equal(form.price, '250,00');
    form = pricing.updateProductPricing(form, 'price', '300,00');
    assert.equal(form.profitPercentage, '50,00');
    form = pricing.updateProductPricing(form, 'costPrice', '100,00');
    assert.equal(form.price, '300,00'); assert.equal(form.profitPercentage, '200,00');
    form = pricing.updateProductPricing(form, 'profitPercentage', '0');
    assert.equal(form.price, '100,00');
    form = pricing.updateProductPricing(form, 'profitPercentage', '-10');
    assert.equal(form.price, '90,00');
    form = pricing.updateProductPricing(form, 'costPrice', '');
    assert.equal(form.price, '');
    form = pricing.updateProductPricing(form, 'price', '10,00');
    assert.equal(form.profitPercentage, '');
    assert.equal(pricing.calculateSalePrice(5490, 25), 6863);
    assert.equal(pricing.calculateProfitPercentage(10000, 12500), 25);
    assert.equal(pricing.calculateProfitPercentage(10000, 9000), -10);
    for (const value of ['', 'NaN', '25.5', '1,234', '-100', '100000000000000000000']) {
      assert.equal(pricing.parseProfitPercentage(value), null);
    }
    assert.equal(pricing.parseProfitPercentage('25,50'), 25.5);
    assert.equal(pricing.calculateSalePrice(0, 25), null);
    assert.equal(pricing.calculateSalePrice(Number.MAX_SAFE_INTEGER, 100), null);
  });
  let productId;
  await check('dois cadastros simultâneos não repetem código', async () => {
    const ids = await Promise.all([products.createProduct(product(), 'vendedor-teste'), products.createProduct(product(), 'vendedor-teste')]);
    const result = await Promise.all(ids.map((id) => firestore.getDoc(ref('produtos', id))));
    assert.deepEqual(result.map((doc) => doc.data().code).sort(), ['CAM-001', 'CAM-002']);
    productId = ids[0];
    const samePrefix = await products.createProduct(product('Camisetas'), 'vendedor-teste');
    assert.equal((await firestore.getDoc(ref('produtos', samePrefix))).data().code, 'CAM-001');
    const anotherInSameCategory = await products.createProduct(product('Camisetas'), 'vendedor-teste');
    assert.equal((await firestore.getDoc(ref('produtos', anotherInSameCategory))).data().code, 'CAM-002');
    assert.equal((await firestore.getDoc(ref('sequenciasProdutos', categoryId('Câmara de ar')))).data().lastNumber, 2);
    const another = await products.createProduct(product('Pneus'), 'vendedor-teste');
    assert.equal((await firestore.getDoc(ref('produtos', another))).data().code, 'PNE-001');
  });
  await check('prévia mostra código completo, não consome número e acompanha novo cadastro', async () => {
    const category = { id: categoryId('Teste de prévia'), name: 'Teste de prévia' };
    let stop;
    try {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('A prévia não atualizou.')), 10000);
        let created = false;
        stop = products.subscribeToNextProductCode(category, async (code) => {
          try {
            if (code === 'TES-001' && !created) {
              created = true;
              assert.equal((await firestore.getDoc(ref('sequenciasProdutos', category.id))).exists(), false);
              const id = await products.createProduct(product(category.name), 'vendedor-teste');
              assert.equal((await firestore.getDoc(ref('produtos', id))).data().code, 'TES-001');
            } else if (code === 'TES-002') {
              clearTimeout(timeout); resolve();
            }
          } catch (error) { clearTimeout(timeout); reject(error); }
        }, (error) => { clearTimeout(timeout); reject(error); });
      });
    } finally { stop?.(); }
  });
  await check('códigos manuais anteriores e sequência maior que 999 são respeitados', async () => {
    const oldProduct = { ...product('Óleos'), code: 'OLE-999' };
    delete oldProduct.categoryId;
    delete oldProduct.costPrice;
    delete oldProduct.profitPercentage;
    await seed('produtos', 'antigo-oleo', oldProduct);
    const id = await products.createProduct(product('Óleos'), 'vendedor-teste');
    assert.equal((await firestore.getDoc(ref('produtos', id))).data().code, 'OLE-1000');
  });
  await check('foto persistida e rejeição de URI local ou foto excessiva', async () => {
    const photo = 'data:image/jpeg;base64,/9j/AA==';
    const id = await products.createProduct({ ...product(), photo }, 'vendedor-teste');
    assert.equal((await firestore.getDoc(ref('produtos', id))).data().photo, photo);
    for (const invalid of ['file:///foto.jpg', 'data:image/jpeg;base64,' + 'A'.repeat(700000)]) {
      await assert.rejects(products.createProduct({ ...product(), photo: invalid }, 'vendedor-teste'), /foto/i);
    }
  });
  await check('foto reduz resolução, usa JPEG e informa falha sem perder recursos', async () => {
    const result = await photo.prepararFotoProduto({ uri: 'file:///foto.jpg', width: 3000, height: 4000 });
    assert.equal(result, 'data:image/jpeg;base64,/9j/AA==');
    assert.deepEqual(photoCalls[0], ['resize', { height: 800 }]);
    assert.equal(photoCalls[1][1].format, 'jpeg');
    assert.equal(photoCalls[1][1].base64, true);
    photoResult = '';
    await assert.rejects(photo.prepararFotoProduto({ uri: 'file:///foto.jpg', width: 100, height: 100 }), /processar/);
    assert.deepEqual(photoCalls.slice(-2).map((call) => call[0]), ['release-image', 'release-context']);
  });
  await check('produto salva custo, venda e lucro real; orçamento usa somente o preço de venda', async () => {
    const id = await products.createProduct({ ...product('Teste de preço'), costPrice: 10000, price: 12500, profitPercentage: 999 }, 'vendedor-teste');
    const saved = (await firestore.getDoc(ref('produtos', id))).data();
    assert.equal(saved.costPrice, 10000); assert.equal(saved.price, 12500); assert.equal(saved.profitPercentage, 25);
    const quoteId = await quotes.salvarOrcamento({ itens: [{ ...item(id), preco: saved.price }] }, 'vendedor-teste');
    const quote = await quotes.buscarOrcamento(quoteId);
    assert.equal(quote.total, 12500);
    assert.equal('costPrice' in quote.itens[0], false);
    assert.equal('profitPercentage' in quote.itens[0], false);
    for (const invalid of [{ costPrice: 0 }, { costPrice: -1 }, { costPrice: undefined }, { price: 0 }, { price: NaN }]) {
      await assert.rejects(products.createProduct({ ...product(), ...invalid }, 'vendedor-teste'), /custo e venda/);
    }
    const batch = firestore.writeBatch(db);
    batch.set(ref('produtos', 'custo-invalido'), { ...product('Teste de preço'), costPrice: -1, code: 'TES-002', createdBy: 'vendedor-teste', createdAt: firestore.serverTimestamp() });
    batch.set(ref('sequenciasProdutos', categoryId('Teste de preço')), { prefix: 'TES', lastNumber: 2, code: 'TES-002', productId: 'custo-invalido' });
    await denied(batch.commit());
  });
  await check('regras impedem código avulso, retrocesso e avanço sem produto', async () => {
    await denied(firestore.setDoc(ref('produtos', 'sem-contador'), { ...product(), code: 'CAM-005', createdBy: 'vendedor-teste', createdAt: firestore.serverTimestamp() }));
    await denied(firestore.updateDoc(ref('sequenciasProdutos', categoryId('Câmara de ar')), { lastNumber: 1 }));
    await denied(firestore.setDoc(ref('sequenciasProdutos', 'categoria-errada'), { prefix: 'ERR', lastNumber: 1, code: 'ERR-001', productId: 'nao-existe' }));
    const wrongCategory = firestore.writeBatch(db);
    wrongCategory.set(ref('sequenciasProdutos', categoryId('Pneus')), { prefix: 'PNE', lastNumber: 2, code: 'PNE-002', productId: 'categoria-trocada' });
    wrongCategory.set(ref('produtos', 'categoria-trocada'), { ...product(), code: 'PNE-002', createdBy: 'vendedor-teste', createdAt: firestore.serverTimestamp() });
    await denied(wrongCategory.commit());
  });
  let quoteId;
  await check('orçamento calcula desconto e frete, salva validade e não baixa estoque', async () => {
    quoteId = await quotes.salvarOrcamento({ itens: [item(productId, 2)], desconto: 1000, frete: 1500, observacoes: 'Entregar\napós as 14h' }, 'vendedor-teste');
    const quote = await quotes.buscarOrcamento(quoteId);
    assert.equal(quote.total, 11480); assert.equal(quote.validade, dates.validadePadrao());
    assert.equal((await firestore.getDoc(ref('produtos', productId))).data().stock, 10);
    for (const data of [{ desconto: 20000 }, { frete: -1 }, { validade: '2026-02-31' }, { validade: '2000-01-01' }, { itens: [item(productId), item(productId)] }]) {
      await assert.rejects(quotes.salvarOrcamento({ itens: [item(productId)], ...data }, 'vendedor-teste'));
    }
  });
  await check('duas confirmações geram uma venda, com total final e baixa única', async () => {
    const result = await Promise.allSettled([sales.confirmarVenda(quoteId, 'vendedor-teste'), sales.confirmarVenda(quoteId, 'vendedor-teste')]);
    assert.equal(result.filter((item) => item.status === 'fulfilled').length, 1);
    assert.equal((await quotes.buscarOrcamento(quoteId)).status, 'converted');
    assert.equal((await firestore.getDoc(ref('produtos', productId))).data().stock, 8);
    assert.equal((await firestore.getDoc(ref('vendas', quoteId))).data().total, 11480);
  });
  await check('estoque insuficiente e validade vencida não alteram orçamento ou estoque', async () => {
    const insufficient = await quotes.salvarOrcamento({ itens: [item(productId, 20)] }, 'vendedor-teste');
    await assert.rejects(sales.confirmarVenda(insufficient, 'vendedor-teste'), /Estoque insuficiente/);
    const expired = { ...(await quotes.buscarOrcamento(insufficient)), validade: '2000-01-01' };
    delete expired.createdAt;
    await seed('orcamentos', 'vencido', expired);
    await assert.rejects(sales.confirmarVenda('vencido', 'vendedor-teste'), /venceu/);
    const batch = firestore.writeBatch(db);
    batch.update(ref('orcamentos', 'vencido'), { status: 'converted' });
    batch.set(ref('vendas', 'vencido'), { orcamentoId: 'vencido', cliente: '', total: expired.total, createdAt: firestore.serverTimestamp(), createdBy: 'vendedor-teste' });
    await denied(batch.commit());
    assert.equal((await quotes.buscarOrcamento(insufficient)).status, 'open');
    assert.equal((await firestore.getDoc(ref('produtos', productId))).data().stock, 8);
  });
  await check('produto repetido em orçamento antigo baixa a soma das quantidades', async () => {
    await seed('orcamentos', 'repetido-antigo', { itens: [item(productId, 2), item(productId, 3)], total: 27450, status: 'open', validade: '2099-12-31' });
    await sales.confirmarVenda('repetido-antigo', 'vendedor-teste');
    assert.equal((await firestore.getDoc(ref('produtos', productId))).data().stock, 3);
  });
  let cancelledId;
  await check('cancelamento preserva orçamento e estoque, registra autor e mantém histórico', async () => {
    cancelledId = await quotes.salvarOrcamento({ itens: [item(productId, 2)], desconto: 100, frete: 200 }, 'vendedor-teste');
    const before = await quotes.buscarOrcamento(cancelledId);
    await quotes.cancelarOrcamento(cancelledId, 'vendedor-teste');
    const after = await quotes.buscarOrcamento(cancelledId);
    assert.equal(after.status, 'cancelled'); assert.equal(after.cancelledBy, 'vendedor-teste');
    assert.ok(after.cancelledAt?.toDate());
    for (const key of ['itens', 'cliente', 'subtotal', 'desconto', 'frete', 'total', 'validade', 'observacoes', 'createdBy']) {
      assert.deepEqual(after[key], before[key]);
    }
    assert.equal((await firestore.getDoc(ref('produtos', productId))).data().stock, 3);
    assert.equal((await firestore.getDoc(ref('vendas', cancelledId))).exists(), false);
    await assert.rejects(sales.confirmarVenda(cancelledId, 'vendedor-teste'), /não está mais aberto/);
    await quotes.cancelarOrcamento(cancelledId, 'vendedor-teste');
    assert.equal((await quotes.buscarOrcamento(cancelledId)).cancelledAt.toMillis(), after.cancelledAt.toMillis());
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('O orçamento cancelado não apareceu no histórico.')), 10000);
      const stop = quotes.acompanharOrcamentos((list) => {
        try {
          assert.ok(list.some((quote) => quote.id === cancelledId && quote.status === 'cancelled'));
          assert.ok(!list.filter((quote) => quote.status === 'open').some((quote) => quote.id === cancelledId));
          clearTimeout(timeout); stop(); resolve();
        } catch (error) { clearTimeout(timeout); stop(); reject(error); }
      }, (error) => { clearTimeout(timeout); reject(error); });
    });
    const html = pdf.montarHtmlOrcamento(after);
    assert.match(html, /Status: Cancelado/); assert.match(html, /sem efeito para venda/);
    assert.match(sharing.montarMensagemOrcamento(after), /Status: Cancelado/);
    if (process.env.PDF_QA_OUTPUT) {
      fs.mkdirSync(process.env.PDF_QA_OUTPUT, { recursive: true });
      fs.writeFileSync(path.join(process.env.PDF_QA_OUTPUT, 'orcamento-cancelado.html'), html);
    }
  });
  await check('orçamento vencido pode ser cancelado; orçamento vendido não pode', async () => {
    const expired = { ...(await quotes.buscarOrcamento(quoteId)), status: 'open', validade: '2000-01-01' };
    delete expired.createdAt;
    await seed('orcamentos', 'cancelar-vencido', expired);
    await quotes.cancelarOrcamento('cancelar-vencido', 'vendedor-teste');
    assert.equal((await quotes.buscarOrcamento('cancelar-vencido')).status, 'cancelled');
    await assert.rejects(quotes.cancelarOrcamento(quoteId, 'vendedor-teste'), /já virou venda/);
    await assert.rejects(quotes.cancelarOrcamento('inexistente', 'vendedor-teste'), /não encontrado/);
    await assert.rejects(quotes.cancelarOrcamento(cancelledId), /Entre novamente/);
  });
  await check('regras protegem cancelamento contra alteração de valores, autor falso e reabertura', async () => {
    const id = await quotes.salvarOrcamento({ itens: [item(productId)] }, 'vendedor-teste');
    const cancellation = { status: 'cancelled', cancelledAt: firestore.serverTimestamp(), cancelledBy: 'vendedor-teste' };
    await denied(firestore.updateDoc(ref('orcamentos', id), { status: 'cancelled' }));
    await denied(firestore.updateDoc(ref('orcamentos', id), { ...cancellation, cancelledBy: 'outro' }));
    await denied(firestore.updateDoc(ref('orcamentos', id), { ...cancellation, total: 1 }));
    await denied(firestore.updateDoc(firestore.doc(anonDb, 'lojas', 'mister-motoplace', 'orcamentos', id), cancellation));
    await denied(firestore.updateDoc(ref('orcamentos', cancelledId), { status: 'open' }));
    await denied(firestore.updateDoc(ref('orcamentos', quoteId), cancellation));
  });
  await check('venda e cancelamento simultâneos têm apenas um resultado e estoque consistente', async () => {
    const id = await products.createProduct({ ...product('Teste de preço'), stock: 1 }, 'vendedor-teste');
    const quote = await quotes.salvarOrcamento({ itens: [item(id)] }, 'vendedor-teste');
    const results = await Promise.allSettled([
      quotes.cancelarOrcamento(quote, 'vendedor-teste'), sales.confirmarVenda(quote, 'vendedor-teste'),
    ]);
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
    const saved = await quotes.buscarOrcamento(quote);
    const stock = (await firestore.getDoc(ref('produtos', id))).data().stock;
    const sale = await firestore.getDoc(ref('vendas', quote));
    assert.ok(['cancelled', 'converted'].includes(saved.status));
    assert.equal(stock, saved.status === 'converted' ? 0 : 1);
    assert.equal(sale.exists(), saved.status === 'converted');
  });
  await check('PDF inclui condições, neutraliza HTML e informa pop-up bloqueado', async () => {
    const quote = await quotes.buscarOrcamento(quoteId);
    const html = pdf.montarHtmlOrcamento({ ...quote, cliente: { nome: '<script>alert(1)</script>' } });
    assert.ok(html.includes('&lt;script&gt;')); assert.ok(!html.includes('<script>'));
    for (const text of ['Desconto', 'Frete', 'Válido até:', quote.id, '114,80', '<thead>']) assert.ok(html.includes(text), text);
    global.window = { open: () => null };
    await assert.rejects(pdf.enviarPdfOrcamento(quote), /pop-ups/);
    platform.OS = 'android';
    await pdf.enviarPdfOrcamento(quote);
    assert.deepEqual(calls.map((call) => call[0]), ['print', 'share']);
    sharingAvailable = false;
    await assert.rejects(pdf.enviarPdfOrcamento(quote), /não está disponível/);
    // Amostras locais para inspeção visual; não fazem parte dos dados da loja.
    if (process.env.PDF_QA_OUTPUT) {
      fs.mkdirSync(process.env.PDF_QA_OUTPUT, { recursive: true });
      fs.writeFileSync(path.join(process.env.PDF_QA_OUTPUT, 'orcamento.html'), pdf.montarHtmlOrcamento({ ...quote, cliente: { nome: 'Maria da Silva', contato: '48999998888' } }));
      fs.writeFileSync(path.join(process.env.PDF_QA_OUTPUT, 'orcamento-longo.html'), pdf.montarHtmlOrcamento({ ...quote, itens: Array.from({ length: 65 }, (_, i) => ({ ...item(`produto-${i}`), nome: `Produto ${i + 1} - Câmara reforçada para motocicleta com descrição longa` })) }));
    }
  });
  console.log(`${checks} cenários passaram. Somente emulador; nenhum dado real alterado.`);
}
run().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await Promise.all([firestore.terminate(db), firestore.terminate(anonDb)]);
  await Promise.all([deleteApp(app), deleteApp(anonApp)]);
});
