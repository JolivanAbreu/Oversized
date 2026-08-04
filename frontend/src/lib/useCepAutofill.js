import { useState, useCallback } from 'react';
import { lookupCep } from './viacep';
import { unmask } from './masks';

/**
 * Dado um setForm (setState de formulário) e o valor atual do CEP, dispara a
 * busca no ViaCEP assim que o campo tiver 8 dígitos e preenche rua, bairro,
 * cidade e UF automaticamente — sem sobrescrever o que o usuário já digitou
 * manualmente nesses campos, caso o CEP não seja encontrado.
 */
export function useCepAutofill(setForm) {
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepNotFound, setCepNotFound] = useState(false);

  const handleCepChange = useCallback(async (maskedValue) => {
    setForm((prev) => ({ ...prev, zip: maskedValue }));
    setCepNotFound(false);

    if (unmask(maskedValue).length !== 8) return;

    setLoadingCep(true);
    const address = await lookupCep(maskedValue);
    setLoadingCep(false);

    if (!address) {
      setCepNotFound(true);
      return;
    }

    setForm((prev) => ({
      ...prev,
      street: address.street || prev.street,
      neighborhood: address.neighborhood || prev.neighborhood,
      city: address.city || prev.city,
      state: address.state || prev.state,
      complement: prev.complement || address.complement,
    }));
  }, [setForm]);

  return { handleCepChange, loadingCep, cepNotFound };
}
