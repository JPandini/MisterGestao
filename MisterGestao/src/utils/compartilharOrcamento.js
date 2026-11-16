import { normalizarTelefone } from './clientes';

export const SITE = 'https://mistergestao-5ebe1.web.app';

const dinheiro = (valor) => (Number(valor || 0) / 100).toLocaleString('pt-BR', {
  style: 'currency', currency: 'BRL',
});

export function montarMensagemOrcamento(orcamento) {
  const linhas = [
    '*Mister MotoPlace*',
    '',
    `Cliente: ${orcamento.cliente.nome}`,
    '',
    ...orcamento.itens.flatMap((item) => [
      `${item.nome}${item.medida ? ` — ${item.medida}` : ''}`,
      `${item.quantidade} × ${dinheiro(item.preco)} = ${dinheiro(item.quantidade * item.preco)}`,
      '',
    ]),
    `Subtotal: ${dinheiro(orcamento.subtotal)}`,
    `Desconto: ${dinheiro(orcamento.desconto)}`,
    `Frete: ${dinheiro(orcamento.frete)}`,
    `*Total: ${dinheiro(orcamento.total)}*`,
  ];
  if (orcamento.validade) linhas.push(`Validade: ${orcamento.validade.split('-').reverse().join('/')}`);
  if (orcamento.observacoes) linhas.push('', `Observações: ${orcamento.observacoes}`);
  if (orcamento.id) linhas.push('', `Ver orçamento em PDF: ${SITE}/?orcamento=${orcamento.id}`);
  return linhas.join('\n');
}

export function montarLinkWhatsApp(orcamento) {
  const telefone = normalizarTelefone(orcamento.cliente.contato);
  return `https://wa.me/55${telefone}?text=${encodeURIComponent(montarMensagemOrcamento(orcamento))}`;
}
