import {
  addDoc,
  collection,
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
  });

  return document.id;
}
