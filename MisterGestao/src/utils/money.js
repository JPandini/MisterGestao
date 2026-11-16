export function parsePriceToCents(text) {
  const value = text.trim();
  if (!/^(?:\d{1,3}(?:\.\d{3})*|\d+)(?:,\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split(',');
  const cents = Number(whole.replace(/\./g, '')) * 100 + Number((fraction + '00').slice(0, 2));
  return Number.isSafeInteger(cents) ? cents : null;
}

export const centsToInput = (cents) => (cents / 100).toFixed(2).replace('.', ',');
