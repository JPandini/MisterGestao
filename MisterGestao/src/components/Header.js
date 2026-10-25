import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function Header({ userName = 'Equipe', onSignOut, isSigningOut = false }) {
  const navigation = useNavigation();
  const initials = (userName || 'JP').slice(0, 2).toUpperCase();

  function goHome() {
    const rootNavigation = navigation.getParent('AuthenticatedStack') || navigation;
    rootNavigation.popTo('MainTabs', { screen: 'Home' });
  }

  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={goHome}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Mister Gestão, voltar para a tela inicial"
      >
        <View style={styles.brandLine}>
          <Text style={styles.brandMister}>Mister </Text>
          <Text style={styles.brandGestao}>Gestão</Text>
        </View>
        <Text style={styles.subtitle}>Mister MotoPlace</Text>
      </TouchableOpacity>

      <View style={styles.actions}>
        {onSignOut ? (
          <TouchableOpacity
            onPress={onSignOut}
            disabled={isSigningOut}
            accessibilityRole="button"
            accessibilityState={{ disabled: isSigningOut, busy: isSigningOut }}
            style={styles.signOutButton}
          >
            <Text style={styles.signOutText}>{isSigningOut ? 'Saindo...' : 'Sair'}</Text>
          </TouchableOpacity>
        ) : (
          <Feather name="bell" size={20} color="#626975" />
        )}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  brandLine: { flexDirection: 'row', alignItems: 'baseline' },
  brandMister: { fontSize: 17, fontWeight: '800', color: '#18191C', letterSpacing: -0.6 },
  brandGestao: { fontSize: 17, fontWeight: '800', color: '#F45108', letterSpacing: -0.6 },
  subtitle: { fontSize: 9, color: '#7C818A', marginTop: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  signOutButton: { paddingHorizontal: 10, paddingVertical: 12 },
  signOutText: { fontSize: 12, fontWeight: '600', color: '#626975' },
  avatar: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F1F3',
  },
  avatarText: { fontSize: 9, fontWeight: '700', color: '#5B606A' },
});
