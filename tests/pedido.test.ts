import { describe, expect, it } from 'vitest';
import { calcularTotais, type ItemPedido } from '../src/dominio/pedido';

function item(valorCentavos: number | null): ItemPedido {
    return { id: crypto.randomUUID(), titulo: 'Item de teste', detalhes: [], valorCentavos };
}

describe('calcularTotais', () => {
    it('soma os itens e divide o sinal de 50%', () => {
        const totais = calcularTotais([item(12750), item(18500)], 50);
        expect(totais).toEqual({
            totalCentavos: 31250,
            sinalCentavos: 15625,
            restanteCentavos: 15625,
            temAConfirmar: false,
        });
    });

    it('arredonda o sinal e joga o centavo que sobra no restante', () => {
        const totais = calcularTotais([item(31251)], 50);
        expect(totais.sinalCentavos + totais.restanteCentavos).toBe(31251);
    });

    it('deixa itens "a confirmar" fora da soma e avisa', () => {
        const totais = calcularTotais([item(12750), item(null)], 50);
        expect(totais.totalCentavos).toBe(12750);
        expect(totais.temAConfirmar).toBe(true);
    });

    it('pedido vazio dá tudo zero', () => {
        expect(calcularTotais([], 50).totalCentavos).toBe(0);
    });
});
