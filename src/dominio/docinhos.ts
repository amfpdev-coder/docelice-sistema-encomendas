/** Regras do montador de docinhos. */
import type { Cardapio, CategoriaDocinho } from './cardapio';
import { centavos } from './dinheiro';
import type { ItemPedido } from './pedido';
import { juntarComE } from './texto';

type RegrasDocinhos = Cardapio['docinhos'];

/** O que a cliente escolheu no montador. `quantidades` segue a ordem dos sabores da categoria. */
export interface EscolhaDocinhos {
    quantidades: readonly number[];
    cores: readonly string[];
    observacao: string;
}

export function totalUnidades(quantidades: readonly number[]): number {
    return quantidades.reduce((soma, quantidade) => soma + quantidade, 0);
}

/** Valor do lote, em centavos. */
export function valorDocinhosCentavos(categoria: CategoriaDocinho, quantidades: readonly number[]) {
    return totalUnidades(quantidades) * centavos(categoria.preco);
}

/**
 * O que ainda falta para poder adicionar ao pedido, em linguagem de gente.
 * `null` quando está tudo certo.
 */
export function pendenciaDocinhos(regras: RegrasDocinhos, escolha: EscolhaDocinhos): string | null {
    const total = totalUnidades(escolha.quantidades);
    if (total < regras.minimoTotal) {
        return `Faltam ${regras.minimoTotal - total} docinhos para o mínimo de ${regras.minimoTotal}`;
    }
    if (escolha.cores.length === 0) return 'Escolha a cor da forminha';
    if (escolha.cores.length > regras.maxCoresForminha) {
        return `Escolha no máximo ${regras.maxCoresForminha} cores de forminha`;
    }
    return null;
}

/** Monta o item do pedido. Só deve ser chamado quando não há pendência. */
export function montarItemDocinhos(
    categoria: CategoriaDocinho,
    regras: RegrasDocinhos,
    escolha: EscolhaDocinhos,
    id: string,
): ItemPedido {
    const pendencia = pendenciaDocinhos(regras, escolha);
    if (pendencia) throw new Error(pendencia);

    const detalhes = categoria.sabores
        .map((sabor, i) => ({ sabor, quantidade: escolha.quantidades[i] ?? 0 }))
        .filter(({ quantidade }) => quantidade > 0)
        .map(({ sabor, quantidade }) => `${quantidade} ${sabor}`);

    detalhes.push(
        escolha.cores.length > 1
            ? `Forminhas: ${juntarComE(escolha.cores)} (divisão a combinar)`
            : `Forminha: ${escolha.cores[0] ?? ''}`,
    );

    const observacao = escolha.observacao.trim();
    if (observacao) detalhes.push(`Obs.: ${observacao}`);

    return {
        id,
        titulo: `${categoria.nome} · ${totalUnidades(escolha.quantidades)} unid.`,
        detalhes,
        valorCentavos: valorDocinhosCentavos(categoria, escolha.quantidades),
    };
}
