import { describe, expect, it } from 'vitest';
import dados from '../public/cardapio.json';
import { validarCardapio } from '../src/dominio/cardapio';
import { dataMinimaRetirada, dataISO, dataPorExtenso } from '../src/dominio/datas';
import { linkWhatsApp, montarMensagem } from '../src/dominio/mensagem';
import type { ItemPedido } from '../src/dominio/pedido';
import { juntarComE } from '../src/dominio/texto';

const { loja } = validarCardapio(dados);

const docinhos: ItemPedido = {
    id: '1',
    titulo: 'Docinhos tradicionais · 75 unid.',
    detalhes: ['50 Brigadeiro tradicional', '25 Dois amores', 'Forminha: Rosa'],
    valorCentavos: 12750,
};
const aro30: ItemPedido = {
    id: '2',
    titulo: 'Torta Aro 30 · tradicional',
    detalhes: ['Massa: Baunilha'],
    valorCentavos: null,
};
const retirada = { nome: ' Maria ', data: '2026-11-21', horario: '15:00' };

describe('montarMensagem', () => {
    it('organiza cliente, retirada, itens e totais', () => {
        const texto = montarMensagem(loja, [docinhos], retirada);
        expect(texto).toBe(
            [
                '*Novo pedido · Docelice*',
                '',
                '*Cliente:* Maria',
                '*Retirada:* sábado, 21/11/2026 às 15:00',
                '',
                '*Itens*',
                '1. Docinhos tradicionais · 75 unid.',
                '   • 50 Brigadeiro tradicional',
                '   • 25 Dois amores',
                '   • Forminha: Rosa',
                '   Valor: R$ 127,50',
                '',
                '*Total:* R$ 127,50',
                '*Sinal (50%):* R$ 63,75',
                '*Restante na entrega:* R$ 63,75',
            ].join('\n'),
        );
    });

    it('avisa quando há item com valor a confirmar', () => {
        const texto = montarMensagem(loja, [docinhos, aro30], retirada);
        expect(texto).toContain('Valor: a confirmar');
        expect(texto).toContain('+ item a confirmar');
        expect(texto).toContain('_Tem item com valor a confirmar. Combinamos por aqui._');
    });

    it('gera o link do WhatsApp com a mensagem codificada', () => {
        expect(linkWhatsApp('5583996355213', 'Oi, tudo bem?')).toBe(
            'https://wa.me/5583996355213?text=Oi%2C%20tudo%20bem%3F',
        );
    });
});

describe('datas e textos', () => {
    it('formata datas', () => {
        expect(dataISO(new Date(2026, 10, 5))).toBe('2026-11-05');
        expect(dataPorExtenso('2026-11-21')).toBe('sábado, 21/11/2026');
    });

    it('soma a antecedência mínima, inclusive virando o mês', () => {
        expect(dataISO(dataMinimaRetirada(new Date(2026, 10, 30, 22, 15), 2))).toBe('2026-12-02');
    });

    it('junta listas em português', () => {
        expect(juntarComE([])).toBe('');
        expect(juntarComE(['Rosa'])).toBe('Rosa');
        expect(juntarComE(['Rosa', 'Branca'])).toBe('Rosa e Branca');
        expect(juntarComE(['Rosa', 'Branca', 'Dourada'])).toBe('Rosa, Branca e Dourada');
    });
});
