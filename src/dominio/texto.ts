/** ["Rosa", "Branca", "Dourada"] → "Rosa, Branca e Dourada" */
export function juntarComE(lista: readonly string[]): string {
    if (lista.length <= 1) return lista.join('');
    return `${lista.slice(0, -1).join(', ')} e ${lista.at(-1) ?? ''}`;
}
