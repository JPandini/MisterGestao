import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../services/authErrors';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator} from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);
  const { signIn } = useAuth();

  async function handleSignIn() {
    if (submitting.current) return;
    setError('');

    if (!email.trim() || !password) {
      setError('Preencha o e-mail e a senha.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Informe um e-mail válido.');
      return;
    }

    submitting.current = true;
    setIsSubmitting(true);
    try {
      // O observador de sessão libera a Home somente aps autenticar
      await signIn(email, password);
    } catch (signInError) {
      setError(getAuthErrorMessage(signInError));
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Identificação do acesso */}
          <View style={styles.headerTop}>
            <View style={styles.badgeContainer}>
              <View style={styles.dot} />
              <Text style={styles.badgeText}>Acesso da equipe</Text>
            </View>
          </View>

          {/* Logo / Marca */}
          <View style={styles.logoContainer}>
            <View style={styles.iconBox}>
              <Feather name="shopping-bag" size={24} color="#D35400" />
            </View>
            <Text style={styles.logoTitle}>MISTER GESTÃO</Text>
            <Text style={styles.logoSubtitle}>ATENDIMENTO E GESTÃO MOBILE</Text>
          </View>

          {/* Títulos de Boas-vindas */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.title}>Bom ter você aqui.</Text>
            <Text style={styles.subtitle}>
              Entre para cuidar das vendas e do estoque da sua loja.
            </Text>
          </View>

          {/* Formulário */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                placeholder="voce@loja.com.br"
                placeholderTextColor="#A0A0A0"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                style={styles.input}
                placeholder="Sua senha"
                placeholderTextColor="#A0A0A0"
                secureTextEntry
                editable={!isSubmitting}
                onSubmitEditing={handleSignIn}
                returnKeyType="go"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {error ? <Text style={styles.errorText} accessibilityRole="alert">{error}</Text> : null}
            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
            >
              {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : null}
              <Text style={styles.buttonText}>{isSubmitting ? 'Entrando...' : 'Entrar'}</Text>
            </TouchableOpacity>
          </View>

          {/* Rodapé / Informações */}
          <View style={styles.footer}>
            <Text style={styles.footerHelpText}>
              Use o e-mail e a senha cadastrados para sua equipe.
            </Text>
            <Text style={styles.footerBrand}>
              MisterGestão • Mister MotoPlace
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666',
    marginRight: 6,
  },
  badgeText: {
    fontSize: 12,
    color: '#666',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FDF2EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FADBD8',
  },
  logoTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#D35400',
    letterSpacing: 1,
    textAlign: 'center',
  },
  logoSubtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#555',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  welcomeContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#444',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  button: {
    height: 50,
    backgroundColor: '#D35400',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#D35400',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonDisabled: { opacity: 0.65 },
  errorText: { color: '#B42318', fontSize: 13, marginBottom: 8 },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
  },
  footerHelpText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  footerBrand: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
});