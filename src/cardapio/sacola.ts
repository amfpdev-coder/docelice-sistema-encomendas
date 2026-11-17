/** Etapa 10.5: "Seu pedido" (sacola), retirada e envio pelo WhatsApp. */
import type { Carrinho } from '../dominio/carrinho';
import type { Cardapio } from '../dominio/cardapio';
import { dataISO, dataMinimaRetirada, dataPorExtenso } from '../dominio/datas';
import { formatarReais } from '../dominio/dinheiro';
import { linkWhatsApp, montarMensagem } from '../dominio/mensagem';
import { calcularTotais, type Totais } from '../dominio/pedido';
import { escapar } from './dom';
import { ICONE_DESCER, PETALAS } from './icones';
import { abrirPainel } from './montador-comum';

const CHAVE_CLIENTE = 'docelice:cliente';

function lerNomeSalvo(): string {
    try {
        return window.localStorage.getItem(CHAVE_CLIENTE) ?? '';
    } catch {
        return '';
    }
}

function salvarNome(nome: string): void {
    try {
        window.localStorage.setItem(CHAVE_CLIENTE, nome);
    } catch {
        // sem armazenamento: só não lembra o nome na próxima visita
    }
}

function textoTotal(totais: Totais): string {
    return formatarReais(totais.totalCentavos) + (totais.temAConfirmar ? ' + a confirmar' : '');
}

export function abrirSacola(painel: HTMLDialogElement, cardapio: Cardapio, carrinho: Carrinho) {
    const { loja } = cardapio;
    const minima = dataMinimaRetirada(new Date(), loja.antecedenciaMinimaDias);
    const { inicio, fim } = loja.horarioRetirada;

    painel.innerHTML = `
        <header class="sheet__cabeca">
            <button type="button" class="fechar" data-fechar aria-label="Fechar">${ICONE_DESCER}</button>
            <h2 id="carrinho-titulo">Seu pedido</h2>
            <button type="button" class="link" data-limpar>Limpar</button>
        </header>

        <div class="sheet__corpo">
            <div class="loja-mini">
                <img class="loja-mini__logo" src="/img/logo.png" alt="" width="44" height="44" />
                <div class="loja-mini__texto">
                    <strong>${escapar(loja.nome)}</strong>
                    <small>Somente encomendas · retirada no local</small>
                </div>
            </div>

            <ul class="itens" id="itens-pedido"></ul>
            <button type="button" class="link link--bloco" data-fechar>+ Adicionar mais itens</button>

            <form id="form-pedido" class="bloco" novalidate>
                <h3 class="bloco__titulo">Retirada</h3>
                <label class="campo">
                    <span>Seu nome</span>
                    <input type="text" name="nome" autocomplete="name" required value="${escapar(lerNomeSalvo())}" />
                </label>
                <div class="campos-linha">
                    <label class="campo">
                        <span>Data</span>
                        <input type="date" name="data" required min="${dataISO(minima)}" />
                    </label>
                    <label class="campo">
                        <span>Horário</span>
                        <input type="time" name="horario" required min="${escapar(inicio)}" max="${escapar(fim)}" />
                    </label>
                </div>
                <p class="campo__ajuda">
                    A partir de ${dataPorExtenso(dataISO(minima))}, das ${escapar(inicio)} às ${escapar(fim)}.
                    Recomendamos retirar de carro.
                </p>
            </form>

            <section class="bloco" aria-labelledby="titulo-resumo">
                <h3 class="bloco__titulo" id="titulo-resumo">Resumo de valores</h3>
                <dl class="totais" id="totais-pedido"></dl>
                <p class="campo__ajuda">
                    O pagamento é combinado pelo WhatsApp: ${loja.sinalPercentual}% para confirmar a encomenda e o restante na retirada.
                </p>
            </section>

            <div class="enviado" id="pedido-enviado" hidden>
                <p><strong>Abrimos o WhatsApp com o seu pedido.</strong> É só enviar a mensagem por lá!</p>
                <button type="button" class="botao botao--contorno" data-novo-pedido>Começar um novo pedido</button>
            </div>
        </div>

        <footer class="sheet__pe">
            <button type="submit" form="form-pedido" class="botao botao--adicionar">
                <span>Enviar pelo WhatsApp</span>
                <span id="total-botao"></span>
            </button>
        </footer>`;

    const lista = painel.querySelector<HTMLUListElement>('#itens-pedido')!;
    const totaisEl = painel.querySelector<HTMLElement>('#totais-pedido')!;
    const botaoEnviar = painel.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    const totalBotao = painel.querySelector<HTMLElement>('#total-botao')!;
    const form = painel.querySelector<HTMLFormElement>('#form-pedido')!;

    function mostrarItens(): void {
        const itens = carrinho.lista();

        if (itens.length === 0) {
            lista.innerHTML = `<li class="vazio">${PETALAS}<p>Seu pedido está vazio.</p><small>Escolha docinhos ou uma torta para começar.</small></li>`;
            totaisEl.innerHTML = '';
            totalBotao.textContent = '';
            botaoEnviar.disabled = true;
            return;
        }

        lista.innerHTML = itens
            .map(
                (item) => `
                <li class="item">
                    <div class="item__texto">
                        <h3>${escapar(item.titulo)}</h3>
                        <ul>${item.detalhes.map((d) => `<li>${escapar(d)}</li>`).join('')}</ul>
                        <button type="button" class="link" data-remover="${escapar(item.id)}" aria-label="Remover ${escapar(item.titulo)}">Remover</button>
                    </div>
                    <strong class="item__valor">${item.valorCentavos === null ? 'a confirmar' : formatarReais(item.valorCentavos)}</strong>
                </li>`,
            )
            .join('');

        const totais = calcularTotais(itens, loja.sinalPercentual);
        totaisEl.innerHTML = `
            <div><dt>Subtotal</dt><dd>${textoTotal(totais)}</dd></div>
            <div><dt>Sinal (${loja.sinalPercentual}%) na encomenda</dt><dd>${formatarReais(totais.sinalCentavos)}</dd></div>
            <div><dt>Restante na retirada</dt><dd>${formatarReais(totais.restanteCentavos)}</dd></div>
            <div class="totais__total"><dt>Total</dt><dd>${textoTotal(totais)}</dd></div>
            ${totais.temAConfirmar ? '<p class="campo__ajuda">Um item está com valor a confirmar. O sinal dele é combinado pelo WhatsApp.</p>' : ''}`;
        totalBotao.textContent = formatarReais(totais.totalCentavos);
        botaoEnviar.disabled = false;
    }

    lista.addEventListener('click', (evento) => {
        const botao = (evento.target as HTMLElement).closest<HTMLElement>('[data-remover]');
        if (botao?.dataset.remover) carrinho.remover(botao.dataset.remover);
    });

    painel.querySelector('[data-limpar]')!.addEventListener('click', () => {
        if (carrinho.quantidade() > 0 && !window.confirm('Tirar todos os itens do pedido?')) return;
        carrinho.esvaziar();
        painel.close();
    });

    painel.querySelector('[data-novo-pedido]')!.addEventListener('click', () => {
        carrinho.esvaziar();
        painel.close();
    });

    form.addEventListener('submit', (evento) => {
        evento.preventDefault();
        if (!form.reportValidity()) return; // o navegador mostra o que falta preencher

        const dados = new FormData(form);
        const retirada = {
            nome: String(dados.get('nome') ?? '').trim(),
            data: String(dados.get('data') ?? ''),
            horario: String(dados.get('horario') ?? ''),
        };
        salvarNome(retirada.nome);

        const mensagem = montarMensagem(loja, carrinho.lista(), retirada);
        window.open(linkWhatsApp(loja.whatsapp, mensagem), '_blank');
        painel.querySelector<HTMLElement>('#pedido-enviado')!.hidden = false;
    });

    // Enquanto a sacola está aberta, ela acompanha as mudanças do pedido (ex.: remover item)
    const pararDeOuvir = carrinho.quandoMudar(mostrarItens);
    painel.addEventListener('close', pararDeOuvir, { once: true });

    mostrarItens();
    abrirPainel(painel);
}
