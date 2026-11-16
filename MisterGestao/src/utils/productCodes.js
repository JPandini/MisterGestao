export function productCodePrefix(category) {
  const letters = String(category || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z]/g, '');
  if (!letters) throw new Error('A categoria precisa conter letras para gerar o código.');
  return letters.slice(0, 3).padEnd(3, 'X');
}

export function formatProductCode(prefix, number) {
  if (!Number.isSafeInteger(number) || number < 1) throw new Error('Sequência de produtos inválida.');
  return `${prefix}-${String(number).padStart(3, '0')}`;
}

export const MAX_PRODUCT_PHOTO_LENGTH = 700000;

export function validateProductPhoto(photo) {
  if (photo && (typeof photo !== 'string' || photo.length > MAX_PRODUCT_PHOTO_LENGTH
    || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(photo))) {
    throw new Error('A foto não é válida ou ficou muito grande. Escolha outra imagem.');
  }
}
