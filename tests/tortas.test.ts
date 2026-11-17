import { describe, expect, it } from 'vitest';
import dados from '../public/cardapio.json';
import { validarCardapio } from '../src/dominio/cardapio';
import {
    montarItemTorta,
    pendenciasTorta,
    precoMinimoTortas,
    precoTortaCentavos,
    tipoTorta,
    type EscolhaTorta,
} from '../src/dominio/tortas';

const { tortas } = validarCardapio(dados);

function escolha(parcial: Partial<EscolhaTorta> = {}): EscolhaTorta {
    return {
        tamanhoId: null,
        massa: null,
        recheios: [],
        acabamento: null,
        observacao: '',
        ...parcial,
    };
}

describe('precoMinimoTortas', () => {
    it('pega o menor preço tradicional e ignora o aro 30 "a confirmar"', () => {
        expect(precoMinimoTortas(tortas)).toBe(90);
    });

    it('devolve null quando nenhum tamanho tem preço', () => {
        const semPreco = {
            ...tortas,
            tamanhos: tortas.tamanhos.map((t) => ({ ...t, precoTradicional: null })),
        };
        expect(precoMinimoTortas(semPreco)).toBeNull();
    });
});

describe('tipoTorta', () => {
    it('dois tradicionais → tradicional', () => {
        expect(tipoTorta(tortas, ['Brigadeiro', 'Ninho'])).toBe('tradicional');
    });

    it('dois especiais → especial', () => {
        expect(tipoTorta(tortas, ['Ninho com morango', 'Ninho com nutella'])).toBe('especial');
    });

    it('misturado segue a regra do cardápio (hoje: especial)', () => {
        expect(tipoTorta(tortas, ['Ninho', 'Ninho com morango'])).toBe('especial');
        expect(
            tipoTorta({ ...tortas, regraPrecoMisto: 'tradicional' }, [
                'Ninho',
                'Ninho com morango',
            ]),
        ).toBe('tradicional');
    });
});

describe('precoTortaCentavos', () => {
    it('aro 20 tradicional = R$ 170 e especial = R$ 185', () => {
        expect(
            precoTortaCentavos(tortas, escolha({ tamanhoId: 'aro20', recheios: ['Ninho'] })),
        ).toBe(17000);
        expect(
            precoTortaCentavos(
                tortas,
                escolha({ tamanhoId: 'aro20', recheios: ['Ninho com morango'] }),
            ),
        ).toBe(18500);
    });

    it('sem tamanho ou com aro 30 "a confirmar" → null', () => {
        expect(precoTortaCentavos(tortas, escolha())).toBeNull();
        expect(precoTortaCentavos(tortas, escolha({ tamanhoId: 'aro30' }))).toBeNull();
    });

    it('soma o acréscimo do acabamento, quando houver', () => {
        const comAcrescimo = {
            ...tortas,
            acabamentos: [{ nome: 'Chantininho', acrescimo: 15 }],
        };
        expect(
            precoTortaCentavos(
                comAcrescimo,
                escolha({ tamanhoId: 'aro14', acabamento: 'Chantininho' }),
            ),
        ).toBe(10500);
    });
});

describe('pendenciasTorta e montarItemTorta', () => {
    it('lista o que falta escolher', () => {
        expect(pendenciasTorta(tortas, escolha({ recheios: ['Ninho'] }))).toEqual([
            'tamanho',
            'massa',
            '1 recheio',
            'acabamento',
        ]);
    });

    it('monta o item completo', () => {
        const item = montarItemTorta(
            tortas,
            escolha({
                tamanhoId: 'aro20',
                massa: 'Chocolate',
                recheios: ['Ninho', 'Ninho com morango'],
                acabamento: 'Naked cake',
                observacao: 'Parabéns, Ana',
            }),
            'id-t',
        );
        expect(item).toEqual({
            id: 'id-t',
            titulo: 'Torta Aro 20 · especial',
            detalhes: [
                'Serve: 15 a 20 pessoas',
                'Massa: Chocolate',
                'Recheios: Ninho e Ninho com morango',
                'Acabamento: Naked cake',
                'Obs.: Parabéns, Ana',
            ],
            valorCentavos: 18500,
        });
    });

    it('não deixa montar uma torta incompleta', () => {
        expect(() => montarItemTorta(tortas, escolha({ tamanhoId: 'aro14' }), 'x')).toThrow(
            /Falta escolher/,
        );
    });
});
