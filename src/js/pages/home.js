// ========================================
// src/js/pages/home.js
// Lógica da home/busca de filmes.
// Depende de api.js, auth.js e main.js já carregados antes deste arquivo.
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

  let generoSelecionado = null;

  // ----------------------------------------
  // Estados de exibição do grid principal
  // ----------------------------------------
  function limparEstados() {
    gridFilmes.innerHTML = '';
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
      const titulo = filme.nm_filme || filme.titulo;
      const poster = filme.ds_poster || filme.poster;
      const ano = filme.dt_lancamento || filme.ano;
      const nota = filme.nr_nota_media ?? filme.nota;

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
  // Carregamento inicial (filmes já salvos no banco)
  // ----------------------------------------
  async function carregarFilmesSalvos(genero = null) {
    mostrarCarregando();
    try {
      const filmes = await FilmesAPI.listar(genero);
      renderizarFilmes(filmes);
    } catch (err) {
      mostrarErro(err.message);
    }
  }

  // ----------------------------------------
  // Busca por termo (consulta o TMDB via backend)
  // ----------------------------------------
  async function buscarFilmes(termo) {
    mostrarCarregando();
    btnBuscar.disabled = true;

    try {
      const filmes = await FilmesAPI.buscar(termo);
      renderizarFilmes(filmes);
    } catch (err) {
      mostrarErro(err.message);
    } finally {
      btnBuscar.disabled = false;
    }
  }

  formBusca.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const termo = campoBusca.value.trim();
    if (!termo) return;

    generoSelecionado = null;
    atualizarPillsGenero();
    buscarFilmes(termo);
  });

  // ----------------------------------------
  // Filtro de gêneros
  // ----------------------------------------
  function atualizarPillsGenero() {
    document.querySelectorAll('.pill-genero').forEach((pill) => {
      const ativo = pill.dataset.genero === generoSelecionado;
      pill.classList.toggle('bg-amber', ativo);
      pill.classList.toggle('text-night', ativo);
      pill.classList.toggle('border-amber', ativo);
      pill.classList.toggle('bg-surface', !ativo);
      pill.classList.toggle('text-muted', !ativo);
      pill.classList.toggle('border-border', !ativo);
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
      generoSelecionado = valor;
      campoBusca.value = '';
      atualizarPillsGenero();
      carregarFilmesSalvos(valor);
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
  carregarGeneros();
  carregarFilmesSalvos();
});