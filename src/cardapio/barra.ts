/** Etapa 10.2: barra fixa "Ver pedido", que aparece quando há itens no pedido. */
import type { Carrinho } from '../dominio/carrinho';
import type { Cardapio } from '../dominio/cardapio';
import { formatarReais } from '../dominio/dinheiro';
import { calcularTotais } from '../dominio/pedido';
import { elemento } from './dom';

export function ligarBarra(carrinho: Carrinho, cardapio: Cardapio): void {
    const area = elemento('#barra-pedido');
    const botao = elemento<HTMLButtonElement>('#barra-carrinho');

    function atualizar(): void {
        const quantidade = carrinho.quantidade();
        area.hidden = quantidade === 0;
        document.body.classList.toggle('com-pedido', quantidade > 0);
        if (quantidade === 0) return;

        const totais = calcularTotais(carrinho.lista(), cardapio.loja.sinalPercentual);
        const total =
            formatarReais(totais.totalCentavos) + (totais.temAConfirmar ? ' + a confirmar' : '');

        elemento('#barra-qtd').textContent = String(quantidade);
        elemento('#barra-total').textContent = total;
        botao.setAttribute(
            'aria-label',
            `Ver pedido: ${quantidade === 1 ? '1 item' : `${quantidade} itens`}, ${total}`,
        );
    }

    carrinho.quandoMudar(atualizar);
    atualizar();
}
