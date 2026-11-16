import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatarTelefone } from './clientes';
import { statusOrcamento } from './orcamento';

const dinheiro = (valor) => (Number(valor || 0) / 100).toLocaleString('pt-BR', {
  style: 'currency', currency: 'BRL',
});

// Troca < > & " por códigos do HTML, para um nome com esses símbolos não quebrar a página
const texto = (valor) => String(valor || '').replace(/[&<>"]/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
));

// Monta o orçamento em HTML (o mesmo HTML vira PDF e aparece na página do link)
export function montarHtmlOrcamento(orcamento) {
  const data = orcamento.createdAt?.toDate ? orcamento.createdAt.toDate() : new Date();
  const validade = orcamento.validade ? orcamento.validade.split('-').reverse().join('/') : '';
  let telefone = '';
  try {
    telefone = formatarTelefone(orcamento.cliente?.contato);
  } catch {
    telefone = orcamento.cliente?.contato || '';
  }

  const linhas = orcamento.itens.map((item) => `
    <tr>
      <td><b>${texto(item.nome)}</b>${item.medida ? `<br><small>${texto(item.medida)}</small>` : ''}</td>
      <td class="centro">${item.quantidade}</td>
      <td class="direita">${dinheiro(item.preco)}</td>
      <td class="direita">${dinheiro(item.preco * item.quantidade)}</td>
    </tr>`).join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Orçamento ${texto(orcamento.id)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  @media screen { body { padding: 16px; } }
  body { font-family: Helvetica, Arial, sans-serif; color: #151619; margin: 0; font-size: 13px; }
  .topo { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 14px; border-bottom: 4px solid #F45108; }
  .marca { font-size: 28px; font-weight: 800; letter-spacing: -1px; }
  .marca span { color: #F45108; }
  .loja { color: #7C818A; font-size: 12px; }
  .titulo { text-align: right; }
  .titulo h1 { margin: 0; font-size: 20px; color: #C94700; letter-spacing: 2px; }
  .titulo p { margin: 2px 0 0; color: #626975; font-size: 12px; }
  .numero { max-width: 240px; overflow-wrap: anywhere; }
  .cliente { margin: 18px 0; padding: 12px 14px; background: #F7F7F8; border-radius: 8px; }
  .cliente small { color: #7C818A; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; }
  .cliente p { margin: 4px 0 0; font-size: 15px; font-weight: 700; }
  .status { margin: 14px 0; padding: 10px 14px; background: #F7F7F8; font-weight: 700; }
  .cancelado { color: #B42318; background: #FFF0EE; border: 1px solid #F2B8B5; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
  th:first-child { width: 43%; }
  th { background: #FFF3ED; color: #C94700; font-size: 11px; text-transform: uppercase; text-align: left; padding: 9px 10px; }
  td { padding: 9px 10px; border-bottom: 1px solid #EFF0F2; vertical-align: top; overflow-wrap: anywhere; }
  td small { color: #85888D; }
  .centro { text-align: center; }
  .direita { text-align: right; }
  .totais { width: 260px; max-width: 100%; margin: 16px 0 0 auto; break-inside: avoid; }
  .totais div { display: flex; justify-content: space-between; padding: 5px 10px; color: #626975; }
  .totais .total { margin-top: 6px; padding: 10px; background: #090A0B; color: #FFFFFF; border-radius: 8px; font-size: 16px; font-weight: 800; }
  .totais .total span:last-child { color: #F45108; }
  .info { margin-top: 22px; color: #626975; line-height: 1.5; overflow-wrap: anywhere; }
  .observacoes { white-space: pre-wrap; }
  .rodape { margin-top: 30px; padding-top: 10px; border-top: 1px solid #EFF0F2; color: #9A9CA1; font-size: 10px; text-align: center; }
</style>
</head>
<body>
  <div class="topo">
    <div>
      <div class="marca">Mister <span>Gestão</span></div>
      <div class="loja">Mister MotoPlace</div>
    </div>
    <div class="titulo">
      <h1>ORÇAMENTO</h1>
      <p class="numero">Nº ${texto(orcamento.id)}</p>
      <p>${data.toLocaleDateString('pt-BR')}</p>
    </div>
  </div>

  <div class="status${orcamento.status === 'cancelled' ? ' cancelado' : ''}">Status: ${texto(statusOrcamento(orcamento))}${orcamento.status === 'cancelled' ? ' - Orçamento sem efeito para venda.' : ''}</div>

  <div class="cliente">
    <small>Cliente</small>
    <p>${texto(orcamento.cliente?.nome || 'Cliente não informado')}</p>
    ${telefone ? `<span>${texto(telefone)}</span>` : ''}
  </div>

  <table>
    <thead><tr><th>Produto</th><th class="centro">Qtd</th><th class="direita">Unitário</th><th class="direita">Total</th></tr></thead>
    <tbody>${linhas}</tbody>
  </table>

  <div class="totais">
    <div><span>Subtotal</span><span>${dinheiro(orcamento.subtotal)}</span></div>
    <div><span>Desconto</span><span>- ${dinheiro(orcamento.desconto)}</span></div>
    <div><span>Frete</span><span>${dinheiro(orcamento.frete)}</span></div>
    <div class="total"><span>Total</span><span>${dinheiro(orcamento.total)}</span></div>
  </div>

  <div class="info">
    <b>Válido até:</b> ${texto(validade || 'Não informado')}<br>
    ${orcamento.observacoes ? `<b>Observações:</b> <span class="observacoes">${texto(orcamento.observacoes)}</span>` : ''}
  </div>

  <div class="rodape">Este orçamento não reserva estoque. · Mister MotoPlace · Gerado pelo Mister Gestão</div>
</body>
</html>`;
}

// Gera o PDF do orçamento e abre para enviar
export async function enviarPdfOrcamento(orcamento) {
  const html = montarHtmlOrcamento(orcamento);

  // No navegador abre o orçamento numa aba e chama a impressão (Salvar como PDF)
  if (Platform.OS === 'web') {
    const janela = window.open('', '_blank');
    if (!janela) throw new Error('O navegador bloqueou a janela do PDF. Permita pop-ups para este site e tente novamente.');
    janela.document.write(html);
    janela.document.close();
    janela.focus();
    janela.print();
    return;
  }

  // No celular gera o PDF e abre a janela de compartilhar (escolher WhatsApp)
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('O compartilhamento de arquivos não está disponível neste aparelho.');
  }
  const { uri } = await Print.printToFileAsync({ html, width: 595.28, height: 841.89 });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Enviar orçamento',
  });
}
