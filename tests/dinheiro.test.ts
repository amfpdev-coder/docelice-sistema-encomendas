import { describe, expect, it } from 'vitest';
import { centavos, formatarReais } from '../src/dominio/dinheiro';

describe('centavos', () => {
    it('converte reais para centavos sem erro de arredondamento', () => {
        // 75 docinhos tradicionais a R$ 1,70 = R$ 127,50
        expect(centavos(1.7) * 75).toBe(12750);
    });
});

describe('formatarReais', () => {
    it('formata no padrão brasileiro', () => {
        // O navegador usa um espaço especial (não separável) entre "R$" e o número: \u00a0
        expect(formatarReais(12750)).toBe('R$\u00a0127,50');
        expect(formatarReais(9000)).toBe('R$\u00a090,00');
    });
});
