import { describe, expect, it } from 'vitest';
import { centavos } from '../src/dominio/dinheiro';

describe('centavos', () => {
    it('converte reais para centavos sem erro de arredondamento', () => {
        // 75 docinhos tradicionais a R$ 1,70 = R$ 127,50
        expect(centavos(1.7) * 75).toBe(12750);
    })
})