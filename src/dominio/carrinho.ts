/**
 * O pedido em montagem (carrinho).
 *
 * Guarda os itens, avisa quem estiver ouvindo quando algo muda e salva no navegador,
 * para o pedido não se perder se a cliente fechar a aba.
 * O lugar onde salva é recebido de fora (Armazenamento), e por isso dá para testar sem navegador.
 */
import { z } from 'zod';
import { ItemPedidoSchema, type ItemPedido } from './pedido';

/** O mínimo que o carrinho precisa para guardar dados (o localStorage do navegador cumpre isso). */
export interface Armazenamento {
    getItem(chave: string): string | null;
    setItem(chave: string, valor: string): void;
}

type Ouvinte = (itens: readonly ItemPedido[]) => void;

const ListaDeItensSchema = z.array(ItemPedidoSchema);

export class Carrinho {
    private itens: ItemPedido[];
    private readonly ouvintes = new Set<Ouvinte>();
    private readonly armazenamento: Armazenamento;
    private readonly chave: string;

    constructor(armazenamento: Armazenamento, chave = 'docelice:carrinho') {
        this.armazenamento = armazenamento;
        this.chave = chave;
        this.itens = this.carregar();
    }

    /** Os itens atuais (somente leitura). */
    lista(): readonly ItemPedido[] {
        return this.itens;
    }

    quantidade(): number {
        return this.itens.length;
    }

    adicionar(item: ItemPedido): void {
        this.itens = [...this.itens, item];
        this.mudou();
    }

    remover(id: string): void {
        this.itens = this.itens.filter((item) => item.id !== id);
        this.mudou();
    }

    esvaziar(): void {
        this.itens = [];
        this.mudou();
    }

    /** Registra uma função chamada a cada mudança. Devolve outra função que cancela o registro. */
    quandoMudar(ouvinte: Ouvinte): () => void {
        this.ouvintes.add(ouvinte);
        return () => this.ouvintes.delete(ouvinte);
    }

    private mudou(): void {
        this.salvar();
        for (const ouvinte of this.ouvintes) ouvinte(this.itens);
    }

    private carregar(): ItemPedido[] {
        try {
            const texto = this.armazenamento.getItem(this.chave);
            if (!texto) return [];
            const resultado = ListaDeItensSchema.safeParse(JSON.parse(texto));
            return resultado.success ? resultado.data : [];
        } catch {
            return []; // navegador bloqueou o armazenamento ou o dado estava corrompido
        }
    }

    private salvar(): void {
        try {
            this.armazenamento.setItem(this.chave, JSON.stringify(this.itens));
        } catch {
            // modo privado / armazenamento cheio: o pedido segue funcionando, só não fica salvo
        }
    }
}
