import { createContext, useContext, useEffect, useState } from 'react';

import { acompanharNotificacoesOrcamentos, marcarNotificacaoComoLida } from '../services/notificacoesOrcamentos';

const NotificacoesContext = createContext(null);

export function NotificacoesProvider({ uid, children }) {
  const [notificacoes, setNotificacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [erroLeitura, setErroLeitura] = useState('');
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => acompanharNotificacoesOrcamentos(uid, (dados) => {
    setNotificacoes(dados);
    setCarregando(false);
    setErro('');
  }, () => {
    setCarregando(false);
    setErro('Não foi possível carregar as notificações.');
  }), [uid, tentativa]);

  function tentarNovamente() {
    setCarregando(true);
    setErro('');
    setTentativa((valor) => valor + 1);
  }

  function marcarComoLida(id) {
    setErroLeitura('');
    marcarNotificacaoComoLida(uid, id).catch(() => {
      setErroLeitura('Não foi possível marcar a notificação como lida. Tente abri-la novamente.');
    });
  }

  return (
    <NotificacoesContext.Provider value={{ notificacoes, carregando, erro, erroLeitura, tentarNovamente, marcarComoLida }}>
      {children}
    </NotificacoesContext.Provider>
  );
}

export function useNotificacoes() {
  return useContext(NotificacoesContext);
}
