import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatarTelefone } from './clientes';

const dinheiro = (valor) => (Number(valor || 0) / 100).toLocaleString('pt-BR', {
  style: 'currency', currency: 'BRL',
});

// Evita que um nome com < ou & quebre o HTML
const texto = (valor) => String(valor || '').replace(/[&<>"]/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
));

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
<html>
<head>
<meta charset="utf-8">
<style>
  @page { margin: 28px; }
  @media screen { body { padding: 16px; } }
  body { font-family: Helvetica, Arial, sans-serif; color: #151619; margin: 0; font-size: 13px; }
  .topo { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 14px; border-bottom: 4px solid #F45108; }
  .marca { font-size: 28px; font-weight: 800; letter-spacing: -1px; }
  .marca span { color: #F45108; }
  .loja { color: #7C818A; font-size: 12px; }
  .titulo { text-align: right; }
  .titulo h1 { margin: 0; font-size: 20px; color: #C94700; letter-spacing: 2px; }
  .titulo p { margin: 2px 0 0; color: #626975; font-size: 12px; }
  .cliente { margin: 18px 0; padding: 12px 14px; background: #F7F7F8; border-radius: 8px; }
  .cliente small { color: #7C818A; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; }
  .cliente p { margin: 4px 0 0; font-size: 15px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #FFF3ED; color: #C94700; font-size: 11px; text-transform: uppercase; text-align: left; padding: 9px 10px; }
  td { padding: 9px 10px; border-bottom: 1px solid #EFF0F2; vertical-align: top; }
  td small { color: #85888D; }
  .centro { text-align: center; }
  .direita { text-align: right; }
  .totais { width: 260px; margin: 16px 0 0 auto; }
  .totais div { display: flex; justify-content: space-between; padding: 5px 10px; color: #626975; }
  .totais .total { margin-top: 6px; padding: 10px; background: #090A0B; color: #FFFFFF; border-radius: 8px; font-size: 16px; font-weight: 800; }
  .totais .total span:last-child { color: #F45108; }
  .info { margin-top: 22px; color: #626975; line-height: 1.5; }
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
      <p>Nº ${texto(orcamento.id).slice(0, 6).toUpperCase()} · ${data.toLocaleDateString('pt-BR')}</p>
    </div>
  </div>

  <div class="cliente">
    <small>Cliente</small>
    <p>${texto(orcamento.cliente?.nome)}</p>
    ${telefone ? `<span>${texto(telefone)}</span>` : ''}
  </div>

  <table>
    <tr><th>Produto</th><th class="centro">Qtd</th><th class="direita">Unitário</th><th class="direita">Total</th></tr>
    ${linhas}
  </table>

  <div class="totais">
    <div><span>Subtotal</span><span>${dinheiro(orcamento.subtotal)}</span></div>
    ${orcamento.desconto ? `<div><span>Desconto</span><span>- ${dinheiro(orcamento.desconto)}</span></div>` : ''}
    ${orcamento.frete ? `<div><span>Frete</span><span>${dinheiro(orcamento.frete)}</span></div>` : ''}
    <div class="total"><span>Total</span><span>${dinheiro(orcamento.total)}</span></div>
  </div>

  <div class="info">
    ${validade ? `<b>Válido até:</b> ${validade}<br>` : ''}
    ${orcamento.observacoes ? `<b>Observações:</b> ${texto(orcamento.observacoes)}` : ''}
  </div>

  <div class="rodape">Este orçamento não reserva estoque. · Mister MotoPlace · Gerado pelo Mister Gestão</div>
</body>
</html>`;
}

export async function enviarPdfOrcamento(orcamento) {
  const html = montarHtmlOrcamento(orcamento);

  // No navegador abre o orçamento numa aba e chama a impressão (Salvar como PDF)
  if (Platform.OS === 'web') {
    const janela = window.open('', '_blank');
    janela.document.write(html);
    janela.document.close();
    janela.print();
    return;
  }

  // No celular gera o PDF e abre a janela de compartilhar (escolher WhatsApp)
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Enviar orçamento',
  });
}
