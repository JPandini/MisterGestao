import React, { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView} from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Header Superior (Protótipo / Simular offline) */}
          <View style={styles.headerTop}>
            <View style={styles.badgeContainer}>
              <View style={styles.dot} />
              <Text style={styles.badgeText}>Protótipo · dados fictícios</Text>
            </View>
            <TouchableOpacity style={styles.offlineContainer}>
              <Feather name="wifi-off" size={14} color="#666" style={{ marginRight: 4 }} />
              <Text style={styles.offlineText}>Simular offline</Text>
            </TouchableOpacity>
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
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity 
              style={styles.button}
              onPress={() => router.replace('/home')}
            >
              <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>
          </View>

          {/* Rodapé / Informações */}
          <View style={styles.footer}>
            <Text style={styles.footerHelpText}>
              Toque em Entrar para acessar a demonstração.
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
  offlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineText: {
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
    shadowColor: '#D35400',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
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