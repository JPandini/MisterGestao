import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from './firebase';

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

export async function createProduct(product, userId) {
  const document = await addDoc(getProductsCollection(), {
    name: product.name.trim(),
    category: product.category.trim(),
    brand: product.brand.trim(),
    measure: product.measure.trim(),
    code: product.code.trim(),
    price: product.price,
    stock: product.stock,
    minimum: product.minimum,
    createdAt: serverTimestamp(),
    createdBy: userId,
    ...(product.photo ? { photo: product.photo } : {}),
  });

  return document.id;
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
