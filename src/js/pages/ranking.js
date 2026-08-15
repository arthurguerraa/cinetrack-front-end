// ========================================
// src/js/pages/ranking.js
// Lógica da página de ranking.
// Depende de api.js, auth.js e main.js já carregados antes deste arquivo.
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  const listaRanking = document.getElementById('lista-ranking');
  const seletorLimite = document.getElementById('seletor-limite');

  const estadoCarregando = document.getElementById('estado-carregando');
  const estadoVazio = document.getElementById('estado-vazio');
  const estadoErro = document.getElementById('estado-erro');

  const templateItem = document.getElementById('template-item-ranking');

  function limparEstados() {
    listaRanking.innerHTML = '';
    estadoCarregando.classList.add('hidden');
    estadoVazio.classList.add('hidden');
    estadoErro.classList.add('hidden');
  }

  function mostrarCarregando() {
    limparEstados();
    estadoCarregando.classList.remove('hidden');
  }

  function mostrarErro(mensagem) {
    limparEstados();
    estadoErro.textContent = mensagem;
    estadoErro.classList.remove('hidden');
  }

  function mostrarVazio() {
    limparEstados();
    estadoVazio.classList.remove('hidden');
  }

  function renderizarRanking(filmes) {
    limparEstados();

    if (!filmes || filmes.length === 0) {
      mostrarVazio();
      return;
    }

    filmes.forEach((filme, index) => {
      const posicao = index + 1;
      const item = templateItem.content.cloneNode(true);

      const li = item.querySelector('.item-ranking');
      const posicaoEl = item.querySelector('.posicao');
      const posterEl = item.querySelector('.poster');

      // formata a posição como timecode: #01, #02, #03...
      posicaoEl.textContent = `#${String(posicao).padStart(2, '0')}`;

      // destaque visual pro pódio (top 3) — borda âmbar e posição em destaque
      if (posicao <= 3) {
        li.classList.add('border-amber');
        posicaoEl.classList.remove('text-muted');
        posicaoEl.classList.add('text-amber');
      }

      if (filme.ds_poster) {
        posterEl.style.backgroundImage = `url('${filme.ds_poster}')`;
      }

      item.querySelector('.titulo').textContent = filme.nm_filme;
      item.querySelector('.ano').textContent = formatarAno(filme.dt_lancamento);
      item.querySelector('.nota').textContent = `★ ${formatarNota(filme.nota_media_usuarios)}`;

      const totalAvaliacoes = filme.total_avaliacoes;
      item.querySelector('.total-avaliacoes').textContent =
        `${totalAvaliacoes} ${totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'}`;

      listaRanking.appendChild(item);
    });
  }

  async function carregarRanking() {
    mostrarCarregando();
    const limite = seletorLimite.value;

    try {
      const ranking = await RankingAPI.ver(limite);
      renderizarRanking(ranking);
    } catch (err) {
      mostrarErro(err.message);
    }
  }

  seletorLimite.addEventListener('change', carregarRanking);

  carregarRanking();
});