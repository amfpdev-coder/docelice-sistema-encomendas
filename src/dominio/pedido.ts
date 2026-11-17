/**
 * Tipos e regras do pedido da Docelice.
 * Este arquivo não mexe na tela: só regras de negócio, fáceis de testar.
 */
import { z } from 'zod';

/** Etapas pelas quais um pedido passa, na ordem. */
export const STATUS_PEDIDO = [
    'novo',
    'confirmado',
    'sinal_pago',
    'em_producao',
    'pronto',
    'retirado',
    'cancelado',
] as const;

/** Um dos valores de STATUS_PEDIDO: 'novo' | 'confirmado' | ... */
export type StatusPedido = (typeof STATUS_PEDIDO)[number];

/**
 * Um item do pedido: um lote de docinhos ou uma torta.
 * O esquema também protege o pedido salvo no navegador: se o formato mudar
 * numa versão nova do site, itens antigos e inválidos são descartados.
 */
export const ItemPedidoSchema = z.object({
    id: z.string().min(1),
    titulo: z.string().min(1),
    detalhes: z.array(z.string()),
    /** Valor em centavos. `null` quando o preço ainda é "a confirmar" (ex.: aro 30). */
    valorCentavos: z.number().int().min(0).nullable(),
});

export type ItemPedido = z.infer<typeof ItemPedidoSchema>;

export interface Totais {
    totalCentavos: number;
    sinalCentavos: number;
    restanteCentavos: number;
    /** Verdadeiro se algum item ainda está com preço "a confirmar". */
    temAConfirmar: boolean;
}

/**
 * Soma o pedido e divide entre sinal e restante.
 * Itens "a confirmar" ficam fora da soma e são sinalizados em `temAConfirmar`.
 */
export function calcularTotais(itens: readonly ItemPedido[], sinalPercentual: number): Totais {
    const totalCentavos = itens.reduce((soma, item) => soma + (item.valorCentavos ?? 0), 0);
    const sinalCentavos = Math.round((totalCentavos * sinalPercentual) / 100);

    return {
        totalCentavos,
        sinalCentavos,
        restanteCentavos: totalCentavos - sinalCentavos,
        temAConfirmar: itens.some((item) => item.valorCentavos === null),
    };
}
