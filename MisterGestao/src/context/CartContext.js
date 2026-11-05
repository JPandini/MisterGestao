import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext(undefined);

const CHAVE_CARRINHO = '@carrinho';

export function CartProvider({ children }) {
  const [itens, setItens] = useState([]);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    const carregarCarrinho = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(CHAVE_CARRINHO);
        if (jsonValue !== null) {
          setItens(JSON.parse(jsonValue));
        }
      } catch (e) {
        console.error('Erro ao carregar o carrinho:', e);
      } finally {
        setCarregado(true);
      }
    };

    carregarCarrinho();
  }, []);

  useEffect(() => {
    if (!carregado) return;

    const salvarCarrinho = async () => {
      try {
        await AsyncStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens));
      } catch (e) {
        console.error('Erro ao salvar o carrinho:', e);
      }
    };

    salvarCarrinho();
  }, [itens, carregado]);

  function adicionar(produto) {
    const existe = itens.find((item) => item.id === produto.id);

    if (existe) {
      alterarQuantidade(produto.id, existe.quantidade + 1);
    } else {
      setItens([
        ...itens,
        { id: produto.id, nome: produto.name, medida: produto.measure, preco: produto.price, quantidade: 1 },
      ]);
    }
  }

  function alterarQuantidade(id, quantidade) {
    if (quantidade < 1) {
      remover(id);
      return;
    }

    setItens(itens.map((item) => (item.id === id ? { ...item, quantidade } : item)));
  }

  function remover(id) {
    setItens(itens.filter((item) => item.id !== id));
  }

  function limpar() {
    setItens([]);
  }

  const totalItens = itens.reduce((soma, item) => soma + item.quantidade, 0);
  const total = itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0);

  return (
    <CartContext.Provider
      value={{ itens, totalItens, total, adicionar, alterarQuantidade, remover, limpar }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
