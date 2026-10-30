import { ScrollView, StatusBar, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

export default function UpcomingScreen({ route, navigation }) {
  const { user } = useAuth();
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Equipe';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Header userName={userName} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>TESTEEEE</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flexGrow: 1, backgroundColor: '#F6F6F7', padding: 16 },
});
