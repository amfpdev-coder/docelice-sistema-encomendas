/**
 * Ponto de entrada do cardápio: carrega os dados, desenha a página
 * e liga os montadores, o pedido e os efeitos.
 */
import './estilos/tokens.css';
import './estilos/base.css';
import './estilos/cardapio.css';
import './estilos/paineis.css';
import './estilos/efeitos.css';

import { ligarBarra } from './cardapio/barra';
import { elemento } from './cardapio/dom';
import {
    ativarInclinacao3D,
    ativarRevelar,
    mostrarVitrines,
    pintarCarrosseis,
    prepararAbertura,
} from './cardapio/efeitos';
import { ativarReservaDeImagens } from './cardapio/imagens';
import { configurarFechamento } from './cardapio/montador-comum';
import { abrirMontadorDocinho } from './cardapio/montador-docinho';
import { abrirMontadorTorta } from './cardapio/montador-torta';
import { configurarNavegacao } from './cardapio/navegacao';
import { mostrarDocinhos, mostrarInfos, mostrarLoja, mostrarTortas } from './cardapio/pagina';
import { abrirSacola } from './cardapio/sacola';
import { Carrinho } from './dominio/carrinho';
import { carregarCardapio } from './servicos/carregar-cardapio';
import { armazenamentoDoNavegador } from './servicos/navegador';

ativarReservaDeImagens();
prepararAbertura(pintarCarrosseis);
configurarNavegacao();

const montador = elemento<HTMLDialogElement>('#montador');
const sacola = elemento<HTMLDialogElement>('#carrinho');
configurarFechamento(montador);
configurarFechamento(sacola);

try {
    const cardapio = await carregarCardapio();
    const carrinho = new Carrinho(armazenamentoDoNavegador());

    mostrarLoja(cardapio);
    mostrarVitrines(cardapio);
    mostrarDocinhos(cardapio);
    mostrarTortas(cardapio);
    mostrarInfos(cardapio);
    ligarBarra(carrinho, cardapio);

    // Um único "ouvinte" na página: funciona para todos os botões, inclusive os criados depois
    document.addEventListener('click', (evento) => {
        const alvo = evento.target as HTMLElement;

        const produto = alvo.closest<HTMLElement>('[data-produto]')?.dataset.produto;
        if (produto === 'torta') abrirMontadorTorta(montador, cardapio, carrinho);
        else if (produto?.startsWith('docinho:')) {
            abrirMontadorDocinho(montador, cardapio, carrinho, produto.slice('docinho:'.length));
        }

        if (alvo.closest('#barra-carrinho')) abrirSacola(sacola, cardapio, carrinho);
    });

    ativarInclinacao3D();
    ativarRevelar();
} catch (erro) {
    console.error(erro);
    elemento('#lista-docinhos').innerHTML =
        '<p class="erro">Não foi possível carregar o cardápio. Recarregue a página.</p>';
}
