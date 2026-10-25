import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { missingFirebaseValues } from '../services/firebase';

export default function FirebaseSetupScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.brand}>Mister<Text style={styles.brandAccent}>Gestão</Text></Text>
        <Text style={styles.title}>Configure o Firebase</Text>
        <Text style={styles.description}>
          O app abriu, mas ainda não consegue acessar o Firebase. Configure as variáveis abaixo para liberar o login e os produtos.
        </Text>

        <View style={styles.steps}>
          <Text style={styles.step}>1. Copie .env.example para um arquivo chamado .env.</Text>
          <Text style={styles.step}>2. Preencha os valores em Firebase Console → Configurações do projeto → Seus apps.</Text>
          <Text style={styles.step}>3. Reinicie o Expo com npx expo start --clear.</Text>
        </View>

        <View style={styles.missingList}>
          <Text style={styles.missingTitle}>Variáveis que faltam:</Text>
          {missingFirebaseValues.map((value) => (
            <Text key={value} style={styles.missingValue}>{value}</Text>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
    backgroundColor: '#F7F7F8',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  brand: { fontSize: 18, fontWeight: '800', color: '#18191C' },
  brandAccent: { color: '#C94700' },
  title: { marginTop: 28, fontSize: 24, fontWeight: '800', color: '#151619' },
  description: { marginTop: 10, fontSize: 14, lineHeight: 21, color: '#626975' },
  steps: { gap: 12, marginTop: 22 },
  step: { fontSize: 14, lineHeight: 20, color: '#444850' },
  missingList: { gap: 7, marginTop: 24, paddingTop: 18, borderTopWidth: 1, borderTopColor: '#ECEDEF' },
  missingTitle: { marginBottom: 3, fontSize: 13, fontWeight: '700', color: '#444850' },
  missingValue: { fontSize: 11, color: '#777B84' },
});
