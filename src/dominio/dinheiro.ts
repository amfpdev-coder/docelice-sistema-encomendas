/**
 * Converte reais em centavos inteiros.
 * Trablahar em centavos evita erros de arredondamentos: 0,1 + 0,2 ≠ 0,3 em JavaScript.
 */

export function centavos(reais: number): number {
    return Math.round(reais * 100);
}