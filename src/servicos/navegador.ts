/** Acesso seguro a recursos do navegador que podem estar bloqueados. */
import type { Armazenamento } from '../dominio/carrinho';

/**
 * O localStorage do navegador, ou uma memória temporária se ele estiver bloqueado
 * (modo privado de alguns navegadores, cookies desligados).
 */
export function armazenamentoDoNavegador(): Armazenamento {
    try {
        const teste = '__docelice__';
        window.localStorage.setItem(teste, teste);
        window.localStorage.removeItem(teste);
        return window.localStorage;
    } catch {
        const memoria = new Map<string, string>();
        return {
            getItem: (chave) => memoria.get(chave) ?? null,
            setItem: (chave, valor) => void memoria.set(chave, valor),
        };
    }
}

/** Identificador único para cada item do pedido. */
export function novoId(): string {
    return crypto.randomUUID();
}

/** Verdadeiro se a pessoa pediu ao celular para reduzir animações. */
export function movimentoReduzido(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
