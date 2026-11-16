export function dataLocal(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function validadePadrao(date = new Date()) {
  const validade = new Date(date);
  validade.setDate(validade.getDate() + 7);
  return dataLocal(validade);
}

export function dataValida(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [ano, mes, dia] = value.split('-').map(Number);
  const date = new Date(ano, mes - 1, dia);
  return dataLocal(date) === value;
}

export function lerValidade(text) {
  const partes = text.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const value = partes ? `${partes[3]}-${partes[2]}-${partes[1]}` : '';
  return dataValida(value) ? value : null;
}

export function orcamentoVencido(orcamento, date = new Date()) {
  return Boolean(orcamento.validade && (!dataValida(orcamento.validade) || orcamento.validade < dataLocal(date)));
}

export function statusOrcamento(orcamento) {
  if (orcamento.status === 'open') return orcamentoVencido(orcamento) ? 'Vencido' : 'Em aberto';
  return { approved: 'Aprovado', cancelled: 'Cancelado', converted: 'Convertido em venda' }[orcamento.status]
    || 'Status não informado';
}

export { parsePriceToCents } from './money';
