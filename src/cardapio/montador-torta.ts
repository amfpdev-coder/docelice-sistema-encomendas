/** Etapa 10.4: montador de tortas (tamanho, massa, 2 recheios, acabamento). */
import type { Carrinho } from '../dominio/carrinho';
import type { Cardapio } from '../dominio/cardapio';
import { centavos, formatarReais } from '../dominio/dinheiro';
import {
    montarItemTorta,
    pendenciasTorta,
    precoTortaCentavos,
    tipoTorta,
    type EscolhaTorta,
} from '../dominio/tortas';
import { novoId } from '../servicos/navegador';
import { avisar } from './aviso';
import { escapar } from './dom';
import {
    abrirPainel,
    cabecaGrupo,
    grupoObservacao,
    ligarObservacao,
    marcarSelo,
    rodapeProduto,
    topoProduto,
} from './montador-comum';

type Tortas = Cardapio['tortas'];

function textoPrecoTamanho(tamanho: Tortas['tamanhos'][number]): string {
    if (tamanho.precoTradicional === null || tamanho.precoEspecial === null) return 'a confirmar';
    return `${formatarReais(centavos(tamanho.precoTradicional))} · ${formatarReais(centavos(tamanho.precoEspecial))}`;
}

function linhaRadio(nome: string, valor: string, rotulo: string, extraHtml = '', detalhe = '') {
    return `
        <label class="opcao">
            <span class="opcao__texto">
                <span>${escapar(rotulo)}</span>
                ${detalhe ? `<small>${escapar(detalhe)}</small>` : ''}
            </span>
            ${extraHtml}
            <input type="radio" class="marcador" name="${nome}" value="${escapar(valor)}" />
        </label>`;
}

function linhasRecheio(lista: readonly string[], especial: boolean) {
    return lista
        .map(
            (recheio) => `
            <label class="opcao">
                <span class="opcao__texto">
                    <span>${escapar(recheio)}</span>
                    ${especial ? '<small class="tag-especial">especial</small>' : ''}
                </span>
                <input type="checkbox" class="marcador marcador--caixa" name="recheio" value="${escapar(recheio)}" />
            </label>`,
        )
        .join('');
}

export function abrirMontadorTorta(
    painel: HTMLDialogElement,
    cardapio: Cardapio,
    carrinho: Carrinho,
): void {
    const tortas = cardapio.tortas;
    const quantidade = tortas.quantidadeRecheios;

    const linhasTamanho = tortas.tamanhos
        .map((t) =>
            linhaRadio(
                'tamanho',
                t.id,
                t.nome,
                `<span class="opcao__preco">${textoPrecoTamanho(t)}</span>`,
                /confirmar/i.test(t.rendimento)
                    ? 'Rendimento a confirmar'
                    : `Serve ${t.rendimento}`,
            ),
        )
        .join('');

    const linhasMassa = tortas.massas.map((m) => linhaRadio('massa', m, m)).join('');

    const linhasAcabamento = tortas.acabamentos
        .map((a) =>
            linhaRadio(
                'acabamento',
                a.nome,
                a.nome,
                a.acrescimo > 0
                    ? `<span class="opcao__preco">+ ${formatarReais(centavos(a.acrescimo))}</span>`
                    : '',
            ),
        )
        .join('');

    painel.innerHTML = `
        <div class="sheet__corpo">
            ${topoProduto('Montar torta', tortas.descricao, 'Preço: tradicional · especial', tortas.imagem)}

            <section class="grupo" role="radiogroup" aria-labelledby="g-tamanho" aria-required="true">
                ${cabecaGrupo('g-tamanho', 'Tamanho', 'Escolha 1 opção', 'Obrigatório')}
                ${linhasTamanho}
            </section>

            <section class="grupo" role="radiogroup" aria-labelledby="g-massa" aria-required="true">
                ${cabecaGrupo('g-massa', 'Massa', 'Escolha 1 opção', 'Obrigatório')}
                ${linhasMassa}
            </section>

            <section class="grupo" role="group" aria-labelledby="g-recheios">
                ${cabecaGrupo(
                    'g-recheios',
                    'Recheios',
                    `Escolha ${quantidade}. Se algum for especial, vale o preço especial`,
                    `0/${quantidade}`,
                )}
                <p class="grupo__sub">Tradicionais</p>
                ${linhasRecheio(tortas.recheiosTradicionais, false)}
                <p class="grupo__sub">Especiais</p>
                ${linhasRecheio(tortas.recheiosEspeciais, true)}
            </section>

            <section class="grupo" role="radiogroup" aria-labelledby="g-acabamento" aria-required="true">
                ${cabecaGrupo('g-acabamento', 'Acabamento', 'Escolha 1 opção', 'Obrigatório')}
                ${linhasAcabamento}
            </section>

            ${grupoObservacao('Ex.: escrever "Parabéns, Ana"')}
        </div>
        ${rodapeProduto()}`;

    const lerObservacao = ligarObservacao(painel);
    const botaoAdicionar = painel.querySelector<HTMLButtonElement>('[data-adicionar]')!;
    const caixasRecheio = Array.from(
        painel.querySelectorAll<HTMLInputElement>('input[name="recheio"]'),
    );

    const marcado = (nome: string) =>
        painel.querySelector<HTMLInputElement>(`input[name="${nome}"]:checked`)?.value ?? null;

    const escolhaAtual = (): EscolhaTorta => ({
        tamanhoId: marcado('tamanho'),
        massa: marcado('massa'),
        recheios: caixasRecheio.filter((c) => c.checked).map((c) => c.value),
        acabamento: marcado('acabamento'),
        observacao: lerObservacao(),
    });

    function atualizar(): void {
        const escolha = escolhaAtual();
        const cheio = escolha.recheios.length >= quantidade;

        // Com o máximo de recheios marcado, os outros ficam bloqueados
        for (const caixa of caixasRecheio) caixa.disabled = cheio && !caixa.checked;

        marcarSelo(painel, 'g-tamanho', escolha.tamanhoId !== null, 'Obrigatório');
        marcarSelo(painel, 'g-massa', escolha.massa !== null, 'Obrigatório');
        marcarSelo(painel, 'g-recheios', cheio, `${escolha.recheios.length}/${quantidade}`);
        marcarSelo(painel, 'g-acabamento', escolha.acabamento !== null, 'Obrigatório');

        const falta = pendenciasTorta(tortas, escolha);
        painel.querySelector('[data-status]')!.textContent =
            falta.length > 0
                ? `Falta escolher: ${falta.join(', ')}`
                : `Torta ${tipoTorta(tortas, escolha.recheios)}`;

        const preco = precoTortaCentavos(tortas, escolha);
        painel.querySelector('[data-total]')!.textContent = escolha.tamanhoId
            ? preco === null
                ? 'a confirmar'
                : formatarReais(preco)
            : '';

        botaoAdicionar.disabled = falta.length > 0;
    }

    painel.querySelector('.sheet__corpo')!.addEventListener('change', atualizar);

    botaoAdicionar.addEventListener('click', () => {
        carrinho.adicionar(montarItemTorta(tortas, escolhaAtual(), novoId()));
        painel.close();
        avisar('Adicionado ao pedido');
    });

    atualizar();
    abrirPainel(painel);
}
