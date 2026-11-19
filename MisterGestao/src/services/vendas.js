import { collection, doc, onSnapshot, orderBy, query, runTransaction, serverTimestamp } from 'firebase/firestore';

import { db } from './firebase';
import { PRODUCT_STORE_ID } from './products';
import { orcamentoVencido } from '../utils/orcamento';

// Confirma a venda de um orçamento.
// Usa uma transação: ou faz tudo, ou não faz nada (evita estoque errado).
export async function confirmarVenda(orcamentoId, userId) {
  if (!userId) throw new Error('Entre novamente para confirmar a venda.');
  if (!db || !orcamentoId) throw new Error('Não foi possível localizar o orçamento.');
  await runTransaction(db, async (transacao) => {
    // 1. Busca o orçamento e confere se ainda está aberto
    const refOrcamento = doc(db, 'lojas', PRODUCT_STORE_ID, 'orcamentos', orcamentoId);
    const orcamento = (await transacao.get(refOrcamento)).data();

    if (!orcamento || orcamento.status !== 'open') {
      throw new Error('Esse orçamento já foi vendido ou não está mais aberto.');
    }
    if (orcamentoVencido(orcamento)) {
      throw new Error('Este orçamento venceu. Gere um novo orçamento para confirmar a venda.');
    }
    if (!orcamento.itens?.length || !Number.isSafeInteger(orcamento.total) || orcamento.total < 0) {
      throw new Error('Os dados deste orçamento são inválidos. Gere um novo orçamento.');
    }
    // Agrupa também orçamentos antigos com o mesmo produto em mais de uma linha.
    const quantidades = new Map();
    for (const item of orcamento.itens) {
      const quantidade = (quantidades.get(item.id)?.quantidade || 0) + item.quantidade;
      if (!item.id || !Number.isSafeInteger(item.quantidade) || item.quantidade < 1
        || !Number.isSafeInteger(quantidade)) {
        throw new Error('Confira as quantidades deste orçamento antes de vender.');
      }
      quantidades.set(item.id, { ...item, quantidade });
    }

    // 2. Confere o estoque de cada produto
    const novosEstoques = [];

    for (const item of quantidades.values()) {
      const refProduto = doc(db, 'lojas', PRODUCT_STORE_ID, 'produtos', item.id);
      const produto = (await transacao.get(refProduto)).data();

      if (!produto) {
        throw new Error(`O produto ${item.nome} não existe mais.`);
      }
      if (!Number.isSafeInteger(produto.stock) || produto.stock < item.quantidade) {
        throw new Error(`Estoque insuficiente de ${item.nome} (tem ${produto.stock}).`);
      }

      novosEstoques.push({ ref: refProduto, stock: produto.stock - item.quantidade, item });
    }

    // 3. Baixa o estoque e registra a saída de cada produto (para o dashboard)
    for (const produto of novosEstoques) {
      transacao.update(produto.ref, { stock: produto.stock });
      transacao.set(doc(collection(db, 'lojas', PRODUCT_STORE_ID, 'movimentos')), {
        produtoId: produto.item.id,
        produto: produto.item.nome,
        quantidade: -produto.item.quantidade,
        tipo: 'venda',
        createdAt: serverTimestamp(),
        createdBy: userId,
      });
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

// Fica "ouvindo" as entradas e saídas de estoque
export function acompanharMovimentos(aoReceber, aoDarErro) {
  const consulta = query(collection(db, 'lojas', PRODUCT_STORE_ID, 'movimentos'), orderBy('createdAt', 'desc'));

  return onSnapshot(
    consulta,
    (resultado) => aoReceber(resultado.docs.map((item) => ({ id: item.id, ...item.data() }))),
    aoDarErro
  );
}
