import './style.css';
import { carregarCardapio } from './servicos/carregar-cardapio';

const app = document.querySelector<HTMLDivElement>('#app')!;

try {
    const cardapio = await carregarCardapio();
    const totalSabores = cardapio.docinhos.categorias.reduce(
        (soma, categoria) => soma + categoria.sabores.length,
        0,
    );

    app.innerHTML = `
        <h1>${cardapio.loja.nome}</h1>
        <p>Cardápio carregado e validado ✓</p>
        <ul>
            <li>${cardapio.docinhos.categorias.length} categorias de docinhos, ${totalSabores} sabores</li>
            <li>${cardapio.tortas.tamanhos.length} tamanhos de torta</li>
            <li>${cardapio.infos.length} informações</li>
        </ul>
    `;
} catch (erro) {
    console.error(erro);
    app.innerHTML = '<p>Não foi possível carregar o cardápio. Recarregue a página.</p>';
}
