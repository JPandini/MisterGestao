import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/app/AppNavigator';
import OrcamentoPublico from './src/view/OrcamentoPublico';

// Link enviado ao cliente: site/?orcamento=ID abre o orçamento sem login
const orcamentoDoLink = Platform.OS === 'web'
  ? new URLSearchParams(window.location.search).get('orcamento')
  : null;

export default function App() {
  if (orcamentoDoLink) return <OrcamentoPublico id={orcamentoDoLink} />;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
