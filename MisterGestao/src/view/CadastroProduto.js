
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { createProduct } from '../services/products';
import Header from '../components/Header';
import Button from '../components/Button';
import FormField from '../components/FormField';

const EMPTY_FORM = {
  name: '',
  category: '',
  brand: '',
  measure: '',
  price: '',
  stock: '',
  minimum: '',
  code: '',
};

const PRICE_PATTERN = /^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/;
const INTEGER_PATTERN = /^\d+$/;

const parsePriceToCents = (text) => {
  const value = text.trim();
  if (!PRICE_PATTERN.test(value)) return null;

  const [whole, fraction = ''] = value.split(',');
  const cents = Number(whole.replace(/\./g, '')) * 100 + Number((fraction + '00').slice(0, 2));

  return Number.isSafeInteger(cents) ? cents : null;
};

const validate = (form) => {
  const errors = {};
  const priceInCents = parsePriceToCents(form.price);

  if (!form.name.trim()) {
    errors.name = 'Informe o nome do produto.';
  }

  if (priceInCents === null) {
    errors.price = 'Use o formato 54,90.';
  } else if (priceInCents <= 0) {
    errors.price = 'O preço precisa ser maior que zero.';
  }

  if (!INTEGER_PATTERN.test(form.stock.trim()) || !Number.isSafeInteger(Number(form.stock))) {
    errors.stock = 'Use um número inteiro, zero ou maior.';
  }

  if (!INTEGER_PATTERN.test(form.minimum.trim()) || !Number.isSafeInteger(Number(form.minimum))) {
    errors.minimum = 'Use um número inteiro, zero ou maior.';
  }

  return errors;
};

export default function CadastroProdutoScreen({ navigation }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState('success');
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);
  const { user } = useAuth();
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Equipe';

  const updateField = (field) => (value) => {
    setForm((current) => ({ ...current, [field]: value }));

    if (field === 'lucro'){
      setForm((current) => ({...current, price : String(parseInt(value) * parseInt(['lucro']))}))
    }
  };

  const handleSave = async () => {
    if (saving.current) return;

    const nextErrors = validate(form);

    setErrors(nextErrors);
    setNotice('');
    setNoticeType('success');

    if (Object.keys(nextErrors).length > 0) return;

    if (!user?.uid) {
      setNoticeType('error');
      setNotice('Entre novamente para cadastrar produtos.');
      return;
    }

    saving.current = true;
    setIsSaving(true);

    try {
      await createProduct(
        {
          name: form.name,
          category: form.category,
          brand: form.brand,
          measure: form.measure,
          code: form.code,
          price: parsePriceToCents(form.price),
          stock: Number(form.stock),
          minimum: Number(form.minimum),
        },
        user.uid
      );

      setForm({ ...EMPTY_FORM });
      setErrors({});
      setNotice('Produto salvo. Ele já aparece na lista de produtos.');
    } catch (error) {
      setNoticeType('error');
      setNotice(
        error?.code === 'permission-denied'
          ? 'O banco recusou o cadastro. Entre novamente e tente salvar o produto.'
          : 'Não foi possível salvar o produto. Verifique a conexão e tente novamente.'
      );
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <Header userName={userName} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs', { screen: 'Home' }))}
          >
            <Feather name="arrow-left" size={16} color="#626975" />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>

          <View style={styles.greeting}>
            <Text style={styles.pageTitle}>Cadastro de produto</Text>
            <Text style={styles.pageSubtitle}>Adicione um item ao estoque da loja.</Text>
          </View>

          <FormField
            label="Nome"
            placeholder="Ex.: Câmara reforçada Rinaldi"
            value={form.name}
            onChangeText={updateField('name')}
            editable={!isSaving}
            error={errors.name}
          />

          <FormField
            label="Categoria"
            optional
            placeholder="Ex.: Câmaras"
            value={form.category}
            onChangeText={updateField('category')}
            editable={!isSaving}
          />

          <FormField
            label="Marca"
            optional
            placeholder="Ex.: Rinaldi"
            value={form.brand}
            onChangeText={updateField('brand')}
            editable={!isSaving}
          />

          <FormField
            label="Medida"
            optional
            placeholder="Ex.: RD18 ou 300 ml"
            value={form.measure}
            onChangeText={updateField('measure')}
            editable={!isSaving}
          />

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <FormField
                label="Valor de compra (R$)"
                placeholder="54,90"
                keyboardType="decimal-pad"
                value={String(form.value ?? '')}
                onChangeText={updateField('value')}
                editable={!isSaving}
              />
            </View>
            <View style={styles.rowItem}>
              <FormField
                label="Margem de lucro"
                placeholder="30%"
                keyboardType="decimal-pad"
                value={String(form.lucro ?? '')}
                onChangeText={updateField('lucro')}
                editable={!isSaving}
              />
            </View>
          </View>

          <FormField
            label="Preço (R$)"
            placeholder="54,90"
            keyboardType="decimal-pad"
            value={form.price}
            onChangeText={updateField('price')}
            editable={!isSaving}
            error={errors.price}
          />

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <FormField
                label="Saldo"
                placeholder="0"
                keyboardType="number-pad"
                value={form.stock}
                onChangeText={updateField('stock')}
                editable={!isSaving}
                error={errors.stock}
              />
            </View>
            <View style={styles.rowItem}>
              <FormField
                label="Estoque mínimo"
                placeholder="0"
                keyboardType="number-pad"
                value={form.minimum}
                onChangeText={updateField('minimum')}
                editable={!isSaving}
                error={errors.minimum}
              />
            </View>
          </View>

          <FormField
            label="Código"
            optional
            placeholder="Ex.: CAM-003"
            autoCapitalize="characters"
            value={form.code}
            onChangeText={updateField('code')}
            editable={!isSaving}
          />

          <Button
            title="Salvar produto"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
            style={styles.primaryButton}
          />

          <Button
            title="Cancelar"
            variant="secondary"
            onPress={() => navigation.popTo('MainTabs', { screen: 'Home' })}
            disabled={isSaving}
            style={styles.secondaryButton}
          />

          {notice ? (
            <Text
              style={[styles.notice, noticeType === 'error' && styles.noticeError]}
              accessibilityRole={noticeType === 'error' ? 'alert' : 'status'}
            >
              {notice}
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flex: 1, backgroundColor: '#F7F7F8' },
  content: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 28 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  backText: { fontSize: 13, color: '#626975' },
  greeting: { marginBottom: 16 },
  pageTitle: { fontSize: 22, lineHeight: 27, fontWeight: '800', color: '#151619', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, lineHeight: 18, color: '#7E8086', marginTop: 4 },
  row: { flexDirection: 'row', gap: 10 },
  rowItem: { flex: 1, minWidth: 0 },
  primaryButton: { marginTop: 6 },
  secondaryButton: { marginTop: 10 },
  notice: { fontSize: 12, lineHeight: 17, color: '#626975', textAlign: 'center', marginTop: 14 },
  noticeError: { color: '#B42318' },
});
