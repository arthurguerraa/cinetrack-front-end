// ========================================
// src/js/pages/perfil.js
// Lógica da página de perfil do usuário.
// Depende de api.js, auth.js e main.js já carregados antes deste arquivo.
// A proteção de rota já rodou no <head> do perfil.html.
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  const avatarIniciais = document.getElementById('avatar-iniciais');
  const perfilNome = document.getElementById('perfil-nome');
  const perfilEmail = document.getElementById('perfil-email');
  const contadorAvaliacoes = document.getElementById('contador-avaliacoes');

  const listaAvaliacoes = document.getElementById('lista-avaliacoes');
  const estadoCarregando = document.getElementById('estado-carregando');
  const estadoVazio = document.getElementById('estado-vazio');
  const estadoErro = document.getElementById('estado-erro');

  const templateAvaliacao = document.getElementById('template-avaliacao');

  // modal editar
  const modalEditar = document.getElementById('modal-editar');
  const modalFechar = document.getElementById('modal-fechar');
  const modalTituloFilme = document.getElementById('modal-titulo-filme');
  const formEditar = document.getElementById('form-editar');
  const modalIdAvaliacao = document.getElementById('modal-id-avaliacao');
  const modalNota = document.getElementById('modal-nota');
  const modalComentario = document.getElementById('modal-comentario');
  const modalErro = document.getElementById('modal-erro');
  const modalBtnSalvar = document.getElementById('modal-btn-salvar');

  // modal confirmar exclusão
  const modalConfirmar = document.getElementById('modal-confirmar');
  const modalConfirmarCancelar = document.getElementById('modal-confirmar-cancelar');
  const modalConfirmarExcluir = document.getElementById('modal-confirmar-excluir');

  let idParaExcluir = null;

  // ----------------------------------------
  // Cartão de identificação
  // ----------------------------------------
  function montarCartaoUsuario() {
    const usuario = Auth.usuarioAtual();
    if (!usuario) return;

    perfilNome.textContent = usuario.nm_usuario;
    perfilEmail.textContent = usuario.ds_email || '';

    const iniciais = usuario.nm_usuario
      .split(' ')
      .slice(0, 2)
      .map((parte) => parte[0])
      .join('')
      .toUpperCase();

    avatarIniciais.textContent = iniciais;
  }

  // ----------------------------------------
  // Estados de exibição
  // ----------------------------------------
  function limparEstados() {
    listaAvaliacoes.innerHTML = '';
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
  // Carregar e renderizar avaliações
  // ----------------------------------------
  async function carregarAvaliacoes() {
    mostrarCarregando();
    try {
      const avaliacoes = await AvaliacoesAPI.listarMinhas();
      renderizarAvaliacoes(avaliacoes);
    } catch (err) {
      mostrarErro(err.message);
    }
  }

  function renderizarAvaliacoes(avaliacoes) {
    limparEstados();

    contadorAvaliacoes.textContent =
      `${avaliacoes.length} ${avaliacoes.length === 1 ? 'filme avaliado' : 'filmes avaliados'}`;

    if (!avaliacoes || avaliacoes.length === 0) {
      mostrarVazio();
      return;
    }

    avaliacoes.forEach((avaliacao) => {
      const item = templateAvaliacao.content.cloneNode(true);

      const posterEl = item.querySelector('.poster');
      if (avaliacao.ds_poster) posterEl.style.backgroundImage = `url('${avaliacao.ds_poster}')`;

      item.querySelector('.titulo').textContent = avaliacao.nm_filme;
      item.querySelector('.ano').textContent = formatarAno(avaliacao.dt_lancamento);
      item.querySelector('.nota').textContent = `★ ${formatarNota(avaliacao.nr_nota)}`;

      const comentarioEl = item.querySelector('.comentario');
      comentarioEl.textContent = avaliacao.ds_comentario || 'Sem comentário.';
      if (!avaliacao.ds_comentario) comentarioEl.classList.add('text-muted', 'italic');

      item.querySelector('.btn-editar').addEventListener('click', () => abrirModalEditar(avaliacao));
      item.querySelector('.btn-deletar').addEventListener('click', () => abrirConfirmacao(avaliacao.id_avaliacao));

      listaAvaliacoes.appendChild(item);
    });
  }

  // ----------------------------------------
  // Modal editar
  // ----------------------------------------
  function abrirModalEditar(avaliacao) {
    limparErro(modalErro);
    modalIdAvaliacao.value = avaliacao.id_avaliacao;
    modalTituloFilme.textContent = avaliacao.nm_filme;
    modalNota.value = avaliacao.nr_nota;
    modalComentario.value = avaliacao.ds_comentario || '';

    modalEditar.classList.remove('hidden');
    modalEditar.classList.add('flex');
  }

  function fecharModalEditar() {
    modalEditar.classList.add('hidden');
    modalEditar.classList.remove('flex');
  }

  modalFechar.addEventListener('click', fecharModalEditar);
  modalEditar.addEventListener('click', (evento) => {
    if (evento.target === modalEditar) fecharModalEditar();
  });

  formEditar.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparErro(modalErro);

    const id = modalIdAvaliacao.value;
    const nota = parseFloat(modalNota.value);
    const comentario = modalComentario.value.trim();

    if (!nota || nota < 1 || nota > 10) {
      exibirErro(modalErro, 'A nota deve ser entre 1 e 10.');
      return;
    }

    modalBtnSalvar.disabled = true;
    modalBtnSalvar.textContent = 'Salvando...';

    try {
      await AvaliacoesAPI.editar(id, nota, comentario || null);
      fecharModalEditar();
      carregarAvaliacoes();
    } catch (err) {
      exibirErro(modalErro, err.message);
    } finally {
      modalBtnSalvar.disabled = false;
      modalBtnSalvar.textContent = 'Salvar alterações';
    }
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
      await AvaliacoesAPI.deletar(idParaExcluir);
      fecharConfirmacao();
      carregarAvaliacoes();
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
  montarCartaoUsuario();
  carregarAvaliacoes();
});