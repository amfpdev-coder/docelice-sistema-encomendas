import { validarCardapio, type Cardapio } from '../dominio/cardapio';

/** Busca o cardapio.json no servidor e valida antes de usar. */
export async function carregarCardapio(url = '/cardapio.json'): Promise<Cardapio> {
    const resposta = await fetch(url, { cache: 'no-cache' });
    if (!resposta.ok) {
        throw new Error(`Não foi possível carregar o cardápio (HTTP ${resposta.status}).`);
    }
    return validarCardapio(await resposta.json());
}
