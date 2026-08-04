import { unmask } from './masks';

/**
 * Busca o endereço a partir de um CEP usando a API pública do ViaCEP.
 * Retorna null se o CEP for inválido ou não encontrado (nunca lança erro
 * para não quebrar o formulário — o usuário sempre pode preencher na mão).
 */
export async function lookupCep(cep) {
  const digits = unmask(cep);
  if (digits.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;

    return {
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
      complement: data.complemento || '',
    };
  } catch (err) {
    return null;
  }
}
