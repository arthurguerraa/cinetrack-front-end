// ========================================
// src/js/pages/perfil.js
// Lógica da página de perfil do usuário.
// Depende de api.js, auth.js e main.js já carregados antes deste arquivo.
// A proteção de rota já rodou no <head> do perfil.html.
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  const avatarIniciais = document.getElementById('avatar-iniciais');
  const avatarFoto = document.getElementById('avatar-foto');
  const perfilNome = document.getElementById('perfil-nome');
  const perfilEmail = document.getElementById('perfil-email');
  const contadorAvaliacoes = document.getElementById('contador-avaliacoes');

  // foto de perfil
  const btnAlterarFoto = document.getElementById('btn-alterar-foto');
  const btnRemoverFoto = document.getElementById('btn-remover-foto');
  const inputFoto = document.getElementById('input-foto');
  const fotoErro = document.getElementById('foto-erro');

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

  const LADO_FOTO = 256; // px (a foto é recortada em quadrado e redimensionada)
  const TAMANHO_MAXIMO_ARQUIVO = 10 * 1024 * 1024; // 10 MB

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
  // Foto de perfil
  // ----------------------------------------

  /** Mostra a foto (ou as iniciais) no cartão e atualiza o header. */
  function atualizarAvatar(foto) {
    if (foto) {
      avatarFoto.src = foto;
      avatarFoto.classList.remove('hidden');
      avatarIniciais.classList.add('hidden');
      btnRemoverFoto.classList.remove('hidden');
    } else {
      avatarFoto.removeAttribute('src');
      avatarFoto.classList.add('hidden');
      avatarIniciais.classList.remove('hidden');
      btnRemoverFoto.classList.add('hidden');
    }
    aplicarFotoNoHeader(foto);
  }

  function definirFotoCarregando(carregando) {
    btnAlterarFoto.disabled = carregando;
    btnRemoverFoto.disabled = carregando;
    btnAlterarFoto.textContent = carregando ? 'Enviando...' : 'Alterar foto';
  }

  /**
   * Recorta a imagem em quadrado (centralizada), redimensiona para
   * LADO_FOTO x LADO_FOTO e devolve um data URL JPEG (~20-40 KB).
   */
  function redimensionarImagem(arquivo) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(arquivo);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);

        const largura = img.naturalWidth;
        const altura = img.naturalHeight;
        const menorLado = Math.min(largura, altura);
        const origemX = (largura - menorLado) / 2;
        const origemY = (altura - menorLado) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = LADO_FOTO;
        canvas.height = LADO_FOTO;

        const ctx = canvas.getContext('2d');
        // fundo da cor do tema, para PNGs com transparência não ficarem pretos no JPEG
        ctx.fillStyle = '#1C1C1C';
        ctx.fillRect(0, 0, LADO_FOTO, LADO_FOTO);
        ctx.drawImage(img, origemX, origemY, menorLado, menorLado, 0, 0, LADO_FOTO, LADO_FOTO);

        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Não foi possível ler essa imagem. Tente outro arquivo (JPEG, PNG ou WebP).'));
      };

      img.src = url;
    });
  }

  btnAlterarFoto.addEventListener('click', () => inputFoto.click());

  inputFoto.addEventListener('change', async () => {
    const arquivo = inputFoto.files[0];
    inputFoto.value = ''; // permite escolher o mesmo arquivo de novo depois
    if (!arquivo) return;

    limparErro(fotoErro);

    if (!arquivo.type.startsWith('image/')) {
      exibirErro(fotoErro, 'Escolha um arquivo de imagem.');
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO) {
      exibirErro(fotoErro, 'A imagem é grande demais (máximo de 10 MB).');
      return;
    }

    definirFotoCarregando(true);

    try {
      const fotoRedimensionada = await redimensionarImagem(arquivo);
      await UsuariosAPI.atualizarFoto(fotoRedimensionada);
      Auth.salvarFoto(fotoRedimensionada);
      atualizarAvatar(fotoRedimensionada);
    } catch (err) {
      exibirErro(fotoErro, err.message);
    } finally {
      definirFotoCarregando(false);
    }
  });

  btnRemoverFoto.addEventListener('click', async () => {
    limparErro(fotoErro);
    definirFotoCarregando(true);

    try {
      await UsuariosAPI.removerFoto();
      Auth.salvarFoto('');
      atualizarAvatar(null);
    } catch (err) {
      exibirErro(fotoErro, err.message);
    } finally {
      definirFotoCarregando(false);
    }
  });

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

  // mostra a foto em cache na hora e confirma com o servidor em seguida
  // (cobre o caso de a foto ter sido trocada em outro dispositivo)
  atualizarAvatar(Auth.fotoAtual());
  Auth.sincronizarFoto().then(() => atualizarAvatar(Auth.fotoAtual()));

  carregarAvaliacoes();
});