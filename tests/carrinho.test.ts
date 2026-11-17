import { describe, expect, it, vi } from 'vitest';
import { Carrinho, type Armazenamento } from '../src/dominio/carrinho';
import type { ItemPedido } from '../src/dominio/pedido';

/** Um "localStorage" de mentira, só em memória, para testar sem navegador. */
function memoria(inicial: Record<string, string> = {}): Armazenamento {
    const dados = new Map(Object.entries(inicial));
    return {
        getItem: (chave) => dados.get(chave) ?? null,
        setItem: (chave, valor) => void dados.set(chave, valor),
    };
}

function item(id: string, valorCentavos: number | null = 1000): ItemPedido {
    return { id, titulo: `Item ${id}`, detalhes: [], valorCentavos };
}

describe('Carrinho', () => {
    it('adiciona, remove e esvazia', () => {
        const carrinho = new Carrinho(memoria());
        carrinho.adicionar(item('a'));
        carrinho.adicionar(item('b'));
        expect(carrinho.quantidade()).toBe(2);

        carrinho.remover('a');
        expect(carrinho.lista().map((i) => i.id)).toEqual(['b']);

        carrinho.esvaziar();
        expect(carrinho.quantidade()).toBe(0);
    });

    it('avisa quem está ouvindo a cada mudança', () => {
        const carrinho = new Carrinho(memoria());
        const ouvinte = vi.fn();
        const cancelar = carrinho.quandoMudar(ouvinte);

        carrinho.adicionar(item('a'));
        expect(ouvinte).toHaveBeenCalledTimes(1);

        cancelar();
        carrinho.adicionar(item('b'));
        expect(ouvinte).toHaveBeenCalledTimes(1);
    });

    it('guarda o pedido e recupera ao abrir de novo', () => {
        const armazenamento = memoria();
        new Carrinho(armazenamento).adicionar(item('a', null));
        expect(new Carrinho(armazenamento).lista()).toEqual([item('a', null)]);
    });

    it('descarta dados salvos inválidos em vez de quebrar', () => {
        const corrompido = memoria({ 'docelice:carrinho': '{isso não é json' });
        expect(new Carrinho(corrompido).lista()).toEqual([]);

        const formatoAntigo = memoria({ 'docelice:carrinho': JSON.stringify([{ nome: 'x' }]) });
        expect(new Carrinho(formatoAntigo).lista()).toEqual([]);
    });

    it('segue funcionando se o navegador bloquear o armazenamento', () => {
        const bloqueado: Armazenamento = {
            getItem: () => {
                throw new Error('bloqueado');
            },
            setItem: () => {
                throw new Error('bloqueado');
            },
        };
        const carrinho = new Carrinho(bloqueado);
        carrinho.adicionar(item('a'));
        expect(carrinho.quantidade()).toBe(1);
    });
});
