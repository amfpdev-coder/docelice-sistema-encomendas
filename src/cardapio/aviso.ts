/** Aviso rápido que aparece embaixo e some sozinho ("Adicionado ao pedido"). */
import { elemento } from './dom';

let temporizador: number | undefined;

export function avisar(texto: string): void {
    const aviso = elemento('#aviso');
    aviso.textContent = texto;
    aviso.classList.add('visivel');
    window.clearTimeout(temporizador);
    temporizador = window.setTimeout(() => aviso.classList.remove('visivel'), 2200);
}
