/** Datas de retirada. Sempre no horário local, porque a confeitaria e as clientes estão no mesmo fuso. */

/** Data no formato do campo <input type="date">: 2026-11-21 */
export function dataISO(data: Date): string {
    const doisDigitos = (n: number) => String(n).padStart(2, '0');
    return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

/** "2026-11-21" → "sábado, 21/11/2026" */
export function dataPorExtenso(iso: string): string {
    const [ano = 0, mes = 1, dia = 1] = iso.split('-').map(Number);
    return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

/** Primeiro dia em que a cliente pode retirar: hoje + a antecedência mínima. */
export function dataMinimaRetirada(hoje: Date, antecedenciaDias: number): Date {
    const data = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    data.setDate(data.getDate() + antecedenciaDias);
    return data;
}
