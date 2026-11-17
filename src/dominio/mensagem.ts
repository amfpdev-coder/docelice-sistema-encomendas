/** A mensagem do pedido que chega no WhatsApp da Docelice. */
import type { Cardapio } from './cardapio';
import { dataPorExtenso } from './datas';
import { formatarReais } from './dinheiro';
import { calcularTotais, type ItemPedido } from './pedido';

type Loja = Cardapio['loja'];

export interface DadosRetirada {
    nome: string;
    /** "2026-11-21" */
    data: string;
    /** "15:00" */
    horario: string;
}

/**
 * Monta o texto do pedido. No WhatsApp, *texto* vira negrito e _texto_ vira itálico.
 */
export function montarMensagem(
    loja: Loja,
    itens: readonly ItemPedido[],
    retirada: DadosRetirada,
): string {
    const totais = calcularTotais(itens, loja.sinalPercentual);
    const valor = (item: ItemPedido) =>
        item.valorCentavos === null ? 'a confirmar' : formatarReais(item.valorCentavos);

    const linhas = [
        `*Novo pedido · ${loja.nome}*`,
        '',
        `*Cliente:* ${retirada.nome.trim()}`,
        `*Retirada:* ${dataPorExtenso(retirada.data)} às ${retirada.horario}`,
        '',
        '*Itens*',
    ];

    itens.forEach((item, i) => {
        linhas.push(`${i + 1}. ${item.titulo}`);
        for (const detalhe of item.detalhes) linhas.push(`   • ${detalhe}`);
        linhas.push(`   Valor: ${valor(item)}`, '');
    });

    linhas.push(
        `*Total:* ${formatarReais(totais.totalCentavos)}${totais.temAConfirmar ? ' + item a confirmar' : ''}`,
        `*Sinal (${loja.sinalPercentual}%):* ${formatarReais(totais.sinalCentavos)}`,
        `*Restante na entrega:* ${formatarReais(totais.restanteCentavos)}`,
    );

    if (totais.temAConfirmar) {
        linhas.push('', '_Tem item com valor a confirmar. Combinamos por aqui._');
    }

    return linhas.join('\n');
}

/** Link que abre o WhatsApp da loja já com a mensagem escrita. */
export function linkWhatsApp(numero: string, mensagem: string): string {
    return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
