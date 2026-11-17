/** Regras das tortas: preço mínimo, tipo (tradicional/especial) e montagem do item. */
import type { Cardapio } from './cardapio';
import { centavos } from './dinheiro';
import type { ItemPedido } from './pedido';

type Tortas = Cardapio['tortas'];

export type TipoTorta = 'tradicional' | 'especial';

/** O que a cliente escolheu no montador de torta. */
export interface EscolhaTorta {
    tamanhoId: string | null;
    massa: string | null;
    recheios: readonly string[];
    acabamento: string | null;
    observacao: string;
}

/**
 * Menor preço tradicional entre os tamanhos com preço definido, em reais.
 * Tamanhos "a confirmar" (preço null) ficam de fora. Se nenhum tiver preço, devolve null.
 */
export function precoMinimoTortas(tortas: Tortas): number | null {
    const precos = tortas.tamanhos
        .map((tamanho) => tamanho.precoTradicional)
        .filter((preco): preco is number => preco !== null);

    return precos.length > 0 ? Math.min(...precos) : null;
}

/**
 * Tradicional ou especial?
 * - todos os recheios especiais → especial
 * - nenhum especial → tradicional
 * - misturado (1 de cada) → segue a regra do cardápio (regraPrecoMisto)
 */
export function tipoTorta(tortas: Tortas, recheios: readonly string[]): TipoTorta {
    const especiais = recheios.filter((r) => tortas.recheiosEspeciais.includes(r)).length;
    if (especiais === 0) return 'tradicional';
    if (especiais === recheios.length) return 'especial';
    return tortas.regraPrecoMisto;
}

/**
 * Preço da torta em centavos, com o acréscimo do acabamento.
 * `null` quando ainda não há tamanho escolhido ou quando o tamanho está "a confirmar".
 */
export function precoTortaCentavos(tortas: Tortas, escolha: EscolhaTorta): number | null {
    const tamanho = tortas.tamanhos.find((t) => t.id === escolha.tamanhoId);
    if (!tamanho) return null;

    const tipo = tipoTorta(tortas, escolha.recheios);
    const base = tipo === 'especial' ? tamanho.precoEspecial : tamanho.precoTradicional;
    if (base === null) return null;

    const acabamento = tortas.acabamentos.find((a) => a.nome === escolha.acabamento);
    return centavos(base) + centavos(acabamento?.acrescimo ?? 0);
}

/** O que ainda falta escolher: ["tamanho", "massa", "2 recheios", "acabamento"]. Vazio = pronto. */
export function pendenciasTorta(tortas: Tortas, escolha: EscolhaTorta): string[] {
    const falta: string[] = [];
    if (!escolha.tamanhoId) falta.push('tamanho');
    if (!escolha.massa) falta.push('massa');

    const restam = tortas.quantidadeRecheios - escolha.recheios.length;
    if (restam > 0) falta.push(restam === 1 ? '1 recheio' : `${restam} recheios`);

    if (!escolha.acabamento) falta.push('acabamento');
    return falta;
}

/** Monta o item do pedido. Só deve ser chamado quando não há pendências. */
export function montarItemTorta(tortas: Tortas, escolha: EscolhaTorta, id: string): ItemPedido {
    const falta = pendenciasTorta(tortas, escolha);
    const tamanho = tortas.tamanhos.find((t) => t.id === escolha.tamanhoId);
    if (falta.length > 0 || !tamanho) {
        throw new Error(`Falta escolher: ${falta.join(', ')}`);
    }

    const detalhes = [
        /confirmar/i.test(tamanho.rendimento)
            ? 'Rendimento a confirmar'
            : `Serve: ${tamanho.rendimento}`,
        `Massa: ${escolha.massa ?? ''}`,
        `Recheios: ${escolha.recheios.join(' e ')}`,
        `Acabamento: ${escolha.acabamento ?? ''}`,
    ];
    const observacao = escolha.observacao.trim();
    if (observacao) detalhes.push(`Obs.: ${observacao}`);

    return {
        id,
        titulo: `Torta ${tamanho.nome} · ${tipoTorta(tortas, escolha.recheios)}`,
        detalhes,
        valorCentavos: precoTortaCentavos(tortas, escolha),
    };
}
