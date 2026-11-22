import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductsContext';
import { createProduct, listarNomes, subscribeToNextProductCode, updateProduct } from '../services/products';
import { productCodePrefix } from '../utils/productCodes';
import { prepararFotoProduto } from '../utils/productPhoto';
import { centsToInput, parsePriceToCents } from '../utils/money';
import { calculateProfitPercentage, parseProfitPercentage, updateProductPricing } from '../utils/productPricing';
import Header from '../components/Header';
import Button from '../components/Button';
import FormField from '../components/FormField';

const EMPTY_FORM = {
  name: '',
  category: '',
  brand: '',
  measure: '',
  price: '',
  costPrice: '',
  profitPercentage: '',
  pricingSource: 'profitPercentage',
  stock: '',
  minimum: '',
};

const INTEGER_PATTERN = /^\d+$/;

function preencherForm(produto) {
  if (!produto) return EMPTY_FORM;
  const lucro = calculateProfitPercentage(produto.costPrice, produto.price);
  return {
    name: produto.name ?? '',
    category: produto.category ?? '',
    brand: produto.brand ?? '',
    measure: produto.measure ?? '',
    price: produto.price == null ? '' : centsToInput(produto.price),
    costPrice: produto.costPrice == null ? '' : centsToInput(produto.costPrice),
    profitPercentage: lucro === null ? '' : lucro.toFixed(2).replace('.', ','),
    pricingSource: 'price',
    stock: String(produto.stock ?? ''),
    minimum: String(produto.minimum ?? ''),
  };
}

const validate = (form, categorias, marcas, original) => {
  const errors = {};
  const priceInCents = parsePriceToCents(form.price);
  const costInCents = parsePriceToCents(form.costPrice);

  if (!form.name.trim()) {
    errors.name = 'Informe o nome do produto.';
  }

  if (!original || form.category !== (original.category ?? '')) {
    if (!form.category) {
      errors.category = 'Selecione uma categoria.';
    } else if (!categorias.some((item) => item.name === form.category)) {
      errors.category = 'Selecione uma categoria cadastrada.';
    } else if (!original) {
      try { productCodePrefix(form.category); } catch { errors.category = 'A categoria precisa conter letras.'; }
    }
  }

  if (!original || form.brand !== (original.brand ?? '')) {
    if (!form.brand) {
      errors.brand = 'Selecione uma marca.';
    } else if (!marcas.some((item) => item.name === form.brand)) {
      errors.brand = 'Selecione uma marca cadastrada.';
    }
  }

  if (priceInCents === null) {
    errors.price = 'Use o formato 54,90.';
  } else if (priceInCents <= 0) {
    errors.price = 'O valor de venda precisa ser maior que zero.';
  }
  const custoOpcionalVazio = original && original.costPrice == null && !form.costPrice.trim();
  if (!custoOpcionalVazio) {
    if (costInCents === null) errors.costPrice = 'Use o formato 54,90.';
    else if (costInCents <= 0) errors.costPrice = 'O valor de custo precisa ser maior que zero.';
    if (parseProfitPercentage(form.profitPercentage) === null) {
      errors.profitPercentage = 'Informe o percentual, como 25 ou 25,50, maior que -100%.';
    }
  }

  if (!original && (!INTEGER_PATTERN.test(form.stock.trim()) || !Number.isSafeInteger(Number(form.stock)))) {
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

export default function CadastroProdutoScreen({ navigation, route }) {
  const { products, isLoading, error, retry } = useProducts();
  if (route?.name !== 'EditarProduto') return <ProdutoForm navigation={navigation} />;

  const produto = products.find((item) => item.id === route.params?.id);
  if (produto) return <ProdutoForm key={produto.id} navigation={navigation} produto={produto} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      <View style={styles.content}>
        <Button title="Voltar" variant="secondary" onPress={() => navigation.goBack()} />
        {isLoading ? (
          <ActivityIndicator color="#C94700" accessibilityLabel="Carregando produto" style={styles.secondaryButton} />
        ) : (
          <Text style={styles.notice} accessibilityRole="alert">{error || 'Produto não encontrado.'}</Text>
        )}
        {error ? <Button title="Tentar novamente" variant="secondary" onPress={retry} style={styles.secondaryButton} /> : null}
      </View>
    </SafeAreaView>
  );
}

function ProdutoForm({ navigation, produto }) {
  const [original] = useState(produto);
  const editando = Boolean(original);
  const [form, setForm] = useState(() => preencherForm(original));
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
  const [foto, setFoto] = useState(original?.photo || '');
  const [processandoFoto, setProcessandoFoto] = useState(false);
  const fotoEmAndamento = useRef(false);
  const [preview, setPreview] = useState(null);
  const [tentativaCodigo, setTentativaCodigo] = useState(0);
  const categoryId = categorias.find((item) => item.name === form.category)?.id;
  const codePreview = preview?.categoryId === categoryId ? preview : null;

  useEffect(() => {
    if (editando || !categoryId) return;
    return subscribeToNextProductCode({ id: categoryId, name: form.category }, (code) => {
      setPreview({ categoryId, code });
    }, (error) => {
      setPreview({ categoryId, error: error.code === 'permission-denied'
        ? 'O Firebase bloqueou a consulta do código. Publique as regras atualizadas e tente novamente.'
        : 'Não foi possível consultar o próximo código. Confira a conexão e tente novamente.' });
    });
  }, [categoryId, editando, form.category, tentativaCodigo]);

  useEffect(() => {
    const carregar = async () => {
      try {
        const [brands, categories] = await Promise.all([listarNomes('marcas'), listarNomes('categorias')]);
        setMarcas(brands);
        setCategorias(categories);
      } catch {
        setNoticeType('error');
        setNotice('Não foi possível carregar marcas e categorias. Volte e abra o formulário novamente.');
      }
    };
    carregar();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let ativa = true;
    async function recuperarFoto() {
      try {
        const resultado = await ImagePicker.getPendingResultAsync();
        if (resultado && !resultado.canceled && resultado.assets?.[0]) {
          const photo = await prepararFotoProduto(resultado.assets[0]);
          if (ativa) setFoto(photo);
        }
      } catch {
        if (ativa) {
          setNoticeType('error');
          setNotice('Não foi possível recuperar a última foto. Escolha a imagem novamente.');
        }
      }
    }
    recuperarFoto();
    return () => { ativa = false; };
  }, []);

  const escolherFoto = async (camera = false) => {
    if (fotoEmAndamento.current || saving.current) return;
    fotoEmAndamento.current = true;
    setProcessandoFoto(true);
    setNotice('');
    try {
      // Na web, abre o seletor diretamente no clique, sem perder a ativação do navegador.
      if (camera && Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) throw new Error('Permita o acesso à câmera nas configurações ou escolha uma foto da galeria.');
      }
      const options = { mediaTypes: ['images'], quality: 0.8 };
      const resultado = camera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (!resultado.canceled) setFoto(await prepararFotoProduto(resultado.assets?.[0]));
    } catch (error) {
      setNoticeType('error');
      setNotice(error.message || 'Não foi possível carregar a foto. Tente novamente.');
    } finally {
      fotoEmAndamento.current = false;
      setProcessandoFoto(false);
    }
  };

  const updateField = (field) => (value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };
  const updatePricing = (field) => (value) => {
    setForm((current) => updateProductPricing(current, field, value));
  };

  const handleSave = async () => {
    if (saving.current || fotoEmAndamento.current) return;

    const nextErrors = validate(form, categorias, marcas, original);

    setErrors(nextErrors);
    setNotice('');
    setNoticeType('success');

    if (Object.keys(nextErrors).length > 0) return;
    if (!editando && !codePreview?.code) {
      setNoticeType('error');
      setNotice('Aguarde a geração do código automático ou tente consultar novamente.');
      return;
    }

    if (!user?.uid) {
      setNoticeType('error');
      setNotice('Entre novamente para salvar produtos.');
      return;
    }

    setSelectAberto(null);
    saving.current = true;
    setIsSaving(true);

    try {
      const dados = {
        name: form.name,
        category: form.category,
        categoryId,
        brand: form.brand,
        measure: form.measure,
        price: parsePriceToCents(form.price),
        costPrice: parsePriceToCents(form.costPrice),
        minimum: Number(form.minimum),
        photo: foto,
      };

      if (editando) {
        await updateProduct(original, dados, user.uid);
        if (navigation.isFocused()) navigation.goBack();
        return;
      }

      await createProduct({ ...dados, stock: Number(form.stock) }, user.uid);

      setForm({ ...EMPTY_FORM });
      setFoto('');
      setErrors({});
      setNotice('Produto salvo. Ele já aparece na lista de produtos.');
    } catch (error) {
      setNoticeType('error');
      setNotice(
        error?.code === 'product-edit-conflict' || error?.code === 'product-not-found'
          ? error.message
          : error?.code === 'permission-denied'
            ? 'O Firebase negou a gravação. Confira se as regras atualizadas de produtos foram publicadas.'
            : 'Não foi possível salvar o produto. Verifique a conexão e tente novamente.'
      );
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

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
            disabled={isSaving}
          >
            <Feather name="arrow-left" size={16} color="#626975" />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>

          <View style={styles.greeting}>
            <Text style={styles.pageTitle}>{editando ? 'Editar produto' : 'Cadastro de produto'}</Text>
            <Text style={styles.pageSubtitle}>{editando ? original.name : 'Adicione um item ao estoque da loja.'}</Text>
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
            label="Valor de custo (R$)"
            placeholder="Ex.: 100,00"
            keyboardType="decimal-pad"
            value={form.costPrice}
            onChangeText={updatePricing('costPrice')}
            maxLength={16}
            editable={!isSaving}
            optional={editando && original.costPrice == null}
            error={errors.costPrice}
            accessibilityLabel="Valor de custo do produto"
          />

          <FormField
            label="Valor de venda (R$)"
            placeholder="54,90"
            keyboardType="decimal-pad"
            value={form.price}
            onChangeText={updatePricing('price')}
            maxLength={16}
            editable={!isSaving}
            error={errors.price}
            accessibilityLabel="Valor de venda do produto"
          />

          <FormField
            label="Lucro (%)"
            placeholder="Ex.: 25"
            keyboardType="decimal-pad"
            value={form.profitPercentage}
            onChangeText={updatePricing('profitPercentage')}
            maxLength={12}
            editable={!isSaving}
            error={errors.profitPercentage}
            accessibilityLabel="Porcentagem de lucro sobre o custo"
          />
          <Text style={styles.pricingHelp}>Lucro sobre o custo: custo de R$ 100 + 25% = venda de R$ 125.</Text>

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <FormField
                label="Saldo"
                placeholder="0"
                keyboardType="number-pad"
                value={editando ? String(produto.stock ?? '') : form.stock}
                onChangeText={updateField('stock')}
                editable={!isSaving}
                disabled={editando}
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
            label={editando ? 'Código do produto' : 'Código automático'}
            placeholder={editando ? 'Sem código' : categoryId ? (codePreview?.error ? 'Código indisponível' : 'Gerando código...') : 'Selecione uma categoria'}
            value={editando ? original.code || '' : codePreview?.code || ''}
            disabled
            error={codePreview?.error}
            accessibilityLabel={editando ? 'Código do produto' : 'Código automático do produto'}
          />
          {!editando ? <Text style={styles.pageSubtitle}>Preenchido automaticamente pela categoria.</Text> : null}
          {codePreview?.error ? <Button title="Tentar gerar código novamente" variant="secondary"
            onPress={() => { setPreview(null); setTentativaCodigo((value) => value + 1); }} /> : null}

          {foto ? <Image source={{ uri: foto }} style={styles.foto} /> : null}
          <Button
            title={foto ? 'Tirar outra foto' : 'Tirar foto'}
            variant="secondary"
            onPress={() => escolherFoto(true)}
            disabled={isSaving || processandoFoto}
            style={styles.secondaryButton}
          />
          <Button title={processandoFoto ? 'Preparando foto...' : 'Escolher da galeria'} variant="secondary"
            onPress={() => escolherFoto()} disabled={isSaving || processandoFoto} style={styles.secondaryButton} />
          {foto ? <Button title="Remover foto" variant="secondary" onPress={() => setFoto('')}
            disabled={isSaving || processandoFoto} style={styles.secondaryButton} /> : null}

          <Button
            title={editando ? 'Salvar alterações' : 'Salvar produto'}
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving || processandoFoto || (!editando && !codePreview?.code)}
            style={styles.primaryButton}
          />

          <Button
            title="Cancelar"
            variant="secondary"
            onPress={() => editando ? navigation.goBack() : navigation.popTo('MainTabs', { screen: 'Home' })}
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
  pricingHelp: { fontSize: 12, lineHeight: 18, color: '#626975', marginBottom: 16 },
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
  notice: { fontSize: 12, lineHeight: 17, color: '#626975', textAlign: 'center', marginTop: 14 },
  noticeError: { color: '#B42318' },
});
