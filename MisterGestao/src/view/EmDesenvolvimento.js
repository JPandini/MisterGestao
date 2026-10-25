import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Header from '../components/Header';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

const FEATURES = {
  Orcamentos: {
    title: 'Orçamentos',
    icon: 'clipboard-text-outline',
    description: 'A criação e a consulta de orçamentos ainda estão em desenvolvimento.',
  },
  Venda: {
    title: 'Venda',
    icon: 'cart-outline',
    description: 'O registro de vendas ainda está em desenvolvimento.',
  },
};

export default function UpcomingScreen({ route, navigation }) {
  const { user } = useAuth();
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Equipe';
  const feature = FEATURES[route.name];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Header userName={userName} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{feature.title}</Text>
        <View style={styles.emptyState}>
          <View style={styles.icon}>
            <MaterialCommunityIcons name={feature.icon} size={36} color="#F45108" />
          </View>
          <Text style={styles.emptyTitle}>Em breve</Text>
          <Text style={styles.description}>{feature.description}</Text>
          <Button
            title="Ver produtos"
            variant="secondary"
            onPress={() => navigation.navigate('Produtos')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flexGrow: 1, backgroundColor: '#F6F6F7', padding: 16 },
  title: { color: '#18191C', fontSize: 24, fontWeight: '800', marginTop: 8 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 32 },
  icon: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { color: '#18191C', fontSize: 20, fontWeight: '700' },
  description: { color: '#7C818A', fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 300 },
});
