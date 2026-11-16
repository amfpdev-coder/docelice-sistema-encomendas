/**
 * Contrato de dados do cardápio.
 *
 * O Zod valida o cardapio.json quando o site carrega. Se alguém digitar um preço
 * errado ou esquecer um campo, aparece um erro claro em vez de a página quebrar.
 * Os tipos do TypeScript saem destes esquemas (z.infer), então nunca ficam desatualizados.
 */
import { z } from 'zod';

const textoObrigatorio = z.string().trim().min(1, 'não pode ficar vazio');
const hora = z.string().regex(/^\d{2}:\d{2}$/, 'use o formato HH:MM, ex.: 08:00');
const precoEmReais = z.number().positive('o preço precisa ser maior que zero');

const LojaSchema = z.object({
    nome: textoObrigatorio,
    whatsapp: z.string().regex(/^\d{12,13}$/, 'só números, com 55 + DDD, ex.: 5583999999999'),
    telefoneExibicao: textoObrigatorio,
    instagram: textoObrigatorio,
    sinalPercentual: z.number().min(0).max(100),
    antecedenciaMinimaDias: z.number().int().min(0),
    horarioRetirada: z.object({ inicio: hora, fim: hora }),
});

const CorForminhaSchema = z.object({
    nome: textoObrigatorio,
    hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'cor no formato #RRGGBB'),
});

const CategoriaDocinhoSchema = z.object({
    id: textoObrigatorio,
    nome: textoObrigatorio,
    descricao: z.string(),
    preco: precoEmReais,
    imagem: z.string().nullable(),
    sugestaoObservacao: z.string().optional(),
    sabores: z.array(textoObrigatorio).min(1),
});

const DocinhosSchema = z
    .object({
        peso: textoObrigatorio,
        minimoTotal: z.number().int().positive(),
        passo: z.number().int().positive(),
        maxCoresForminha: z.number().int().positive(),
        coresForminha: z.array(CorForminhaSchema).min(1),
        categorias: z.array(CategoriaDocinhoSchema).min(1),
    })
    .refine((d) => d.minimoTotal % d.passo === 0, {
        message: 'o mínimo precisa ser múltiplo do passo (ex.: mínimo 50, passo 25)',
        path: ['minimoTotal'],
    });

const TamanhoTortaSchema = z.object({
    id: textoObrigatorio,
    nome: textoObrigatorio,
    rendimento: textoObrigatorio,
    /** null = preço "a confirmar" */
    precoTradicional: precoEmReais.nullable(),
    precoEspecial: precoEmReais.nullable(),
});

const TortasSchema = z.object({
    nome: textoObrigatorio,
    descricao: z.string(),
    imagem: z.string().nullable(),
    quantidadeRecheios: z.number().int().positive(),
    regraPrecoMisto: z.enum(['especial', 'tradicional']),
    tamanhos: z.array(TamanhoTortaSchema).min(1),
    massas: z.array(textoObrigatorio).min(1),
    recheiosTradicionais: z.array(textoObrigatorio),
    recheiosEspeciais: z.array(textoObrigatorio),
    acabamentos: z.array(z.object({ nome: textoObrigatorio, acrescimo: z.number().min(0) })).min(1),
});

const SlideVitrineSchema = z.object({
    aba: z.enum(['docinhos', 'tortas']),
    imagem: z.string().nullable(),
    titulo: textoObrigatorio,
    legenda: z.string(),
});

const InfoSchema = z.object({ titulo: textoObrigatorio, texto: textoObrigatorio });

export const CardapioSchema = z.object({
    loja: LojaSchema,
    docinhos: DocinhosSchema,
    tortas: TortasSchema,
    vitrine: z.array(SlideVitrineSchema),
    infos: z.array(InfoSchema),
});

/** O cardápio completo, já validado. */
export type Cardapio = z.infer<typeof CardapioSchema>;
export type CategoriaDocinho = z.infer<typeof CategoriaDocinhoSchema>;
export type TamanhoTorta = z.infer<typeof TamanhoTortaSchema>;

/** Valida dados desconhecidos e devolve o cardápio tipado, ou lança um erro legível. */
export function validarCardapio(dados: unknown): Cardapio {
    const resultado = CardapioSchema.safeParse(dados);
    if (!resultado.success) {
        throw new Error('cardapio.json inválido:\n' + z.prettifyError(resultado.error));
    }
    return resultado.data;
}
