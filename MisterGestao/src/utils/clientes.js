export function normalizarTelefone(valor) {
  let telefone = String(valor || '').replace(/\D/g, '');
  if ((telefone.length === 12 || telefone.length === 13) && telefone.startsWith('55')) {
    telefone = telefone.slice(2);
  }
  if (!/^[1-9]{2}(?:[2-5]\d{7}|9\d{8})$/.test(telefone)) {
    throw new Error('Digite um telefone válido com DDD, por exemplo (11) 99999-9999.');
  }
  return telefone;
}

export function formatarTelefone(valor) {
  const telefone = normalizarTelefone(valor);
  const corte = telefone.length === 11 ? 7 : 6;
  return `(${telefone.slice(0, 2)}) ${telefone.slice(2, corte)}-${telefone.slice(corte)}`;
}

export function validarCliente({ nome, telefone }) {
  const nomeLimpo = String(nome || '').trim();
  if (!nomeLimpo || nomeLimpo.length > 120) {
    throw new Error('Digite o nome do cliente com até 120 caracteres.');
  }
  return { nome: nomeLimpo, telefone: normalizarTelefone(telefone) };
}
