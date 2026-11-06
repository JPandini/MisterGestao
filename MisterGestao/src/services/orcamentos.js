import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';

import { db } from './firebase';
import { PRODUCT_STORE_ID } from './products';

function getOrcamentosCollection() {
  if (!db) {
    throw new Error('Configure o Firebase no arquivo .env para usar o Firestore.');
  }

  return collection(db, 'lojas', PRODUCT_STORE_ID, 'orcamentos');
}

// Preços, desconto e frete em centavos; validade no formato AAAA-MM-DD.
export async function salvarOrcamento(orcamento, userId) {
  const { itens, cliente = {}, desconto = 0, frete = 0, validade = '', observacoes = '' } = orcamento;

  const subtotal = itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0);

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
