/**
 * Fotos dos produtos, com espaço reservado.
 * Se o cardápio não tiver foto (null) ou o arquivo não existir na pasta img/,
 * aparece a forminha de pétalas com "foto em breve" no lugar, e nada quebra.
 */
import { escapar } from './dom';
import { PETALAS } from './icones';

export function reserva(classe: string): string {
    return `<div class="${classe} reserva" aria-hidden="true">${PETALAS}<span>foto em breve</span></div>`;
}

export function imagem(src: string | null, classe: string): string {
    if (!src) return reserva(classe);
    return `<img class="${classe}" src="${escapar(src)}" alt="" loading="lazy" data-reserva="${classe}" />`;
}

/** Troca qualquer imagem que falhar ao carregar pelo espaço reservado. */
export function ativarReservaDeImagens(): void {
    document.addEventListener(
        'error',
        (evento) => {
            const alvo = evento.target;
            if (!(alvo instanceof HTMLImageElement) || !alvo.dataset.reserva) return;
            const molde = document.createElement('template');
            molde.innerHTML = reserva(alvo.dataset.reserva);
            alvo.replaceWith(molde.content);
        },
        true, // "captura": o erro de imagem não sobe pela página, então é preciso pegar na descida
    );
}
