// ========================================
// src/js/pages/listas.js
// Lógica da página de listas do usuário.
// Depende de api.js, auth.js e main.js já carregados antes deste arquivo.
// A proteção de rota (Auth.protegerPagina) já rodou no <head> do listas.html.
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  const gridListas = document.getElementById('grid-listas');
  const estadoCarregando = document.getElementById('estado-carregando');
  const estadoVazio = document.getElementById('estado-vazio');
  const estadoErro = document.getElementById('estado-erro');

  const templateCardLista = document.getElementById('template-card-lista');
  const templateFilmeLista = document.getElementById('template-filme-lista');

  const btnNovaLista = document.getElementById('btn-nova-lista');

  // modal criar/editar
  const modalLista = document.getElementById('modal-lista');
  const modalListaTitulo = document.getElementById('modal-lista-titulo');
  const modalListaFechar = document.getElementById('modal-lista-fechar');
  const formLista = document.getElementById('form-lista');
  const listaId = document.getElementById('lista-id');
  const listaNome = document.getElementById('lista-nome');
  const listaDescricao = document.getElementById('lista-descricao');
  const listaVisibilidade = document.getElementById('lista-visibilidade');
  const modalListaErro = document.getElementById('modal-lista-erro');
  const modalListaBtnSalvar = document.getElementById('modal-lista-btn-salvar');

  // modal ver filmes
  const modalFilmes = document.getElementById('modal-filmes');
  const modalFilmesTitulo = document.getElementById('modal-filmes-titulo');
  const modalFilmesFechar = document.getElementById('modal-filmes-fechar');
  const modalFilmesLista = document.getElementById('modal-filmes-lista');
  const modalFilmesVazio = document.getElementById('modal-filmes-vazio');

  // modal confirmar exclusão
  const modalConfirmar = document.getElementById('modal-confirmar');
  const modalConfirmarCancelar = document.getElementById('modal-confirmar-cancelar');
  const modalConfirmarExcluir = document.getElementById('modal-confirmar-excluir');

  let idParaExcluir = null;

  // ----------------------------------------
  // Estados de exibição
  // ----------------------------------------
  function limparEstados() {
    gridListas.innerHTML = '';
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
  // Carregar e renderizar listas
  // ----------------------------------------
  async function carregarListas() {
    mostrarCarregando();
    try {
      const listas = await ListasAPI.listarMinhas();
      renderizarListas(listas);
    } catch (err) {
      mostrarErro(err.message);
    }
  }

  function renderizarListas(listas) {
    limparEstados();

    if (!listas || listas.length === 0) {
      mostrarVazio();
      return;
    }

    listas.forEach((lista) => {
      const card = templateCardLista.content.cloneNode(true);

      card.querySelector('.titulo').textContent = lista.nm_lista;
      card.querySelector('.descricao').textContent = lista.ds_lista || 'Sem descrição.';

      const badge = card.querySelector('.badge-visibilidade');
      const publica = Boolean(lista.is_visibilidade);
      badge.textContent = publica ? 'Pública' : 'Privada';
      badge.classList.add(
        ...(publica ? ['bg-amber/10', 'text-amber'] : ['bg-border', 'text-muted'])
      );

      card.querySelector('.btn-ver').addEventListener('click', () => abrirModalFilmes(lista));
      card.querySelector('.btn-editar').addEventListener('click', () => abrirModalLista(lista));
      card.querySelector('.btn-deletar').addEventListener('click', () => abrirConfirmacao(lista.id_lista));

      gridListas.appendChild(card);
    });
  }

  // ----------------------------------------
  // Modal criar / editar
  // ----------------------------------------
  function abrirModalLista(lista = null) {
    limparErro(modalListaErro);

    if (lista) {
      modalListaTitulo.textContent = 'Editar lista';
      listaId.value = lista.id_lista;
      listaNome.value = lista.nm_lista;
      listaDescricao.value = lista.ds_lista || '';
      listaVisibilidade.checked = Boolean(lista.is_visibilidade);
    } else {
      modalListaTitulo.textContent = 'Nova lista';
      formLista.reset();
      listaId.value = '';
      listaVisibilidade.checked = true;
    }

    modalLista.classList.remove('hidden');
    modalLista.classList.add('flex');
  }

  function fecharModalLista() {
    modalLista.classList.add('hidden');
    modalLista.classList.remove('flex');
  }

  btnNovaLista.addEventListener('click', () => abrirModalLista());
  modalListaFechar.addEventListener('click', fecharModalLista);
  modalLista.addEventListener('click', (evento) => {
    if (evento.target === modalLista) fecharModalLista();
  });

  formLista.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparErro(modalListaErro);

    const nome = listaNome.value.trim();
    const descricao = listaDescricao.value.trim();
    const visibilidade = listaVisibilidade.checked;
    const id = listaId.value;

    if (!nome) {
      exibirErro(modalListaErro, 'Digite um nome para a lista.');
      return;
    }

    modalListaBtnSalvar.disabled = true;
    modalListaBtnSalvar.textContent = 'Salvando...';

    try {
      if (id) {
        await ListasAPI.editar(id, nome, descricao || null, visibilidade);
      } else {
        await ListasAPI.criar(nome, descricao || null, visibilidade);
      }
      fecharModalLista();
      carregarListas();
    } catch (err) {
      exibirErro(modalListaErro, err.message);
    } finally {
      modalListaBtnSalvar.disabled = false;
      modalListaBtnSalvar.textContent = 'Salvar';
    }
  });

  // ----------------------------------------
  // Modal ver filmes
  // ----------------------------------------
  async function abrirModalFilmes(lista) {
    modalFilmesTitulo.textContent = lista.nm_lista;
    modalFilmesLista.innerHTML = '';
    modalFilmesVazio.classList.add('hidden');
    modalFilmes.classList.remove('hidden');
    modalFilmes.classList.add('flex');

    try {
      const resultado = await ListasAPI.verFilmes(lista.id_lista);
      const filmes = resultado.filmes || [];

      if (filmes.length === 0) {
        modalFilmesVazio.classList.remove('hidden');
        return;
      }

      filmes.forEach((filme) => {
        const item = templateFilmeLista.content.cloneNode(true);

        const posterEl = item.querySelector('.poster');
        if (filme.ds_poster) posterEl.style.backgroundImage = `url('${filme.ds_poster}')`;

        item.querySelector('.titulo').textContent = filme.nm_filme;
        item.querySelector('.ano').textContent = formatarAno(filme.dt_lancamento);

        modalFilmesLista.appendChild(item);
      });
    } catch (err) {
      modalFilmesLista.innerHTML = `<p class="text-red-400 text-sm text-center py-6">${err.message}</p>`;
    }
  }

  function fecharModalFilmes() {
    modalFilmes.classList.add('hidden');
    modalFilmes.classList.remove('flex');
  }

  modalFilmesFechar.addEventListener('click', fecharModalFilmes);
  modalFilmes.addEventListener('click', (evento) => {
    if (evento.target === modalFilmes) fecharModalFilmes();
  });

  // ----------------------------------------
  // Modal confirmar exclusão
  // ----------------------------------------
  function abrirConfirmacao(id) {
    idParaExcluir = id;
    modalConfirmar.classList.remove('hidden');
    modalConfirmar.classList.add('flex');
  }

  function fecharConfirmacao() {
    idParaExcluir = null;
    modalConfirmar.classList.add('hidden');
    modalConfirmar.classList.remove('flex');
  }

  modalConfirmarCancelar.addEventListener('click', fecharConfirmacao);

  modalConfirmarExcluir.addEventListener('click', async () => {
    if (!idParaExcluir) return;

    modalConfirmarExcluir.disabled = true;
    modalConfirmarExcluir.textContent = 'Excluindo...';

    try {
      await ListasAPI.deletar(idParaExcluir);
      fecharConfirmacao();
      carregarListas();
    } catch (err) {
      fecharConfirmacao();
      mostrarErro(err.message);
    } finally {
      modalConfirmarExcluir.disabled = false;
      modalConfirmarExcluir.textContent = 'Excluir';
    }
  });

  // ----------------------------------------
  // Inicialização
  // ----------------------------------------
  carregarListas();
});