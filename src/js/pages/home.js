// ========================================
// src/js/pages/home.js
// Lógica da home/busca de filmes.
// Depende de api.js, auth.js e main.js já carregados antes deste arquivo.
//
// A tela tem 3 modos possíveis, sempre consultando o TMDB direto
// (nunca a tabela local acumulada):
//   - 'populares' — estado padrão, sem busca nem filtro
//   - 'genero'    — um gênero selecionado, sem busca
//   - 'busca'     — termo digitado na busca
//
// O estado atual (modo + termo/gênero + página) fica sincronizado com a
// URL (?q=...&genero=...&page=...), para sobreviver a um F5 e permitir
// compartilhar o link de uma busca específica.
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  const formBusca = document.getElementById('form-busca');
  const campoBusca = document.getElementById('campo-busca');
  const btnBuscar = document.getElementById('btn-buscar');
  const filtroGeneros = document.getElementById('filtro-generos');

  const gridFilmes = document.getElementById('grid-filmes');
  const estadoCarregando = document.getElementById('estado-carregando');
  const estadoVazio = document.getElementById('estado-vazio');
  const estadoErro = document.getElementById('estado-erro');

  const templateCard = document.getElementById('template-card-filme');
  const templateOpcaoLista = document.getElementById('template-opcao-lista');

  // paginação
  const paginacao = document.getElementById('paginacao');
  const paginacaoInfo = document.getElementById('paginacao-info');
  const btnPaginaAnterior = document.getElementById('btn-pagina-anterior');
  const btnProximaPagina = document.getElementById('btn-proxima-pagina');

  // modal de avaliação
  const modal = document.getElementById('modal-avaliar');
  const modalFechar = document.getElementById('modal-fechar');
  const modalTituloFilme = document.getElementById('modal-titulo-filme');
  const modalIdFilme = document.getElementById('modal-id-filme');
  const formAvaliar = document.getElementById('form-avaliar');
  const modalNota = document.getElementById('modal-nota');
  const modalComentario = document.getElementById('modal-comentario');
  const modalErro = document.getElementById('modal-erro');
  const modalBtnSalvar = document.getElementById('modal-btn-salvar');

  // modal de adicionar à lista
  const modalListas = document.getElementById('modal-listas');
  const modalListasFechar = document.getElementById('modal-listas-fechar');
  const modalListasTituloFilme = document.getElementById('modal-listas-titulo-filme');
  const modalListasCarregando = document.getElementById('modal-listas-carregando');
  const modalListasVazio = document.getElementById('modal-listas-vazio');
  const modalListasErro = document.getElementById('modal-listas-erro');
  const modalListasSucesso = document.getElementById('modal-listas-sucesso');
  const modalListasOpcoes = document.getElementById('modal-listas-opcoes');

  // ----------------------------------------
  // Estado atual da tela
  // ----------------------------------------
  let modoAtual = 'populares'; // 'populares' | 'genero' | 'busca'
  let generoSelecionado = null;
  let termoBusca = null;
  let paginaAtual = 1;

  // ----------------------------------------
  // Sincronização com a URL
  // ----------------------------------------
  function lerEstadoDaURL() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const genero = params.get('genero');
    const page = parseInt(params.get('page')) || 1;

    if (q) {
      modoAtual = 'busca';
      termoBusca = q;
      generoSelecionado = null;
    } else if (genero) {
      modoAtual = 'genero';
      generoSelecionado = genero;
      termoBusca = null;
    } else {
      modoAtual = 'populares';
      generoSelecionado = null;
      termoBusca = null;
    }

    paginaAtual = page;
  }

  function atualizarURL({ push = true } = {}) {
    const params = new URLSearchParams();
    if (modoAtual === 'busca' && termoBusca) params.set('q', termoBusca);
    if (modoAtual === 'genero' && generoSelecionado) params.set('genero', generoSelecionado);
    if (paginaAtual > 1) params.set('page', paginaAtual);

    const query = params.toString();
    const novaURL = query ? `${window.location.pathname}?${query}` : window.location.pathname;

    if (push) {
      window.history.pushState({}, '', novaURL);
    } else {
      window.history.replaceState({}, '', novaURL);
    }
  }

  // volta/avança do navegador — relê o estado da URL e recarrega
  window.addEventListener('popstate', () => {
    lerEstadoDaURL();
    campoBusca.value = termoBusca || '';
    atualizarPillsGenero();
    carregarConformeModo({ atualizarUrlComPush: false });
  });

  // ----------------------------------------
  // Estados de exibição do grid principal
  // ----------------------------------------
  function limparEstados() {
    gridFilmes.innerHTML = '';
    estadoCarregando.classList.add('hidden');
    estadoVazio.classList.add('hidden');
    estadoErro.classList.add('hidden');
    esconderPaginacao();
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

  // ----------------------------------------
  // Paginação
  // ----------------------------------------
  function esconderPaginacao() {
    paginacao.classList.add('hidden');
    paginacao.classList.remove('flex');
  }

  function atualizarPaginacao(pagination) {
    if (!pagination || pagination.totalPages <= 1) {
      esconderPaginacao();
      return;
    }

    paginacao.classList.remove('hidden');
    paginacao.classList.add('flex');
    paginacaoInfo.textContent = `Página ${pagination.page} de ${pagination.totalPages}`;
    btnPaginaAnterior.disabled = !pagination.hasPrev;
    btnProximaPagina.disabled = !pagination.hasNext;
  }

  function irParaTopoDoGrid() {
    gridFilmes.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  btnPaginaAnterior.addEventListener('click', () => {
    if (paginaAtual <= 1) return;
    paginaAtual -= 1;
    carregarConformeModo();
    irParaTopoDoGrid();
  });

  btnProximaPagina.addEventListener('click', () => {
    paginaAtual += 1;
    carregarConformeModo();
    irParaTopoDoGrid();
  });

  // ----------------------------------------
  // Renderização do grid
  // ----------------------------------------
  function renderizarFilmes(filmes) {
    limparEstados();

    if (!filmes || filmes.length === 0) {
      mostrarVazio();
      return;
    }

    filmes.forEach((filme) => {
      const card = templateCard.content.cloneNode(true);

      const id = filme.id_filme;
      const titulo = filme.titulo;
      const poster = filme.poster;
      const ano = filme.ano;
      const nota = filme.nota;

      const posterEl = card.querySelector('.poster');
      if (poster) posterEl.style.backgroundImage = `url('${poster}')`;

      card.querySelector('.titulo').textContent = titulo;
      card.querySelector('.nota').textContent = `★ ${formatarNota(nota)}`;
      card.querySelector('.ano').textContent = formatarAno(ano);

      card.querySelector('.btn-avaliar').addEventListener('click', () => abrirModalAvaliar(id, titulo));
      card.querySelector('.btn-add-lista').addEventListener('click', () => abrirModalListas(id, titulo));

      gridFilmes.appendChild(card);
    });
  }

  // ----------------------------------------
  // Carregamento central — decide qual API chamar conforme o modo atual
  // ----------------------------------------
  async function carregarConformeModo({ atualizarUrlComPush = true } = {}) {
    mostrarCarregando();
    atualizarURL({ push: atualizarUrlComPush });
    btnBuscar.disabled = true;

    try {
      let resposta;

      if (modoAtual === 'busca') {
        resposta = await FilmesAPI.buscar(termoBusca, paginaAtual);
      } else if (modoAtual === 'genero') {
        resposta = await FilmesAPI.porGenero(generoSelecionado, paginaAtual);
      } else {
        resposta = await FilmesAPI.populares(paginaAtual);
      }

      renderizarFilmes(resposta.data);
      atualizarPaginacao(resposta.pagination);
    } catch (err) {
      mostrarErro(err.message);
    } finally {
      btnBuscar.disabled = false;
    }
  }

  // ----------------------------------------
  // Busca por termo
  // ----------------------------------------
  formBusca.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const termo = campoBusca.value.trim();
    if (!termo) return;

    modoAtual = 'busca';
    termoBusca = termo;
    generoSelecionado = null;
    paginaAtual = 1;

    atualizarPillsGenero();
    carregarConformeModo();
  });

  // ----------------------------------------
  // Filtro de gêneros
  // ----------------------------------------
  function atualizarPillsGenero() {
    document.querySelectorAll('.pill-genero').forEach((pill) => {
      // dataset sempre vem como string — normaliza '' para null antes de comparar
      const valorPill = pill.dataset.genero || null;
      const ativo = modoAtual === 'genero' && valorPill === generoSelecionado;
      const ativoTodos = modoAtual !== 'genero' && valorPill === null;

      const estaAtivo = ativo || ativoTodos;

      pill.classList.toggle('bg-amber', estaAtivo);
      pill.classList.toggle('text-night', estaAtivo);
      pill.classList.toggle('border-amber', estaAtivo);
      pill.classList.toggle('bg-surface', !estaAtivo);
      pill.classList.toggle('text-muted', !estaAtivo);
      pill.classList.toggle('border-border', !estaAtivo);
    });
  }

  async function carregarGeneros() {
    try {
      const generos = await GenerosAPI.listar();

      const pillTodos = criarPillGenero('Todos', null);
      filtroGeneros.appendChild(pillTodos);

      generos.forEach((genero) => {
        const pill = criarPillGenero(genero.nm_genero, genero.nm_genero);
        filtroGeneros.appendChild(pill);
      });

      atualizarPillsGenero();
    } catch (err) {
      console.error('Não foi possível carregar os gêneros.', err);
    }
  }

  function criarPillGenero(rotulo, valor) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = rotulo;
    btn.dataset.genero = valor ?? '';
    btn.className = 'pill-genero text-xs font-medium rounded-card border px-3 py-1.5 transition-colors bg-surface text-muted border-border';

    btn.addEventListener('click', () => {
      campoBusca.value = '';
      termoBusca = null;
      paginaAtual = 1;

      if (valor) {
        modoAtual = 'genero';
        generoSelecionado = valor;
      } else {
        modoAtual = 'populares';
        generoSelecionado = null;
      }

      atualizarPillsGenero();
      carregarConformeModo();
    });

    return btn;
  }

  // ----------------------------------------
  // Modal de avaliação rápida
  // ----------------------------------------
  function abrirModalAvaliar(idFilme, titulo) {
    if (!Auth.estaLogado()) {
      window.location.href = './src/pages/login.html';
      return;
    }

    modalIdFilme.value = idFilme;
    modalTituloFilme.textContent = titulo;
    modalNota.value = '';
    modalComentario.value = '';
    limparErro(modalErro);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function fecharModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  modalFechar.addEventListener('click', fecharModal);
  modal.addEventListener('click', (evento) => {
    if (evento.target === modal) fecharModal();
  });

  formAvaliar.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparErro(modalErro);

    const idFilme = modalIdFilme.value;
    const nota = parseFloat(modalNota.value);
    const comentario = modalComentario.value.trim();

    if (!nota || nota < 1 || nota > 10) {
      exibirErro(modalErro, 'A nota deve ser entre 1 e 10.');
      return;
    }

    modalBtnSalvar.disabled = true;
    modalBtnSalvar.textContent = 'Salvando...';

    try {
      await AvaliacoesAPI.criar(idFilme, nota, comentario || null);
      fecharModal();
    } catch (err) {
      exibirErro(modalErro, err.message);
    } finally {
      modalBtnSalvar.disabled = false;
      modalBtnSalvar.textContent = 'Salvar avaliação';
    }
  });

  // ----------------------------------------
  // Modal de adicionar à lista
  // ----------------------------------------
  async function abrirModalListas(idFilme, titulo) {
    if (!Auth.estaLogado()) {
      window.location.href = './src/pages/login.html';
      return;
    }

    modalListasTituloFilme.textContent = titulo;
    modalListasOpcoes.innerHTML = '';
    modalListasVazio.classList.add('hidden');
    limparErro(modalListasErro);
    limparErro(modalListasSucesso);
    modalListasCarregando.classList.remove('hidden');

    modalListas.classList.remove('hidden');
    modalListas.classList.add('flex');

    try {
      const listas = await ListasAPI.listarMinhas();
      modalListasCarregando.classList.add('hidden');

      if (!listas || listas.length === 0) {
        modalListasVazio.classList.remove('hidden');
        return;
      }

      listas.forEach((lista) => {
        const opcao = templateOpcaoLista.content.cloneNode(true);
        opcao.querySelector('.nome').textContent = lista.nm_lista;
        opcao.querySelector('.opcao-lista').addEventListener('click', () =>
          adicionarFilmeNaLista(lista.id_lista, idFilme)
        );
        modalListasOpcoes.appendChild(opcao);
      });
    } catch (err) {
      modalListasCarregando.classList.add('hidden');
      exibirErro(modalListasErro, err.message);
    }
  }

  async function adicionarFilmeNaLista(idLista, idFilme) {
    limparErro(modalListasErro);
    limparErro(modalListasSucesso);

    try {
      await ListasAPI.adicionarFilme(idLista, idFilme);
      exibirErro(modalListasSucesso, 'Filme adicionado à lista!');
    } catch (err) {
      exibirErro(modalListasErro, err.message);
    }
  }

  function fecharModalListas() {
    modalListas.classList.add('hidden');
    modalListas.classList.remove('flex');
  }

  modalListasFechar.addEventListener('click', fecharModalListas);
  modalListas.addEventListener('click', (evento) => {
    if (evento.target === modalListas) fecharModalListas();
  });

  // ----------------------------------------
  // Inicialização da página
  // ----------------------------------------
  lerEstadoDaURL();
  campoBusca.value = termoBusca || '';

  carregarGeneros().then(atualizarPillsGenero);
  carregarConformeModo({ atualizarUrlComPush: false });
});