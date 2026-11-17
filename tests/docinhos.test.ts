import { describe, expect, it } from 'vitest';
import dados from '../public/cardapio.json';
import { validarCardapio } from '../src/dominio/cardapio';
import {
    montarItemDocinhos,
    pendenciaDocinhos,
    totalUnidades,
    valorDocinhosCentavos,
    type EscolhaDocinhos,
} from '../src/dominio/docinhos';

const { docinhos } = validarCardapio(dados);
const tradicionais = docinhos.categorias[0]!;

function escolha(quantidades: number[], cores: string[] = [], observacao = ''): EscolhaDocinhos {
    return { quantidades, cores, observacao };
}

describe('docinhos', () => {
    it('soma as unidades e calcula o valor (75 × R$ 1,70 = R$ 127,50)', () => {
        expect(totalUnidades([50, 25, 0])).toBe(75);
        expect(valorDocinhosCentavos(tradicionais, [50, 25])).toBe(12750);
    });

    it('avisa quanto falta para o mínimo de 50', () => {
        expect(pendenciaDocinhos(docinhos, escolha([25], ['Rosa']))).toBe(
            'Faltam 25 docinhos para o mínimo de 50',
        );
    });

    it('exige pelo menos uma cor de forminha', () => {
        expect(pendenciaDocinhos(docinhos, escolha([50]))).toBe('Escolha a cor da forminha');
    });

    it('recusa mais cores do que o limite do cardápio', () => {
        const cores = ['Branca', 'Rosa', 'Pink', 'Lilás'];
        expect(pendenciaDocinhos(docinhos, escolha([50], cores))).toMatch(/no máximo 3/);
    });

    it('fica pronto com o mínimo e uma cor', () => {
        expect(pendenciaDocinhos(docinhos, escolha([50], ['Rosa']))).toBeNull();
    });

    it('monta o item com sabores, forminha e observação', () => {
        const item = montarItemDocinhos(
            tradicionais,
            docinhos,
            escolha([50, 0, 0, 25], ['Rosa'], '  sem dragê azul  '),
            'id-1',
        );
        expect(item).toEqual({
            id: 'id-1',
            titulo: 'Docinhos tradicionais · 75 unid.',
            detalhes: [
                '50 Brigadeiro tradicional',
                '25 Dois amores',
                'Forminha: Rosa',
                'Obs.: sem dragê azul',
            ],
            valorCentavos: 12750,
        });
    });

    it('com várias cores, avisa que a divisão é combinada', () => {
        const item = montarItemDocinhos(
            tradicionais,
            docinhos,
            escolha([50], ['Branca', 'Rosa', 'Dourada']),
            'id-2',
        );
        expect(item.detalhes).toContain('Forminhas: Branca, Rosa e Dourada (divisão a combinar)');
    });

    it('não deixa montar um item incompleto', () => {
        expect(() => montarItemDocinhos(tradicionais, docinhos, escolha([25]), 'x')).toThrow();
    });
});
