/**
 * Abas fixas que acompanham a rolagem.
 * A aba ativa é a da última seção cujo título já passou logo abaixo das abas.
 */
import { elemento } from './dom';

export function configurarNavegacao(): void {
    const abas = Array.from(document.querySelectorAll<HTMLAnchorElement>('.aba'));
    const secoes = abas
        .map((aba) => document.querySelector<HTMLElement>(aba.hash))
        .filter((secao): secao is HTMLElement => secao !== null);
    const barraAbas = elemento('.abas');

    function ativar(id: string): void {
        for (const aba of abas) {
            const ativa = aba.hash === `#${id}`;
            aba.classList.toggle('ativa', ativa);
            if (ativa) aba.setAttribute('aria-current', 'true');
            else aba.removeAttribute('aria-current');
        }
    }

    // Depois de um toque numa aba, ela fica marcada até a rolagem terminar.
    // Sem isso, uma seção curta (como Tortas) deixaria a aba seguinte acesa.
    let travadoAte = 0;
    for (const aba of abas) {
        aba.addEventListener('click', () => {
            ativar(aba.hash.slice(1));
            travadoAte = Date.now() + 1200;
        });
    }

    function conferirSecao(): void {
        if (Date.now() < travadoAte || secoes.length === 0) return;
        const linha = barraAbas.getBoundingClientRect().bottom + 24;
        let atual = secoes[0]!;
        for (const secao of secoes) {
            if (secao.getBoundingClientRect().top <= linha) atual = secao;
        }
        ativar(atual.id);
    }

    // requestAnimationFrame: confere no máximo uma vez por quadro, sem pesar a rolagem
    let quadroPedido = false;
    window.addEventListener(
        'scroll',
        () => {
            if (quadroPedido) return;
            quadroPedido = true;
            requestAnimationFrame(() => {
                quadroPedido = false;
                conferirSecao();
            });
        },
        { passive: true },
    );
}
