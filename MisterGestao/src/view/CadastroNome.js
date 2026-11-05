import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import FormField from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { listarNomes, salvarNome } from '../services/products';

// Serve para as duas telas: CadastroMarca e CadastroCategoria
export default function CadastroNome({ route, navigation }) {
  const ehMarca = route.name === 'CadastroMarca';
  const colecao = ehMarca ? 'marcas' : 'categorias';
  const { user } = useAuth();
  const [nome, setNome] = useState('');
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    const carregar = async () => {
      try {
        setLista(await listarNomes(colecao));
      } catch (e) {
        console.error('Erro ao carregar:', e);
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [colecao]);

  const salvar = async () => {
    const texto = nome.trim();
    if (!texto) return setMensagem('Digite o nome.');
    if (lista.some((item) => item.name.toLowerCase() === texto.toLowerCase())) {
      return setMensagem('Esse nome já existe.');
    }

    try {
      await salvarNome(colecao, texto, user.uid);
      setLista([...lista, { id: texto, name: texto }]);
      setNome('');
      setMensagem('Salvo!');
    } catch (e) {
      console.error('Erro ao salvar:', e);
      setMensagem('Não foi possível salvar.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.voltar}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>{ehMarca ? 'Cadastro de marca' : 'Cadastro de categoria'}</Text>

      <FormField label="Nome" value={nome} onChangeText={setNome} placeholder="Digite o nome" />
      <Button title="Salvar" onPress={salvar} />
      {mensagem ? <Text style={styles.mensagem}>{mensagem}</Text> : null}

      <Text style={styles.subtitulo}>Cadastrados</Text>
      {loading ? (
        <ActivityIndicator color="#C94700" />
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text>{item.name}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.mensagem}>Nenhum cadastrado.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F8', padding: 16 },
  voltar: { color: '#626975', marginBottom: 12 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#151619', marginBottom: 16 },
  mensagem: { color: '#626975', textAlign: 'center', marginTop: 10 },
  subtitulo: { fontSize: 15, fontWeight: 'bold', marginTop: 24, marginBottom: 8 },
  item: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DEE0E4',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
});
