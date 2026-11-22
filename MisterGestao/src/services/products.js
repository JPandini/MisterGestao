import {
  addDoc,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';

import { db } from './firebase';
import { formatProductCode, productCodePrefix, validateProductPhoto } from '../utils/productCodes';
import { calculateProfitPercentage } from '../utils/productPricing';

export const PRODUCT_STORE_ID = 'mister-motoplace';

function getProductsCollection() {
  if (!db) {
    throw new Error('Configure o Firebase no arquivo .env para usar o Firestore.');
  }

  return collection(db, 'lojas', PRODUCT_STORE_ID, 'produtos');
}

export function subscribeToProducts(onProducts, onError) {
  const productsQuery = query(getProductsCollection(), orderBy('name'));

  return onSnapshot(
    productsQuery,
    (snapshot) => {
      onProducts(snapshot.docs.map((productDocument) => ({
        id: productDocument.id,
        ...productDocument.data(),
      })));
    },
    onError
  );
}

function getCategorySequenceRef(categoryId) {
  if (!categoryId || typeof categoryId !== 'string' || categoryId.includes('/')) {
    throw new Error('Selecione uma categoria cadastrada.');
  }
  getProductsCollection();
  return doc(db, 'lojas', PRODUCT_STORE_ID, 'sequenciasProdutos', categoryId);
}

async function getPreviousCategoryNumber(sequenceRef, category, prefix) {
  if ((await getDoc(sequenceRef)).exists()) return 0;
  // Continua os códigos antigos somente desta categoria, mesmo quando o prefixo se repete.
  const existing = await getDocs(query(getProductsCollection(), where('category', '==', category.trim())));
  return existing.docs.reduce((max, item) => {
    const code = item.data().code || '';
    const suffix = code.startsWith(`${prefix}-`) ? code.slice(4) : '';
    const number = /^\d+$/.test(suffix) ? Number(suffix) : 0;
    return Number.isSafeInteger(number) ? Math.max(max, number) : max;
  }, 0);
}

// Consultar o próximo código não reserva nem consome o número.
export function subscribeToNextProductCode(category, onCode, onError) {
  let active = true;
  let unsubscribe;
  async function subscribe() {
    try {
      const prefix = productCodePrefix(category.name);
      const sequenceRef = getCategorySequenceRef(category.id);
      const previousMax = await getPreviousCategoryNumber(sequenceRef, category.name, prefix);
      if (!active) return;
      unsubscribe = onSnapshot(sequenceRef, (snapshot) => {
        if (active) onCode(formatProductCode(prefix, Math.max(snapshot.data()?.lastNumber || 0, previousMax) + 1));
      }, (error) => { if (active) onError(error); });
    } catch (error) {
      if (active) onError(error);
    }
  }
  subscribe();
  return () => { active = false; unsubscribe?.(); };
}

export async function createProduct(product, userId) {
  if (!userId) throw new Error('Entre novamente para cadastrar produtos.');
  const profitPercentage = calculateProfitPercentage(product.costPrice, product.price);
  if (profitPercentage === null) throw new Error('Confira os valores de custo e venda do produto.');
  validateProductPhoto(product.photo);
  const prefix = productCodePrefix(product.category);
  const products = getProductsCollection();
  const sequenceRef = getCategorySequenceRef(product.categoryId);
  const productRef = doc(products);
  const previousMax = await getPreviousCategoryNumber(sequenceRef, product.category, prefix);
  return runTransaction(db, async (transaction) => {
    const sequence = await transaction.get(sequenceRef);
    const number = Math.max(sequence.data()?.lastNumber || 0, previousMax) + 1;
    const code = formatProductCode(prefix, number);
    transaction.set(sequenceRef, { prefix, lastNumber: number, code, productId: productRef.id });
    transaction.set(productRef, {
      name: product.name.trim(),
      category: product.category.trim(),
      categoryId: product.categoryId,
      brand: product.brand.trim(),
      measure: product.measure.trim(),
      code,
      price: product.price,
      costPrice: product.costPrice,
      profitPercentage,
      stock: product.stock,
      minimum: product.minimum,
      createdAt: serverTimestamp(),
      createdBy: userId,
      ...(product.photo ? { photo: product.photo } : {}),
    });
    return productRef.id;
  });
}

export async function updateProduct(original, product, userId) {
  if (!userId) throw new Error('Entre novamente para editar produtos.');
  if (!original?.id) throw new Error('Produto não encontrado.');

  const nome = product.name.trim();
  const marca = product.brand.trim();
  const medida = product.measure.trim();
  if (!nome) throw new Error('Informe o nome do produto.');
  if (!Number.isSafeInteger(product.price) || product.price <= 0) {
    throw new Error('Confira o valor de venda do produto.');
  }
  if (!Number.isSafeInteger(product.minimum) || product.minimum < 0) {
    throw new Error('Confira o estoque mínimo.');
  }

  const changes = {};
  if (nome !== original.name) changes.name = nome;
  if (marca !== (original.brand ?? '')) {
    if (!marca) throw new Error('Selecione uma marca cadastrada.');
    changes.brand = marca;
  }
  if (medida !== (original.measure ?? '')) changes.measure = medida;
  if (product.minimum !== original.minimum) changes.minimum = product.minimum;

  if (product.category !== (original.category ?? '')) {
    if (!product.category.trim() || typeof product.categoryId !== 'string' || !product.categoryId || product.categoryId.includes('/')) {
      throw new Error('Selecione uma categoria cadastrada.');
    }
    changes.category = product.category.trim();
    changes.categoryId = product.categoryId;
  }

  const costPrice = product.costPrice ?? null;
  if (costPrice !== (original.costPrice ?? null) || product.price !== original.price) {
    changes.price = product.price;
    if (costPrice !== null || original.costPrice != null) {
      const profitPercentage = calculateProfitPercentage(costPrice, product.price);
      if (profitPercentage === null) throw new Error('Confira os valores de custo e venda do produto.');
      changes.costPrice = costPrice;
      changes.profitPercentage = profitPercentage;
    }
  }

  if ((product.photo || '') !== (original.photo || '')) {
    validateProductPhoto(product.photo);
    changes.photo = product.photo || undefined;
  }

  if (Object.keys(changes).length === 0) return;
  const reference = doc(getProductsCollection(), original.id);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists()) {
      const error = new Error('Este produto não está mais disponível.');
      error.code = 'product-not-found';
      throw error;
    }
    const current = snapshot.data();
    const fields = Object.entries(changes);
    const conflict = fields.some(([field, value]) => current[field] !== value && current[field] !== original[field])
      || ('price' in changes && !('costPrice' in changes)
        && (current.costPrice !== original.costPrice || current.profitPercentage !== original.profitPercentage));
    if (conflict) {
      const error = new Error('Este produto foi atualizado por outra pessoa. Volte à lista e abra a edição novamente.');
      error.code = 'product-edit-conflict';
      throw error;
    }

    const patch = {};
    for (const [field, value] of fields) {
      if (current[field] === value) continue;
      patch[field] = field === 'photo' && value === undefined ? deleteField() : value;
    }
    if (Object.keys(patch).length > 0) transaction.update(reference, patch);
  });
}

// Marcas e categorias (colecao = 'marcas' ou 'categorias')
export async function listarNomes(colecao) {
  const resultado = await getDocs(query(collection(db, 'lojas', PRODUCT_STORE_ID, colecao), orderBy('name')));
  return resultado.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function salvarNome(colecao, nome, userId) {
  await addDoc(collection(db, 'lojas', PRODUCT_STORE_ID, colecao), {
    name: nome,
    createdAt: serverTimestamp(),
    createdBy: userId,
  });
}

// Entrada de mercadoria: soma ao estoque e registra o movimento (para o dashboard)
export async function aumentarEstoque(produto, quantidade, userId) {
  const lote = writeBatch(db);
  lote.update(doc(db, 'lojas', PRODUCT_STORE_ID, 'produtos', produto.id), {
    stock: increment(quantidade),
  });
  lote.set(doc(collection(db, 'lojas', PRODUCT_STORE_ID, 'movimentos')), {
    produtoId: produto.id,
    produto: produto.name,
    quantidade,
    tipo: 'entrada',
    createdAt: serverTimestamp(),
    createdBy: userId,
  });
  await lote.commit();
}
