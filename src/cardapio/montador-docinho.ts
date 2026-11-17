/** Etapa 10.3: montador de docinhos (sabores de 25 em 25, mínimo de 50, até N cores). */
import type { Carrinho } from '../dominio/carrinho';
import type { Cardapio } from '../dominio/cardapio';
import { centavos, formatarReais } from '../dominio/dinheiro';
import {
    montarItemDocinhos,
    pendenciaDocinhos,
    totalUnidades,
    type EscolhaDocinhos,
} from '../dominio/docinhos';
import { juntarComE } from '../dominio/texto';
import { novoId } from '../servicos/navegador';
import { avisar } from './aviso';
import { escapar } from './dom';
import { ICONE_MAIS, ICONE_MENOS } from './icones';
import {
    abrirPainel,
    cabecaGrupo,
    grupoObservacao,
    ligarObservacao,
    marcarSelo,
    rodapeProduto,
    topoProduto,
} from './montador-comum';

export function abrirMontadorDocinho(
    painel: HTMLDialogElement,
    cardapio: Cardapio,
    carrinho: Carrinho,
    categoriaId: string,
): void {
    const regras = cardapio.docinhos;
    const categoria = regras.categorias.find((c) => c.id === categoriaId);
    if (!categoria) return;

    const precoUnidade = centavos(categoria.preco);
    const quantidades = categoria.sabores.map(() => 0);
    let cores: string[] = [];

    const linhasSabores = categoria.sabores
        .map(
            (sabor, i) => `
            <div class="opcao" data-linha="${i}">
                <span class="opcao__texto">
                    <span id="sabor-${i}">${escapar(sabor)}</span>
                    <small>${formatarReais(precoUnidade * regras.passo)} a cada ${regras.passo}</small>
                </span>
                <div class="stepper stepper--vazio" role="group" aria-labelledby="sabor-${i}">
                    <button type="button" class="stepper__btn" data-menos="${i}" aria-label="Menos ${regras.passo} de ${escapar(sabor)}">${ICONE_MENOS}</button>
                    <output class="stepper__valor" id="qtd-${i}">0</output>
                    <button type="button" class="stepper__btn stepper__btn--mais" data-mais="${i}" aria-label="Mais ${regras.passo} de ${escapar(sabor)}">${ICONE_MAIS}</button>
                </div>
            </div>`,
        )
        .join('');

    const linhasCores = regras.coresForminha
        .map(
            (cor) => `
            <label class="opcao">
                <span class="amostra" style="background:${escapar(cor.hex)}" aria-hidden="true"></span>
                <span class="opcao__texto"><span>${escapar(cor.nome)}</span></span>
                <input type="checkbox" class="marcador marcador--caixa" name="cor" value="${escapar(cor.nome)}" />
            </label>`,
        )
        .join('');

    const variasCores = regras.maxCoresForminha > 1;

    painel.innerHTML = `
        <div class="sheet__corpo">
            ${topoProduto(
                categoria.nome,
                categoria.descricao,
                `${formatarReais(precoUnidade)} <small>por unidade · ${escapar(regras.peso)} cada</small>`,
                categoria.imagem,
            )}

            <section class="grupo" aria-labelledby="g-sabores">
                ${cabecaGrupo(
                    'g-sabores',
                    'Escolha os sabores',
                    `De ${regras.passo} em ${regras.passo} · mínimo de ${regras.minimoTotal} no total`,
                    `0/${regras.minimoTotal}`,
                )}
                ${linhasSabores}
            </section>

            <section class="grupo" role="group" aria-labelledby="g-cor">
                ${cabecaGrupo(
                    'g-cor',
                    variasCores ? 'Cores da forminha' : 'Cor da forminha',
                    variasCores
                        ? `Escolha até ${regras.maxCoresForminha} cores · forminha quatro pétalas`
                        : 'Forminha quatro pétalas',
                    'Obrigatório',
                )}
                ${linhasCores}
            </section>

            ${grupoObservacao(categoria.sugestaoObservacao ?? 'Alguma preferência?')}
        </div>
        ${rodapeProduto()}`;

    const lerObservacao = ligarObservacao(painel);
    const botaoAdicionar = painel.querySelector<HTMLButtonElement>('[data-adicionar]')!;
    const caixasCores = Array.from(painel.querySelectorAll<HTMLInputElement>('input[name="cor"]'));

    const escolhaAtual = (): EscolhaDocinhos => ({
        quantidades,
        cores,
        observacao: lerObservacao(),
    });

    function atualizar(): void {
        const total = totalUnidades(quantidades);

        quantidades.forEach((quantidade, i) => {
            painel.querySelector(`#qtd-${i}`)!.textContent = String(quantidade);
            painel
                .querySelector(`[data-linha="${i}"] .stepper`)
                ?.classList.toggle('stepper--vazio', quantidade === 0);
        });

        // Com o máximo de cores marcado, as outras ficam bloqueadas
        const cheio = cores.length >= regras.maxCoresForminha;
        for (const caixa of caixasCores) caixa.disabled = cheio && !caixa.checked;

        marcarSelo(
            painel,
            'g-sabores',
            total >= regras.minimoTotal,
            `${total}/${regras.minimoTotal}`,
        );
        marcarSelo(painel, 'g-cor', cores.length > 0, 'Obrigatório');

        const pendencia = pendenciaDocinhos(regras, escolhaAtual());
        let status = pendencia ?? '';
        if (!pendencia && cores.length > 1) {
            status = `Forminhas: ${juntarComE(cores)} · a divisão é combinada pelo WhatsApp`;
        }
        painel.querySelector('[data-status]')!.textContent = status;
        painel.querySelector('[data-total]')!.textContent = total
            ? formatarReais(total * precoUnidade)
            : '';
        botaoAdicionar.disabled = pendencia !== null;
    }

    painel.querySelectorAll<HTMLButtonElement>('[data-mais]').forEach((botao) => {
        botao.addEventListener('click', () => {
            const i = Number(botao.dataset.mais);
            quantidades[i] = (quantidades[i] ?? 0) + regras.passo;
            atualizar();
        });
    });

    painel.querySelectorAll<HTMLButtonElement>('[data-menos]').forEach((botao) => {
        botao.addEventListener('click', () => {
            const i = Number(botao.dataset.menos);
            quantidades[i] = Math.max(0, (quantidades[i] ?? 0) - regras.passo);
            atualizar();
            // Se zerou, o "−" some: o foco volta para o "+"
            if (quantidades[i] === 0)
                painel.querySelector<HTMLElement>(`[data-mais="${i}"]`)?.focus();
        });
    });

    for (const caixa of caixasCores) {
        caixa.addEventListener('change', () => {
            // Mantém as cores na ordem da lista do cardápio
            cores = caixasCores.filter((c) => c.checked).map((c) => c.value);
            atualizar();
        });
    }

    botaoAdicionar.addEventListener('click', () => {
        carrinho.adicionar(montarItemDocinhos(categoria, regras, escolhaAtual(), novoId()));
        painel.close();
        avisar('Adicionado ao pedido');
    });

    atualizar();
    abrirPainel(painel);
}
