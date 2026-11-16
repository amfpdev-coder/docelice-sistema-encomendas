import { describe, expect, it } from 'vitest';
import dados from '../public/cardapio.json';
import { validarCardapio } from '../src/dominio/cardapio';

describe('cardapio.json', () => {
    it('o arquivo real do projeto é válido', () => {
        const cardapio = validarCardapio(dados);
        expect(cardapio.loja.nome).toBe('Docelice');
        expect(cardapio.docinhos.categorias).toHaveLength(2);
    });

    it('recusa preço negativo com uma mensagem clara', () => {
        const copia = structuredClone(dados);
        copia.docinhos.categorias[0]!.preco = -1;
        expect(() => validarCardapio(copia)).toThrow(/maior que zero/);
    });

    it('recusa mínimo que não é múltiplo do passo', () => {
        const copia = structuredClone(dados);
        copia.docinhos.minimoTotal = 60;
        expect(() => validarCardapio(copia)).toThrow(/múltiplo do passo/);
    });

    it('recusa WhatsApp com espaços ou traços', () => {
        const copia = structuredClone(dados);
        copia.loja.whatsapp = '(83) 99635-5213';
        expect(() => validarCardapio(copia)).toThrow(/só números/);
    });
});
