import { collection, doc, onSnapshot, orderBy, query, runTransaction, serverTimestamp } from 'firebase/firestore';

import { db } from './firebase';
import { PRODUCT_STORE_ID } from './products';

const caminho = (...partes) => doc(db, 'lojas', PRODUCT_STORE_ID, ...partes);

// Confirma a venda de um orçamento: confere estoque, baixa o estoque,
// marca o orçamento como convertido e registra a venda. Tudo junto ou nada.
export async function confirmarVenda(orcamentoId, userId) {
  return runTransaction(db, async (transaction) => {
    const refOrcamento = caminho('orcamentos', orcamentoId);
    const orcamento = (await transaction.get(refOrcamento)).data();
    if (!orcamento || orcamento.status !== 'open') {
      throw new Error('Esse orçamento já foi vendido ou não está mais aberto.');
    }

    const produtos = [];
    for (const item of orcamento.itens) {
      const ref = caminho('produtos', item.id);
      const produto = (await transaction.get(ref)).data();
      if (!produto) throw new Error(`O produto ${item.nome} não existe mais.`);
      if (produto.stock < item.quantidade) {
        throw new Error(`Estoque insuficiente de ${item.nome} (tem ${produto.stock}).`);
      }
      produtos.push({ ref, stock: produto.stock - item.quantidade });
    }

    produtos.forEach((produto) => transaction.update(produto.ref, { stock: produto.stock }));
    transaction.update(refOrcamento, { status: 'converted' });
    // A venda usa o mesmo código do orçamento: assim não existe venda duplicada
    transaction.set(caminho('vendas', orcamentoId), {
      orcamentoId,
      cliente: orcamento.cliente?.nome || '',
      total: orcamento.total,
      createdAt: serverTimestamp(),
      createdBy: userId,
    });
  });
}

export function acompanharVendas(onVendas, onError) {
  return onSnapshot(
    query(collection(db, 'lojas', PRODUCT_STORE_ID, 'vendas'), orderBy('createdAt', 'desc')),
    (snapshot) => onVendas(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    onError
  );
}
