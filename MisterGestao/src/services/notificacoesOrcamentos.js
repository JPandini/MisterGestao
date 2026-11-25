import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';

import { db } from './firebase';

function colecaoDeNotificacoes(uid) {
  return collection(db, 'usuarios', uid, 'notificacoesOrcamentos');
}

export function acompanharNotificacoesOrcamentos(uid, onNotificacoes, onError) {
  const consulta = query(
    colecaoDeNotificacoes(uid),
    where('lida', '==', false),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(consulta, (snapshot) => {
    onNotificacoes(snapshot.docs.map((document) => ({ ...document.data(), id: document.id })));
  }, onError);
}

export function marcarNotificacaoComoLida(uid, id) {
  return updateDoc(doc(colecaoDeNotificacoes(uid), id), { lida: true });
}
