import { centsToInput, parsePriceToCents } from './money';

const validPrice = (price) => Number.isSafeInteger(price) && price > 0;

export function parseProfitPercentage(text) {
  if (!/^-?\d+(,\d{1,2})?$/.test(text.trim())) return null;
  const value = Number(text.trim().replace(',', '.'));
  const basisPoints = Math.round(value * 100);
  return value > -100 && Number.isSafeInteger(basisPoints) && Number.isSafeInteger(10000 + basisPoints)
    ? value : null;
}

export function calculateSalePrice(costPrice, percentage) {
  if (!validPrice(costPrice) || !Number.isFinite(percentage) || percentage <= -100) return null;
  const factor = 10000 + Math.round(percentage * 100);
  if (!Number.isSafeInteger(factor)) return null;
  // Arredonda para centavos sem erros de ponto flutuante na multiplicação.
  const price = Number((BigInt(costPrice) * BigInt(factor) + 5000n) / 10000n);
  return validPrice(price) ? price : null;
}

export function calculateProfitPercentage(costPrice, salePrice) {
  if (!validPrice(costPrice) || !validPrice(salePrice)) return null;
  const basisPoints = Math.round(((salePrice - costPrice) / costPrice) * 10000);
  return Number.isSafeInteger(basisPoints) ? basisPoints / 100 : null;
}

export function updateProductPricing(form, field, value) {
  const next = { ...form, [field]: value };
  if (field !== 'costPrice') next.pricingSource = field;
  const cost = parsePriceToCents(next.costPrice);
  if (next.pricingSource === 'price') {
    const percentage = calculateProfitPercentage(cost, parsePriceToCents(next.price));
    next.profitPercentage = percentage === null ? '' : percentage.toFixed(2).replace('.', ',');
  } else {
    const percentage = parseProfitPercentage(next.profitPercentage);
    const price = percentage === null ? null : calculateSalePrice(cost, percentage);
    next.price = price === null ? '' : centsToInput(price);
  }
  return next;
}
