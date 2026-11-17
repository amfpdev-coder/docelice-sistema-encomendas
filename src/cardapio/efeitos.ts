/**
 * Etapa 10.6: efeitos visuais.
 * - abertura: tela de boas-vindas só na primeira visita (?abertura no link força mostrar)
 * - vitrine: carrossel em 3D (coverflow) que passa sozinho e desliza com o dedo
 * - inclinação 3D das fotos, acompanhando o mouse ou o giroscópio do celular
 * - itens entrando com movimento conforme a página rola
 * Tudo é desligado para quem pediu ao celular para reduzir movimento.
 */
import type { Cardapio } from '../dominio/cardapio';
import { movimentoReduzido } from '../servicos/navegador';
import { escapar } from './dom';
import { imagem } from './imagens';

const CHAVE_ABERTURA = 'docelice:abertura-vista';

// ===== Abertura =====

function aberturaJaVista(): boolean {
    try {
        return window.localStorage.getItem(CHAVE_ABERTURA) === 'sim';
    } catch {
        return false;
    }
}

function marcarAberturaVista(): void {
    try {
        window.localStorage.setItem(CHAVE_ABERTURA, 'sim');
    } catch {
        // sem armazenamento: a abertura aparece de novo na próxima visita, e tudo bem
    }
}

/** Mostra a abertura na primeira visita. Chama `aoFechar` quando a pessoa entra no cardápio. */
export function prepararAbertura(aoFechar: () => void): void {
    const abertura = document.querySelector<HTMLElement>('#abertura');
    if (!abertura) return;

    const forcar = new URLSearchParams(window.location.search).has('abertura');
    if (!forcar && aberturaJaVista()) return;

    // Enquanto a abertura está na tela, o resto da página fica "desligado" (teclado e leitor de tela)
    const fundo = document.querySelectorAll<HTMLElement>(
        'body > header, body > nav, body > main, body > footer, #barra-pedido',
    );
    fundo.forEach((el) => (el.inert = true));
    document.body.classList.add('com-abertura');
    abertura.hidden = false;

    const botao = abertura.querySelector<HTMLButtonElement>('#abertura-entrar');
    botao?.focus({ preventScroll: true });
    botao?.addEventListener('click', () => {
        marcarAberturaVista();
        abertura.classList.add('saindo');
        fundo.forEach((el) => (el.inert = false));
        document.body.classList.remove('com-abertura');
        window.setTimeout(
            () => {
                abertura.hidden = true;
                aoFechar();
            },
            movimentoReduzido() ? 0 : 550,
        );
    });
}

// ===== Vitrine em slide 3D (coverflow) =====

interface Carrossel {
    pintar(): void;
}

const carrosseis: Carrossel[] = [];

function moldeCarrossel(slides: Cardapio['vitrine'], rotulo: string): string {
    const total = slides.length;
    const itens = slides
        .map(
            (slide, i) => `
            <figure class="slide" role="group" aria-roledescription="slide" aria-label="${i + 1} de ${total}: ${escapar(slide.titulo)}">
                <div class="slide__foto">
                    ${imagem(slide.imagem, 'slide__img')}
                    <figcaption class="slide__legenda">
                        <strong>${escapar(slide.titulo)}</strong>
                        <span>${escapar(slide.legenda)}</span>
                    </figcaption>
                </div>
            </figure>`,
        )
        .join('');

    const pontos = slides
        .map(
            (slide, i) =>
                `<button type="button" class="carrossel__ponto" data-ir="${i}" aria-label="Mostrar ${escapar(slide.titulo)}"></button>`,
        )
        .join('');

    return `
        <div class="carrossel" aria-roledescription="carrossel" aria-label="${escapar(rotulo)}">
            <div class="carrossel__trilho">${itens}</div>
            <div class="carrossel__pontos">${pontos}</div>
        </div>`;
}

function criarCarrossel(raiz: HTMLElement): Carrossel {
    const trilho = raiz.querySelector<HTMLElement>('.carrossel__trilho')!;
    const slides = Array.from(raiz.querySelectorAll<HTMLElement>('.slide'));
    const pontos = Array.from(raiz.querySelectorAll<HTMLButtonElement>('.carrossel__ponto'));
    let atual = 0;
    let pausadoAte = 0;
    let quadroPedido = false;

    /** Passa para o CSS a distância de cada slide até o centro: --d (com sinal) e --ad (absoluta). */
    function pintar(): void {
        const largura = trilho.clientWidth;
        if (!largura) return; // escondido
        const meio = trilho.scrollLeft + largura / 2;
        let menor = Infinity;

        slides.forEach((slide, i) => {
            const centro = slide.offsetLeft + slide.offsetWidth / 2;
            const d = Math.max(-1.6, Math.min(1.6, (centro - meio) / slide.offsetWidth));
            const ad = Math.abs(d);
            slide.style.setProperty('--d', d.toFixed(3));
            slide.style.setProperty('--ad', Math.min(ad, 1).toFixed(3));
            slide.style.zIndex = String(100 - Math.round(ad * 10));
            if (ad < menor) {
                menor = ad;
                atual = i;
            }
        });

        pontos.forEach((ponto, i) => ponto.setAttribute('aria-current', String(i === atual)));
    }

    function pedirPintura(): void {
        if (quadroPedido) return;
        quadroPedido = true;
        requestAnimationFrame(() => {
            quadroPedido = false;
            pintar();
        });
    }

    function irPara(i: number, suave: boolean): void {
        const slide = slides[i];
        if (!slide) return;
        trilho.scrollTo({
            left: slide.offsetLeft - (trilho.clientWidth - slide.offsetWidth) / 2,
            behavior: suave && !movimentoReduzido() ? 'smooth' : 'auto',
        });
    }

    const pausar = () => (pausadoAte = Date.now() + 7000);

    trilho.addEventListener('scroll', pedirPintura, { passive: true });
    window.addEventListener('resize', () => {
        irPara(atual, false);
        pedirPintura();
    });
    for (const tipo of ['pointerdown', 'touchstart', 'wheel', 'focusin', 'mouseenter']) {
        raiz.addEventListener(tipo, pausar, { passive: true });
    }
    pontos.forEach((ponto) =>
        ponto.addEventListener('click', () => irPara(Number(ponto.dataset.ir), true)),
    );
    slides.forEach((slide, i) =>
        slide.addEventListener('click', () => {
            if (i !== atual) irPara(i, true);
        }),
    );

    // Passa sozinho a cada 3,8 s, só quando está visível e ninguém está mexendo
    if (!movimentoReduzido() && slides.length > 1) {
        window.setInterval(() => {
            if (Date.now() < pausadoAte || document.hidden || !trilho.clientWidth) return;
            const caixa = trilho.getBoundingClientRect();
            if (caixa.bottom < 0 || caixa.top > window.innerHeight) return;
            irPara((atual + 1) % slides.length, true);
        }, 3800);
    }

    const centralizarInicio = () => {
        irPara(atual, false);
        pintar();
    };
    requestAnimationFrame(centralizarInicio);
    window.addEventListener('load', centralizarInicio);

    return { pintar };
}

export function mostrarVitrines(cardapio: Cardapio): void {
    const destinos = ['#vitrine', '#abertura-vitrine'];
    if (cardapio.vitrine.length === 0) {
        document.querySelector<HTMLElement>('.secao--destaques')?.setAttribute('hidden', '');
        return;
    }
    for (const seletor of destinos) {
        const lugar = document.querySelector<HTMLElement>(seletor);
        if (!lugar) continue;
        lugar.innerHTML = moldeCarrossel(cardapio.vitrine, 'Destaques da Docelice');
        carrosseis.push(criarCarrossel(lugar.querySelector<HTMLElement>('.carrossel')!));
    }
}

export function pintarCarrosseis(): void {
    carrosseis.forEach((c) => c.pintar());
}

// ===== Inclinação 3D =====

function inclinar(el: HTMLElement, x: number, y: number): void {
    // x e y vão de -1 a 1
    const MAX = 10; // graus
    el.style.setProperty('--rx', `${(-y * MAX).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(x * MAX).toFixed(2)}deg`);
    el.style.setProperty('--tx', `${(x * -12).toFixed(1)}px`);
    el.style.setProperty('--ty', `${(y * -12).toFixed(1)}px`);
    el.style.setProperty('--bx', `${(50 + x * 40).toFixed(1)}%`);
    el.style.setProperty('--by', `${(50 + y * 40).toFixed(1)}%`);
}

export function ativarInclinacao3D(): void {
    if (movimentoReduzido()) return;

    // PC: acompanha o mouse (funciona também nos montadores, criados depois)
    document.addEventListener('pointermove', (evento) => {
        if (evento.pointerType !== 'mouse') return;
        const el = (evento.target as HTMLElement).closest<HTMLElement>('[data-tilt]');
        if (!el) return;
        const caixa = el.getBoundingClientRect();
        inclinar(
            el,
            ((evento.clientX - caixa.left) / caixa.width) * 2 - 1,
            ((evento.clientY - caixa.top) / caixa.height) * 2 - 1,
        );
    });
    document.addEventListener('pointerout', (evento) => {
        const el = (evento.target as HTMLElement).closest?.<HTMLElement>('[data-tilt]');
        if (el && !el.contains(evento.relatedTarget as Node | null)) inclinar(el, 0, 0);
    });

    // Celular: acompanha a inclinação do aparelho (Android; no iPhone fica a flutuação suave)
    let quadroPedido = false;
    let ultimo = { x: 0, y: 0 };
    window.addEventListener('deviceorientation', (evento) => {
        if (evento.gamma === null || evento.beta === null) return;
        ultimo = {
            x: Math.max(-1, Math.min(1, evento.gamma / 25)),
            y: Math.max(-1, Math.min(1, (evento.beta - 45) / 25)),
        };
        if (quadroPedido) return;
        quadroPedido = true;
        requestAnimationFrame(() => {
            quadroPedido = false;
            document
                .querySelectorAll<HTMLElement>('[data-tilt]')
                .forEach((el) => inclinar(el, ultimo.x, ultimo.y));
        });
    });
}

// ===== Entrada ao rolar =====

export function ativarRevelar(): void {
    const itens = document.querySelectorAll<HTMLElement>('[data-revelar]');
    if (movimentoReduzido() || !('IntersectionObserver' in window)) {
        itens.forEach((el) => el.classList.add('revelado'));
        return;
    }
    const observador = new IntersectionObserver(
        (entradas) => {
            for (const entrada of entradas) {
                if (!entrada.isIntersecting) continue;
                entrada.target.classList.add('revelado');
                observador.unobserve(entrada.target);
            }
        },
        { threshold: 0.12 },
    );
    itens.forEach((el) => observador.observe(el));
}
