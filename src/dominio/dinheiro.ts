/**
 * Converte reais em centavos inteiros.
 * Trabalhar em centavos evita erros de arredondamento: 0,1 + 0,2 ≠ 0,3 em JavaScript.
 */
export function centavos(reais: number): number {
    return Math.round(reais * 100);
}

const formatoReal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Formata centavos como dinheiro brasileiro: 12750 → "R$ 127,50". */
export function formatarReais(valorCentavos: number): string {
    return formatoReal.format(valorCentavos / 100);
}
