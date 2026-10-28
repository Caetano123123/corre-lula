import React from 'react';
import { Game } from './Game';
import './style.css';

export function App() {
    return <main className="page">
        <header className="page-head">
            <h1>Corre, Lula!</h1>
            <p className="tag">Jogo de paródia</p>
            <p>O Trump e a turma dele estão soltos pelo mapa atrás do Lula: vários Trumps, cidadãos de camisa do Brasil, policiais e até carro de polícia americano patrulhando. Corre em qualquer direção, desvia de todo mundo, foge do fantasma do PL e tenta chegar ao avião.</p>
        </header>
        <Game />
        <section className="page-section">
            <h2>Como jogar</h2>
            <dl>
                <dt>Mover</dt><dd>Arraste na tela (analógico virtual) ou use as setas/WASD.</dd>
                <dt>Corre sozinho</dt><dd>O Lula avança sozinho em direção ao avião e você só desvia.</dd>
                <dt>Objetivo</dt><dd>Cruzar o mapa até o avião antes de perder as 5 vidas. Cada estrela vale um voto e 25 pontos.</dd>
                <dt>Cuidado</dt><dd>Os perseguidores correm atrás quando te veem. Encostou em qualquer um, num carro, numa barreira ou no fantasma do PL: perde uma vida.</dd>
            </dl>
        </section>
        <section className="page-section">
            <h2>Origem do recorte de áudio</h2>
            <p><a href="https://www.agencialupa.org/noticias/2025/12/17/frase-de-lula-sobre-enganar-o-povo-e-tirada-de-contexto-em-publicacao-viral/">Contexto da entrevista ao El País de 2020</a></p>
        </section>
        <footer><p>Paródia fictícia, feita só pra zoar com os amigos. Nada aqui aconteceu de verdade e o jogo não tem lado político.</p></footer>
    </main>;
}
