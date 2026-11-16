import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { validateProductPhoto } from './productCodes';

// Salva o conteúdo da foto, nunca um URI temporário que só existe no aparelho.
export async function prepararFotoProduto(asset) {
  if (!asset?.uri) throw new Error('Não foi possível ler a imagem. Escolha outra foto.');
  const context = ImageManipulator.manipulate(asset.uri);
  let image;
  try {
    if (asset.width > 800 || asset.height > 800) {
      context.resize(asset.width >= asset.height ? { width: 800 } : { height: 800 });
    }
    image = await context.renderAsync();
    const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.65, base64: true });
    if (!result.base64) throw new Error('Não foi possível processar a foto. Tente novamente.');
    const photo = `data:image/jpeg;base64,${result.base64}`;
    validateProductPhoto(photo);
    return photo;
  } finally {
    image?.release();
    context.release();
  }
}
