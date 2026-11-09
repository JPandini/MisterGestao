import { collection, doc, onSnapshot, orderBy, query, runTransaction, serverTimestamp } from 'firebase/firestore';

import { db } from './firebase';
import { PRODUCT_STORE_ID } from './products';
import { validarCliente } from '../utils/clientes';

function getClientesCollection() {
  if (!db) throw new Error('Configure o Firebase para cadastrar clientes.');
  return collection(db, 'lojas', PRODUCT_STORE_ID, 'clientes');
}

export function acompanharClientes(onClientes, onError) {
  return onSnapshot(query(getClientesCollection(), orderBy('nome')), (snapshot) => {
    onClientes(snapshot.docs.map((document) => ({ ...document.data(), id: document.id })));
  }, onError);
}

export async function salvarCliente(dados, userId) {
  if (!userId) throw new Error('Entre novamente para cadastrar o cliente.');
  const cliente = validarCliente(dados);
  // O telefone identifica o cadastro para impedir duplicidade, inclusive entre aparelhos.
  const referencia = doc(getClientesCollection(), cliente.telefone);
  return runTransaction(db, async (transaction) => {
    const existente = await transaction.get(referencia);
    if (existente.exists()) return { ...existente.data(), id: existente.id };
    transaction.set(referencia, { ...cliente, createdAt: serverTimestamp(), createdBy: userId });
    return { ...cliente, id: referencia.id };
  });
}
