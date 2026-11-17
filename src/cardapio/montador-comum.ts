/**
 * Peças compartilhadas pelos montadores de docinhos e de tortas:
 * o topo com a foto, os grupos de opções, o campo de observação e o rodapé com o botão.
 */
import { escapar } from './dom';
import { ICONE_DESCER } from './icones';
import { imagem } from './imagens';

export function topoProduto(
    titulo: string,
    descricao: string,
    precoHtml: string,
    foto: string | null,
) {
    return `
        <button type="button" class="fechar fechar--flutuante" data-fechar aria-label="Fechar">${ICONE_DESCER}</button>
        <div class="produto-hero" data-tilt>${imagem(foto, 'produto-hero__foto')}</div>
        <div class="produto-cabeca">
            <h2 id="montador-titulo">${escapar(titulo)}</h2>
            <p>${escapar(descricao)}</p>
            <p class="produto-cabeca__preco">${precoHtml}</p>
        </div>`;
}

export function cabecaGrupo(id: string, titulo: string, subtitulo: string, selo: string) {
    return `
        <header class="grupo__cabeca">
            <div>
                <h3 id="${id}">${escapar(titulo)}</h3>
                <p>${escapar(subtitulo)}</p>
            </div>
            <span class="selo" data-selo="${id}">${escapar(selo)}</span>
        </header>`;
}

export function grupoObservacao(sugestao: string) {
    return `
        <section class="grupo">
            <header class="grupo__cabeca">
                <div><h3><label for="obs">Alguma observação?</label></h3></div>
                <span class="contador" data-contador>0/140</span>
            </header>
            <div class="grupo__campo">
                <textarea id="obs" name="obs" rows="3" maxlength="140" placeholder="${escapar(sugestao)}"></textarea>
            </div>
        </section>`;
}

export function rodapeProduto() {
    return `
        <footer class="sheet__pe">
            <p class="sheet__status" data-status aria-live="polite"></p>
            <button type="button" class="botao botao--adicionar" data-adicionar disabled>
                <span>Adicionar</span>
                <span data-total></span>
            </button>
        </footer>`;
}

/** Selo do grupo: "OBRIGATÓRIO" ou "0/2" enquanto falta, "✓" quando está completo. */
export function marcarSelo(painel: HTMLElement, id: string, completo: boolean, pendente: string) {
    const selo = painel.querySelector<HTMLElement>(`[data-selo="${id}"]`);
    if (!selo) return;
    selo.classList.toggle('selo--ok', completo);
    selo.textContent = completo ? '✓' : pendente;
    selo.setAttribute('aria-label', completo ? 'Concluído' : pendente);
}

/** Liga o contador "0/140" do campo de observação e devolve uma função que lê o texto. */
export function ligarObservacao(painel: HTMLElement): () => string {
    const campo = painel.querySelector<HTMLTextAreaElement>('#obs');
    const contador = painel.querySelector<HTMLElement>('[data-contador]');
    campo?.addEventListener('input', () => {
        if (contador) contador.textContent = `${campo.value.length}/140`;
    });
    return () => campo?.value ?? '';
}

/** Abre o painel como modal (fundo escuro, Esc fecha, foco preso dentro) já no topo. */
export function abrirPainel(painel: HTMLDialogElement): void {
    painel.showModal();
    const corpo = painel.querySelector('.sheet__corpo');
    if (corpo) corpo.scrollTop = 0;
}

/** Fecha no botão de fechar ou ao tocar no fundo escuro, fora do painel. */
export function configurarFechamento(painel: HTMLDialogElement): void {
    painel.addEventListener('click', (evento) => {
        const alvo = evento.target as HTMLElement;
        if (alvo === painel || alvo.closest('[data-fechar]')) painel.close();
    });
}
