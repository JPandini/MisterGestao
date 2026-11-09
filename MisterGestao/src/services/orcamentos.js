import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, runTransaction, serverTimestamp } from 'firebase/firestore';

import { db } from './firebase';
import { PRODUCT_STORE_ID } from './products';

function getOrcamentosCollection() {
  if (!db) {
    throw new Error('Configure o Firebase no arquivo .env para usar o Firestore.');
  }

  return collection(db, 'lojas', PRODUCT_STORE_ID, 'orcamentos');
}

export function acompanharOrcamentos(onOrcamentos, onError) {
  return onSnapshot(
    query(getOrcamentosCollection(), orderBy('createdAt', 'desc')),
    (snapshot) => {
      onOrcamentos(snapshot.docs.map((document) => ({ ...document.data(), id: document.id })));
    },
    onError
  );
}

// Preços, desconto e frete em centavos; validade no formato AAAA-MM-DD.
export async function salvarOrcamento(orcamento, userId) {
  const { itens, cliente = {}, desconto = 0, frete = 0, validade = '', observacoes = '' } = orcamento;

  if (!userId) throw new Error('Entre novamente para salvar o orçamento.');
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new Error('Adicione produtos ao carrinho antes de gerar o orçamento.');
  }
  if (itens.some((item) => (
    !item.id || !item.nome || !Number.isSafeInteger(item.preco) || item.preco < 0
    || !Number.isSafeInteger(item.quantidade) || item.quantidade < 1
  ))) {
    throw new Error('Confira os preços e as quantidades dos produtos no carrinho.');
  }

  const subtotal = itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
  if (!Number.isSafeInteger(subtotal)
    || !Number.isSafeInteger(desconto) || desconto < 0 || desconto > subtotal
    || !Number.isSafeInteger(frete) || frete < 0
    || !Number.isSafeInteger(subtotal - desconto + frete)) {
    throw new Error('Confira o desconto, o frete e o total do orçamento.');
  }

  const document = await addDoc(getOrcamentosCollection(), {
    cliente: {
      nome: (cliente.nome || '').trim(),
      contato: (cliente.contato || '').trim(),
    },
    // Preserva os dados enviados, mesmo se o produto mudar no catálogo.
    itens: itens.map((item) => ({
      id: item.id,
      nome: item.nome,
      medida: item.medida || '',
      preco: item.preco,
      quantidade: item.quantidade,
    })),
    subtotal,
    desconto,
    frete,
    total: subtotal - desconto + frete,
    validade: validade.trim(),
    observacoes: observacoes.trim(),
    status: 'open',
    createdAt: serverTimestamp(),
    createdBy: userId,
  });

  return document.id;
}

export async function buscarOrcamento(id) {
  const document = await getDoc(doc(getOrcamentosCollection(), id));

  if (!document.exists()) return null;

  return { ...document.data(), id: document.id };
}

export async function vincularClienteAoOrcamento(id, clienteId) {
  const referencia = doc(getOrcamentosCollection(), id);
  const referenciaCliente = doc(db, 'lojas', PRODUCT_STORE_ID, 'clientes', clienteId);
  return runTransaction(db, async (transaction) => {
    const document = await transaction.get(referencia);
    const clienteDocument = await transaction.get(referenciaCliente);
    if (!document.exists()) throw new Error('Orçamento não encontrado.');
    if (!clienteDocument.exists()) throw new Error('Cliente não encontrado. Cadastre ou escolha outro cliente.');
    const dados = clienteDocument.data();
    const cliente = { id: clienteDocument.id, nome: dados.nome, contato: dados.telefone };
    transaction.update(referencia, { cliente });
    return { ...document.data(), id: document.id, cliente };
  });
}
