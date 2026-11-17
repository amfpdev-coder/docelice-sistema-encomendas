/** Ajudantes pequenos para mexer na página com segurança. */

/**
 * Protege textos antes de colocar no HTML.
 * Sem isso, um sabor com "<" ou aspas no cardapio.json poderia quebrar a página.
 */
export function escapar(texto: string | number): string {
    return String(texto).replace(/[&<>"']/g, (caractere) => {
        const trocas: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        };
        return trocas[caractere] ?? caractere;
    });
}

/**
 * Busca um elemento na página. Se ele não existir, avisa na hora com um erro claro,
 * em vez de deixar um "null" estourar lá na frente.
 */
export function elemento<T extends HTMLElement = HTMLElement>(seletor: string): T {
    const encontrado = document.querySelector<T>(seletor);
    if (!encontrado) {
        throw new Error(`Elemento não encontrado na página: ${seletor}`);
    }
    return encontrado;
}
