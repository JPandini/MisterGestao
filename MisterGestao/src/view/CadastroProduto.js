import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import { useAuth } from '../context/AuthContext';
import { createProduct, listarNomes } from '../services/products';
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

const validate = (form, categorias, marcas) => {
  const errors = {};
  const priceInCents = parsePriceToCents(form.price);

  if (!form.name.trim()) {
    errors.name = 'Informe o nome do produto.';
  }

  if (!form.category) {
    errors.category = 'Selecione uma categoria.';
  } else if (!categorias.some((item) => item.name === form.category)) {
    errors.category = 'Selecione uma categoria cadastrada.';
  }

  if (!form.brand) {
    errors.brand = 'Selecione uma marca.';
  } else if (!marcas.some((item) => item.name === form.brand)) {
    errors.brand = 'Selecione uma marca cadastrada.';
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

// Lista com pesquisa: aceita somente opções cadastradas no Firestore.
function CampoSelect({
  label,
  opcoes,
  value,
  onSelect,
  placeholder,
  error,
  disabled,
  aberto,
  onOpenChange,
}) {
  const [termo, setTermo] = useState('');
  const estaAberto = aberto && !disabled;
  const normalizar = (texto) =>
    texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const busca = normalizar(termo);
  const opcoesFiltradas = opcoes.filter((item) => normalizar(item.name).includes(busca));

  function selecionar(item) {
    onSelect(item.name);
    setTermo('');
    onOpenChange(false);
    Keyboard.dismiss();
  }

  function alternar() {
    setTermo('');
    onOpenChange(!estaAberto);
  }

  return (
    <View style={[styles.selectField, estaAberto && styles.selectFieldOpen]}>
      <Text style={styles.selectLabel}>{label}</Text>

      <View style={styles.selectControl}>
        <Pressable
          style={[
            styles.selectButton,
            estaAberto && styles.selectButtonOpen,
            error && styles.selectButtonError,
            disabled && styles.selectButtonDisabled,
          ]}
          onPress={alternar}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityState={{ disabled, expanded: estaAberto }}
          accessibilityLabel={`${label}: ${value || placeholder}`}
        >
          <Text numberOfLines={1} style={[styles.selectValue, !value && styles.selectPlaceholder]}>
            {value || placeholder}
          </Text>
          <Feather name={estaAberto ? 'chevron-up' : 'chevron-down'} size={16} color="#626975" />
        </Pressable>

        {estaAberto ? (
          <View style={styles.dropdown}>
            <View style={styles.dropdownSearchContainer}>
              <TextInput
                style={styles.dropdownSearch}
                value={termo}
                onChangeText={setTermo}
                placeholder={`Buscar ${label.toLowerCase()}...`}
                placeholderTextColor="#9A9CA1"
                accessibilityLabel={`Buscar ${label.toLowerCase()}`}
                autoCorrect={false}
                autoCapitalize="none"
                autoFocus
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Escape') onOpenChange(false);
                }}
              />
            </View>

            {opcoesFiltradas.length > 0 ? (
              <ScrollView
                style={styles.dropdownOptions}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                showsVerticalScrollIndicator
              >
                {opcoesFiltradas.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.selectOption, item.name === value && styles.selectOptionSelected]}
                    onPress={() => selecionar(item)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: item.name === value }}
                  >
                    <Text
                      style={[styles.selectOptionText, item.name === value && styles.selectOptionTextSelected]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyOptions}>
                {opcoes.length === 0 ? 'Nenhuma opção cadastrada.' : 'Nenhuma opção encontrada.'}
              </Text>
            )}
          </View>
        ) : null}
      </View>

      {error ? <Text style={styles.selectError}>{error}</Text> : null}
    </View>
  );
}

export default function CadastroProdutoScreen({ navigation }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState('success');
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);
  const { user } = useAuth();
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Equipe';
  const [marcas, setMarcas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [selectAberto, setSelectAberto] = useState(null);
  const [foto, setFoto] = useState('');
  const [cameraAberta, setCameraAberta] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        setMarcas(await listarNomes('marcas'));
        setCategorias(await listarNomes('categorias'));
      } catch (e) {
        console.error('Erro ao carregar marcas e categorias:', e);
      }
    };
    carregar();
  }, []);

  const abrirCamera = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === 'granted') {
      setCameraAberta(true);
    } else {
      setNoticeType('error');
      setNotice('Acesso à câmera negado!');
    }
  };

  const tirarFoto = async () => {
    try {
      const resultado = await cameraRef.current.takePictureAsync({ quality: 0.1, base64: true });
      const imagem = resultado.base64.startsWith('data:')
        ? resultado.base64
        : `data:image/jpg;base64,${resultado.base64}`;

      if (imagem.length > 900000) {
        setNoticeType('error');
        setNotice('A foto ficou muito grande. Tente de novo.');
      } else {
        setFoto(imagem);
      }
    } catch (e) {
      console.error('Erro ao tirar foto:', e);
    }
    setCameraAberta(false);
  };

  const updateField = (field) => (value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (saving.current) return;

    const nextErrors = validate(form, categorias, marcas);

    setErrors(nextErrors);
    setNotice('');
    setNoticeType('success');

    if (Object.keys(nextErrors).length > 0) return;

    if (!user?.uid) {
      setNoticeType('error');
      setNotice('Entre novamente para cadastrar produtos.');
      return;
    }

    setSelectAberto(null);
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
          photo: foto,
        },
        user.uid
      );

      setForm({ ...EMPTY_FORM });
      setFoto('');
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

  if (cameraAberta) {
    return (
      <View style={styles.flex}>
        <CameraView ref={cameraRef} style={styles.flex} facing="back" />
        <View style={styles.cameraBotoes}>
          <Button title="Tirar foto" onPress={tirarFoto} />
          <Button title="Cancelar" variant="secondary" onPress={() => setCameraAberta(false)} />
        </View>
      </View>
    );
  }

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

          <CampoSelect
            opcoes={categorias}
            label="Categoria"
            placeholder="Selecione uma categoria"
            value={form.category}
            onSelect={updateField('category')}
            disabled={isSaving}
            error={errors.category}
            aberto={selectAberto === 'category'}
            onOpenChange={(open) => setSelectAberto(open ? 'category' : null)}
          />

          <CampoSelect
            opcoes={marcas}
            label="Marca"
            placeholder="Selecione uma marca"
            value={form.brand}
            onSelect={updateField('brand')}
            disabled={isSaving}
            error={errors.brand}
            aberto={selectAberto === 'brand'}
            onOpenChange={(open) => setSelectAberto(open ? 'brand' : null)}
          />

          <FormField
            label="Medida"
            placeholder="Ex.: RD18 ou 300 ml"
            value={form.measure}
            onChangeText={updateField('measure')}
            editable={!isSaving}
          />

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

          {foto ? <Image source={{ uri: foto }} style={styles.foto} /> : null}
          <Button
            title={foto ? 'Tirar outra foto' : 'Tirar foto'}
            variant="secondary"
            onPress={abrirCamera}
            disabled={isSaving}
            style={styles.secondaryButton}
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
  selectField: { marginBottom: 14, position: 'relative', zIndex: 1 },
  selectFieldOpen: { zIndex: 1000, elevation: 10 },
  selectLabel: { fontSize: 12, fontWeight: '600', color: '#444850', marginBottom: 6 },
  selectControl: { position: 'relative' },
  selectButton: {
    height: 44,
    borderWidth: 1,
    borderColor: '#D2D4D8',
    borderRadius: 2,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectButtonOpen: {
    borderColor: '#B8BCC3',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  selectButtonError: { borderColor: '#C94700' },
  selectButtonDisabled: { opacity: 0.6 },
  selectValue: { flex: 1, marginRight: 8, fontSize: 14, color: '#151619' },
  selectPlaceholder: { color: '#9A9CA1' },
  selectError: { fontSize: 11, color: '#C94700', marginTop: 5 },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: -1,
    zIndex: 1001,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#B8BCC3',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  dropdownSearchContainer: { padding: 4 },
  dropdownSearch: {
    height: 36,
    borderWidth: 1,
    borderColor: '#D2D4D8',
    borderRadius: 0,
    paddingVertical: 0,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#151619',
    backgroundColor: '#FFFFFF',
  },
  dropdownOptions: { maxHeight: 180 },
  selectOption: {
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  selectOptionSelected: { backgroundColor: '#5897FB' },
  selectOptionText: { fontSize: 14, color: '#151619' },
  selectOptionTextSelected: { color: '#FFFFFF' },
  emptyOptions: { padding: 16, textAlign: 'center', color: '#7E8086' },
  foto: { width: 120, height: 120, borderRadius: 10, alignSelf: 'center' },
  cameraBotoes: { gap: 10, padding: 16, backgroundColor: '#FFFFFF' },
  notice: { fontSize: 12, lineHeight: 17, color: '#626975', textAlign: 'center', marginTop: 14 },
  noticeError: { color: '#B42318' },
});
