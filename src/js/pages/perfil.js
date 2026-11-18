// ========================================
// src/js/pages/perfil.js
// Lógica da página de perfil do usuário.
// Depende de api.js, auth.js e main.js já carregados antes deste arquivo.
// A proteção de rota já rodou no <head> do perfil.html.
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // cartão do usuário
  const avatarIniciais = document.getElementById('avatar-iniciais');
  const avatarFoto = document.getElementById('avatar-foto');
  const perfilNome = document.getElementById('perfil-nome');
  const perfilEmail = document.getElementById('perfil-email');
  const perfilMembroDesde = document.getElementById('perfil-membro-desde');

  // foto de perfil
  const btnAlterarFoto = document.getElementById('btn-alterar-foto');
  const btnRemoverFoto = document.getElementById('btn-remover-foto');
  const inputFoto = document.getElementById('input-foto');
  const fotoErro = document.getElementById('foto-erro');

  // bio
  const bioBloco = document.getElementById('bio-bloco');
  const bioVisualizacao = document.getElementById('bio-visualizacao');
  const perfilBio = document.getElementById('perfil-bio');
  const btnEditarBio = document.getElementById('btn-editar-bio');
  const formBio = document.getElementById('form-bio');
  const campoBio = document.getElementById('bio');
  const bioContador = document.getElementById('bio-contador');
  const erroBio = document.getElementById('erro-bio');
  const btnSalvarBio = document.getElementById('btn-salvar-bio');
  const btnCancelarBio = document.getElementById('btn-cancelar-bio');

  // resumo das listas
  const contadorListas = document.getElementById('contador-listas');
  const linkGerenciarListas = document.getElementById('link-gerenciar-listas');
  const listasEstadoCarregando = document.getElementById('listas-estado-carregando');
  const listasEstadoVazio = document.getElementById('listas-estado-vazio');
  const listasEstadoErro = document.getElementById('listas-estado-erro');
  const resumoListas = document.getElementById('resumo-listas');
  const listasVerTodas = document.getElementById('listas-ver-todas');
  const templateListaResumo = document.getElementById('template-lista-resumo');

  // histórico de avaliações
  const contadorAvaliacoes = document.getElementById('contador-avaliacoes');
  const controleOrdem = document.getElementById('controle-ordem');
  const seletorOrdem = document.getElementById('seletor-ordem');
  const listaAvaliacoes = document.getElementById('lista-avaliacoes');
  const estadoCarregando = document.getElementById('estado-carregando');
  const estadoVazio = document.getElementById('estado-vazio');
  const estadoErro = document.getElementById('estado-erro');
  const rodapeAvaliacoes = document.getElementById('rodape-avaliacoes');
  const textoProgresso = document.getElementById('texto-progresso');
  const erroCarregarMais = document.getElementById('erro-carregar-mais');
  const btnCarregarMais = document.getElementById('btn-carregar-mais');

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

  // ----------------------------------------
  // Constantes e estado
  // ----------------------------------------
  const LADO_FOTO = 256; // px (a foto é recortada em quadrado e redimensionada)
  const TAMANHO_MAXIMO_ARQUIVO = 10 * 1024 * 1024; // 10 MB
  const MAX_BIO = 160;

  const LIMITE_POR_PAGINA = 10; // avaliações por "Carregar mais"
  const LIMITE_MAXIMO = 100; // máximo aceito pelo backend em uma requisição
  const LISTAS_VISIVEIS = 4; // quantas listas aparecem no resumo

  let idParaExcluir = null;
  let bioAtual = '';

  let avaliacoes = []; // avaliações já carregadas na tela
  let totalAvaliacoes = 0; // total no servidor
  let temMais = false;
  let ordemAtual = 'recentes';
  let idRequisicao = 0; // descarta respostas antigas quando chega uma requisição mais nova
  let emAndamento = false;

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

  function formatarMembroDesde(data) {
    const d = new Date(data);
    if (!data || Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  /**
   * Busca no servidor os dados que não vêm no token: foto, bio e data de cadastro.
   * Se falhar, o cartão continua com nome, e-mail e a foto em cache, e o bloco da bio
   * fica escondido (para ninguém sobrescrever uma bio existente sem vê-la).
   */
  async function carregarDadosPerfil() {
    try {
      const dados = await UsuariosAPI.me();

      Auth.salvarFoto(dados.ds_foto);
      atualizarAvatar(dados.ds_foto);

      const membroDesde = formatarMembroDesde(dados.created_at);
      if (membroDesde) {
        perfilMembroDesde.textContent = `Membro desde ${membroDesde}`;
        perfilMembroDesde.classList.remove('hidden');
      }

      mostrarBio(dados.ds_bio);
      bioBloco.classList.remove('hidden');
    } catch (err) {
      // silencioso: o restante da página funciona normalmente
    }
  }

  // ----------------------------------------
  // Bio
  // ----------------------------------------
  function mostrarBio(bio) {
    bioAtual = bio || '';

    if (bioAtual) {
      perfilBio.textContent = bioAtual;
      perfilBio.classList.remove('text-muted', 'italic');
      btnEditarBio.textContent = 'Editar bio';
    } else {
      perfilBio.textContent = 'Você ainda não escreveu uma bio. Conte um pouco sobre o seu gosto por cinema.';
      perfilBio.classList.add('text-muted', 'italic');
      btnEditarBio.textContent = 'Adicionar bio';
    }
  }

  function atualizarContadorBio() {
    bioContador.textContent = `${campoBio.value.length}/${MAX_BIO}`;
  }

  function abrirEdicaoBio() {
    limparErro(erroBio);
    campoBio.value = bioAtual;
    atualizarContadorBio();
    bioVisualizacao.classList.add('hidden');
    formBio.classList.remove('hidden');
    campoBio.focus();
  }

  function fecharEdicaoBio() {
    formBio.classList.add('hidden');
    bioVisualizacao.classList.remove('hidden');
  }

  btnEditarBio.addEventListener('click', abrirEdicaoBio);
  btnCancelarBio.addEventListener('click', fecharEdicaoBio);
  campoBio.addEventListener('input', atualizarContadorBio);
  campoBio.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') fecharEdicaoBio();
  });

  formBio.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparErro(erroBio);

    const bio = campoBio.value.trim();

    if (bio.length > MAX_BIO) {
      exibirErro(erroBio, `A bio pode ter no máximo ${MAX_BIO} caracteres.`);
      return;
    }

    if (bio === bioAtual) {
      fecharEdicaoBio();
      return;
    }

    btnSalvarBio.disabled = true;
    btnSalvarBio.textContent = 'Salvando...';

    try {
      const resposta = await UsuariosAPI.atualizarBio(bio);
      mostrarBio(resposta.ds_bio);
      fecharEdicaoBio();
    } catch (err) {
      exibirErro(erroBio, err.message);
    } finally {
      btnSalvarBio.disabled = false;
      btnSalvarBio.textContent = 'Salvar bio';
    }
  });

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
  // Resumo das listas
  // ----------------------------------------
  async function carregarResumoListas() {
    listasEstadoCarregando.classList.remove('hidden');

    try {
      const listas = await UsuariosAPI.minhasListas();
      renderizarResumoListas(listas);
    } catch (err) {
      listasEstadoCarregando.classList.add('hidden');
      contadorListas.textContent = '';
      listasEstadoErro.textContent = err.message;
      listasEstadoErro.classList.remove('hidden');
    }
  }

    function renderizarResumoListas(listas) {
    const total = listas.length;

    resumoListas.innerHTML = '';
    listasEstadoCarregando.classList.add('hidden');
    listasEstadoVazio.classList.add('hidden');
    listasEstadoErro.classList.add('hidden');
    listasVerTodas.classList.add('hidden');

    contadorListas.textContent = total === 1 ? '1 lista criada' : `${total} listas criadas`;
    linkGerenciarListas.textContent = total === 0 ? 'Criar lista' : 'Gerenciar listas';

    if (total === 0) {
      listasEstadoVazio.classList.remove('hidden');
      return;
    }

    listas.slice(0, LISTAS_VISIVEIS).forEach((lista) => {
      const item = templateListaResumo.content.cloneNode(true);

      // o card inteiro leva para a página da lista
      item.querySelector('.item-lista').href = `lista-detalhe.html?id=${lista.id_lista}`;

      item.querySelector('.nome').textContent = lista.nm_lista;

      const badge = item.querySelector('.visibilidade');
      if (lista.is_visibilidade) {
        badge.textContent = 'Pública';
        badge.classList.add('border-amber/30', 'text-amber', 'bg-amber/10');
      } else {
        badge.textContent = 'Privada';
        badge.classList.add('border-border', 'text-muted');
      }

      const descricao = item.querySelector('.descricao');
      if (lista.ds_lista) {
        descricao.textContent = lista.ds_lista;
      } else {
        descricao.classList.add('hidden');
      }

      const filmes = Number(lista.total_filmes) || 0;
      item.querySelector('.total').textContent = `${filmes} ${filmes === 1 ? 'filme' : 'filmes'}`;

      resumoListas.appendChild(item);
    });

    const restantes = total - LISTAS_VISIVEIS;
    if (restantes > 0) {
      listasVerTodas.textContent = `Ver mais ${restantes} ${restantes === 1 ? 'lista' : 'listas'}`;
      listasVerTodas.classList.remove('hidden');
    }
  }

  // ----------------------------------------
  // Estados de exibição do histórico de avaliações
  // ----------------------------------------
  function limparEstados() {
    listaAvaliacoes.innerHTML = '';
    estadoCarregando.classList.add('hidden');
    estadoVazio.classList.add('hidden');
    estadoErro.classList.add('hidden');
    rodapeAvaliacoes.classList.add('hidden');
    limparErro(erroCarregarMais);
    definirCarregandoMais(false);
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

  function definirCarregandoMais(carregando) {
    btnCarregarMais.disabled = carregando;
    btnCarregarMais.textContent = carregando ? 'Carregando...' : 'Carregar mais';
  }

  // ----------------------------------------
  // Carregar e renderizar avaliações
  // ----------------------------------------

  /**
   * @param {Object} [opcoes]
   * @param {boolean} [opcoes.anexar] - "Carregar mais": busca a partir do que já está na tela e acrescenta.
   * @param {boolean} [opcoes.manterQuantidade] - recarrega do início, mas pedindo pelo menos a
   *   quantidade que já estava na tela (usado após editar/excluir, sem perder o que foi carregado).
   * Sem opções: recarrega do início (usado na entrada da página e ao trocar a ordenação).
   */
  async function carregarAvaliacoes({ anexar = false, manterQuantidade = false } = {}) {
    const minhaRequisicao = ++idRequisicao;
    emAndamento = true;

    let offset = 0;
    let limit = LIMITE_POR_PAGINA;

    if (anexar) {
      offset = avaliacoes.length;
      limparErro(erroCarregarMais);
      definirCarregandoMais(true);
    } else if (manterQuantidade) {
      limit = Math.min(Math.max(avaliacoes.length, LIMITE_POR_PAGINA), LIMITE_MAXIMO);
    } else {
      mostrarCarregando();
    }

    try {
      const resposta = await UsuariosAPI.minhasAvaliacoes({ limit, offset, ordem: ordemAtual });

      if (minhaRequisicao !== idRequisicao) return; // chegou uma requisição mais nova, descarta esta

      totalAvaliacoes = resposta.pagination.total;
      temMais = resposta.pagination.hasMore;

      if (anexar) {
        avaliacoes = avaliacoes.concat(resposta.data);
        resposta.data.forEach((avaliacao) => listaAvaliacoes.appendChild(criarItemAvaliacao(avaliacao)));
        atualizarRodape();
      } else {
        avaliacoes = resposta.data;
        renderizarAvaliacoes();
      }
    } catch (err) {
      if (minhaRequisicao !== idRequisicao) return;

      if (anexar) {
        exibirErro(erroCarregarMais, err.message);
      } else {
        avaliacoes = [];
        totalAvaliacoes = 0;
        temMais = false;
        contadorAvaliacoes.textContent = '';
        controleOrdem.classList.add('hidden');
        mostrarErro(err.message);
      }
    } finally {
      if (minhaRequisicao === idRequisicao) {
        emAndamento = false;
        if (anexar) definirCarregandoMais(false);
      }
    }
  }

  function renderizarAvaliacoes() {
    limparEstados();

    contadorAvaliacoes.textContent =
      totalAvaliacoes === 1 ? '1 filme avaliado' : `${totalAvaliacoes} filmes avaliados`;

    if (avaliacoes.length === 0) {
      controleOrdem.classList.add('hidden');
      mostrarVazio();
      return;
    }

    controleOrdem.classList.remove('hidden');
    avaliacoes.forEach((avaliacao) => listaAvaliacoes.appendChild(criarItemAvaliacao(avaliacao)));
    atualizarRodape();
  }

  function atualizarRodape() {
    if (avaliacoes.length === 0) {
      rodapeAvaliacoes.classList.add('hidden');
      return;
    }

    textoProgresso.textContent = `Mostrando ${avaliacoes.length} de ${totalAvaliacoes}`;
    btnCarregarMais.classList.toggle('hidden', !temMais);
    rodapeAvaliacoes.classList.remove('hidden');
  }

  function criarItemAvaliacao(avaliacao) {
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

    return item;
  }

  seletorOrdem.addEventListener('change', () => {
    ordemAtual = seletorOrdem.value;
    carregarAvaliacoes();
  });

  btnCarregarMais.addEventListener('click', () => {
    if (emAndamento) return;
    carregarAvaliacoes({ anexar: true });
  });

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
      // a nota pode ter mudado a posição do item na ordenação, então recarrega
      carregarAvaliacoes({ manterQuantidade: true });
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
      carregarAvaliacoes({ manterQuantidade: true });
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

  // mostra a foto em cache na hora; carregarDadosPerfil() confirma com o servidor
  // (cobre o caso de a foto ter sido trocada em outro dispositivo) e traz bio e "membro desde"
  atualizarAvatar(Auth.fotoAtual());
  carregarDadosPerfil();

  carregarResumoListas();
  carregarAvaliacoes();
});