import { collection, doc, onSnapshot, orderBy, query, runTransaction, serverTimestamp } from 'firebase/firestore';

import { db } from './firebase';
import { PRODUCT_STORE_ID } from './products';

// Confirma a venda de um orçamento.
// Usa uma transação: ou faz tudo, ou não faz nada (evita estoque errado).
export async function confirmarVenda(orcamentoId, userId) {
  await runTransaction(db, async (transacao) => {
    // 1. Busca o orçamento e confere se ainda está aberto
    const refOrcamento = doc(db, 'lojas', PRODUCT_STORE_ID, 'orcamentos', orcamentoId);
    const orcamento = (await transacao.get(refOrcamento)).data();

    if (!orcamento || orcamento.status !== 'open') {
      throw new Error('Esse orçamento já foi vendido ou não está mais aberto.');
    }

    // 2. Confere o estoque de cada produto
    const novosEstoques = [];

    for (const item of orcamento.itens) {
      const refProduto = doc(db, 'lojas', PRODUCT_STORE_ID, 'produtos', item.id);
      const produto = (await transacao.get(refProduto)).data();

      if (!produto) {
        throw new Error(`O produto ${item.nome} não existe mais.`);
      }
      if (produto.stock < item.quantidade) {
        throw new Error(`Estoque insuficiente de ${item.nome} (tem ${produto.stock}).`);
      }

      novosEstoques.push({ ref: refProduto, stock: produto.stock - item.quantidade });
    }

    // 3. Baixa o estoque
    for (const produto of novosEstoques) {
      transacao.update(produto.ref, { stock: produto.stock });
    }

    // 4. Marca o orçamento como vendido
    transacao.update(refOrcamento, { status: 'converted' });

    // 5. Registra a venda (com o mesmo código do orçamento, para não duplicar)
    transacao.set(doc(db, 'lojas', PRODUCT_STORE_ID, 'vendas', orcamentoId), {
      orcamentoId,
      cliente: orcamento.cliente?.nome || '',
      total: orcamento.total,
      createdAt: serverTimestamp(),
      createdBy: userId,
    });
  });
}

// Fica "ouvindo" as vendas e chama a função sempre que mudar
export function acompanharVendas(aoReceber, aoDarErro) {
  const consulta = query(collection(db, 'lojas', PRODUCT_STORE_ID, 'vendas'), orderBy('createdAt', 'desc'));

  return onSnapshot(
    consulta,
    (resultado) => aoReceber(resultado.docs.map((item) => ({ id: item.id, ...item.data() }))),
    aoDarErro
  );
}
