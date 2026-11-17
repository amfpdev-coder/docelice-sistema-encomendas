/**
 * Monta a página do cardápio a partir dos dados: topo da loja, produtos e infos.
 * Só desenha. As regras (preços, mínimos) ficam em src/dominio.
 */
import type { Cardapio } from '../dominio/cardapio';
import { centavos, formatarReais } from '../dominio/dinheiro';
import { precoMinimoTortas } from '../dominio/tortas';
import { elemento, escapar } from './dom';
import { PETALAS } from './icones';
import { imagem } from './imagens';

/** Dados de uma linha de produto, já prontos para exibir. */
interface LinhaProduto {
    titulo: string;
    descricao: string;
    detalhe: string;
    precoHtml: string;
    chips: string[];
    imagem: string | null;
    /** Identifica o produto, ex.: "docinho:tradicionais" ou "torta" */
    produto: string;
}

function linhaProduto(p: LinhaProduto): string {
    const chips = p.chips.map((c) => `<span class="chip chip--mini">${escapar(c)}</span>`).join('');
    return `
        <article class="produto" data-revelar>
            <div class="produto__texto">
                <h3 class="produto__nome">
                    <button type="button" class="produto__abrir" data-produto="${escapar(p.produto)}">
                        ${escapar(p.titulo)}
                    </button>
                </h3>
                <p class="produto__desc">${escapar(p.descricao)}</p>
                <p class="produto__detalhe">${escapar(p.detalhe)}</p>
                <div class="produto__rodape">
                    <span class="produto__preco">${p.precoHtml}</span>
                    ${chips}
                </div>
            </div>
            <div class="produto__midia" data-tilt>
                ${imagem(p.imagem, 'produto__foto')}
                <span class="brilho" aria-hidden="true"></span>
            </div>
        </article>`;
}

export function mostrarLoja(cardapio: Cardapio): void {
    const { loja, docinhos } = cardapio;

    elemento('#nome-loja').textContent = loja.nome;

    const insta = elemento<HTMLAnchorElement>('#link-instagram');
    insta.href = `https://instagram.com/${loja.instagram}`;
    elemento('#link-instagram span').textContent = `@${loja.instagram}`;

    const chips = [
        `Mínimo ${docinhos.minimoTotal} docinhos`,
        `Sinal de ${loja.sinalPercentual}%`,
        'Retirada no local',
    ];
    elemento('#loja-chips').insertAdjacentHTML(
        'beforeend',
        chips.map((c) => `<li class="chip">${escapar(c)}</li>`).join(''),
    );

    elemento('#nota-docinhos').textContent =
        `${docinhos.peso} cada · mínimo de ${docinhos.minimoTotal} · sabores de ${docinhos.passo} em ${docinhos.passo}`;
}

export function mostrarDocinhos(cardapio: Cardapio): void {
    const { docinhos } = cardapio;

    elemento('#lista-docinhos').innerHTML = docinhos.categorias
        .map((categoria) =>
            linhaProduto({
                titulo: categoria.nome,
                descricao: categoria.descricao,
                detalhe: categoria.sabores.join(' · '),
                precoHtml: `${formatarReais(centavos(categoria.preco))} <small>/unid.</small>`,
                chips: [docinhos.peso],
                imagem: categoria.imagem,
                produto: `docinho:${categoria.id}`,
            }),
        )
        .join('');
}

export function mostrarTortas(cardapio: Cardapio): void {
    const { tortas } = cardapio;
    const minimo = precoMinimoTortas(tortas);

    elemento('#lista-tortas').innerHTML = linhaProduto({
        titulo: tortas.nome,
        descricao: tortas.descricao,
        detalhe: `${tortas.tamanhos.map((t) => t.nome).join(' · ')} · massa ${tortas.massas
            .join(' ou ')
            .toLowerCase()}`,
        precoHtml:
            minimo === null
                ? 'Preço a confirmar'
                : `<small>A partir de</small> ${formatarReais(centavos(minimo))}`,
        chips: [`${tortas.quantidadeRecheios} recheios`],
        imagem: tortas.imagem,
        produto: 'torta',
    });
}

export function mostrarInfos(cardapio: Cardapio): void {
    const { infos, loja } = cardapio;

    elemento('#lista-infos').innerHTML = infos
        .map(
            (info) => `
            <li class="info" data-revelar>
                <span class="info__icone" aria-hidden="true">${PETALAS}</span>
                <div>
                    <h3>${escapar(info.titulo)}</h3>
                    <p>${escapar(info.texto)}</p>
                </div>
            </li>`,
        )
        .join('');

    elemento('#contatos').innerHTML = `
        <p class="contatos__titulo">Ficou com dúvida?</p>
        <p class="contatos__linha">${escapar(loja.telefoneExibicao)} · @${escapar(loja.instagram)}</p>
        <div class="contatos__botoes">
            <a class="botao" href="https://wa.me/${escapar(loja.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>
            <a class="botao botao--contorno" href="https://instagram.com/${escapar(loja.instagram)}" target="_blank" rel="noopener">Instagram</a>
        </div>`;
}
