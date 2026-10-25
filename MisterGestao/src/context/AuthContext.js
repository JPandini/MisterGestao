import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

import { auth } from '../services/auth';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(auth));

  useEffect(() => {
    if (!auth) return undefined;

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
  }, []);

  async function signIn(email, password) {
    if (!auth) {
      throw new Error('Configure o Firebase no arquivo .env e reinicie o app.');
    }

    await signInWithEmailAndPassword(auth, email.trim(), password);
  }

  async function logOut() {
    if (!auth) return;

    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }

  return context;
}
