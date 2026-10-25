import { createContext, useContext, useEffect, useState } from 'react';

import { subscribeToProducts } from '../services/products';

const ProductsContext = createContext(undefined);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    return subscribeToProducts(
      (nextProducts) => {
        setProducts(nextProducts);
        setIsLoading(false);
      },
      (firestoreError) => {
        setProducts([]);
        setIsLoading(false);
        setError(
          firestoreError.code === 'permission-denied'
            ? 'O banco recusou a consulta. Entre novamente e tente carregar os produtos.'
            : 'Não foi possível carregar os produtos. Verifique a conexão e tente novamente.'
        );
      }
    );
  }, [reloadCount]);

  function retry() {
    setIsLoading(true);
    setError('');
    setReloadCount((count) => count + 1);
  }

  return (
    <ProductsContext.Provider value={{ products, isLoading, error, retry }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);

  if (!context) {
    throw new Error('useProducts deve ser usado dentro de ProductsProvider.');
  }

  return context;
}
