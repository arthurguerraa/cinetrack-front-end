// ========================================
// src/js/pages/lista-detalhe.js
// Página de uma lista de filmes (lista-detalhe.html?id=N).
// Depende de api.js, auth.js e main.js já carregados antes deste arquivo.
// A proteção de rota já rodou no <head> do lista-detalhe.html.
//
// Toda a lista é carregada de uma vez; filtros, ordenação e sorteio
// acontecem no navegador, sem novas requisições.
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);

  const idLista = parseInt(new URLSearchParams(window.location.search).get('id'), 10);
  if (!idLista) {
    window.location.href = 'listas.html';
    return;
  }

  // cabeçalho da lista
  const linkVoltar = $('link-voltar');
  const cabecalhoLista = $('cabecalho-lista');
  const listaRotulo = $('lista-rotulo');
  const listaBadge = $('lista-badge');
  const listaNome = $('lista-nome');
  const listaDescricao = $('lista-descricao');
  const listaMeta = $('lista-meta');
  const blocoProgresso = $('bloco-progresso');
  const progresso = $('progresso');
  const btnSortear = $('btn-sortear');
  const btnEditarLista = $('btn-editar-lista');

  // sorteio
  const destaqueSorteio = $('destaque-sorteio');
  const destaqueRotulo = $('destaque-rotulo');
  const destaqueTitulo = $('destaque-titulo');
  const btnSortearOutro = $('btn-sortear-outro');
  const btnFecharDestaque = $('btn-fechar-destaque');

  // controles
  const controles = $('controles');
  const filtroAssistido = $('filtro-assistido');
  const pillsFiltro = Array.from(document.querySelectorAll('.pill-filtro'));
  const blocoGenero = $('bloco-genero');
  const seletorGenero = $('seletor-genero');
  const seletorOrdem = $('seletor-ordem');

  // estados e grid
  const estadoCarregando = $('estado-carregando');
  const estadoVazio = $('estado-vazio');
  const estadoFiltroVazio = $('estado-filtro-vazio');
  const estadoErro = $('estado-erro');
  const erroAcao = $('erro-acao');
  const gridFilmes = $('grid-filmes');
  const templateCard = $('template-card-filme');

  // modal editar lista
  const modalLista = $('modal-lista');
  const modalListaFechar = $('modal-lista-fechar');
  const formLista = $('form-lista');
  const listaNomeInput = $('lista-nome-input');
  const listaDescricaoInput = $('lista-descricao-input');
  const listaVisibilidadeInput = $('lista-visibilidade-input');
  const modalListaErro = $('modal-lista-erro');
  const modalListaBtnSalvar = $('modal-lista-btn-salvar');

  // modal remover filme
  const modalRemover = $('modal-remover');
  const modalRemoverTitulo = $('modal-remover-titulo');
  const modalRemoverCancelar = $('modal-remover-cancelar');
  const modalRemoverConfirmar = $('modal-remover-confirmar');

  // ----------------------------------------
  // Estado
  // ----------------------------------------
  const TENTATIVAS_DURACAO = 6; // quantas vezes consultar de novo enquanto as durações são buscadas
  const INTERVALO_DURACAO_MS = 2500;
  const GENEROS_POR_CARD = 3;

  let lista = null;
  let filmes = [];
  let ehDono = false;
  let duracoesPendentes = 0;

  let filtro = 'todos'; // 'todos' | 'pendentes' | 'assistidos'
  let generoFiltro = 'todos'; // 'todos' ou o nome de um gênero
  let ordem = 'adicionados_antigos';
  let idSorteado = null;
  let filmeParaRemover = null;

  // ----------------------------------------
  // Utilitários
  // ----------------------------------------
  function plural(n, singular, pluralTexto) {
    return `${n} ${n === 1 ? singular : pluralTexto}`;
  }

  function formatarDuracao(minutos) {
    if (!minutos) return '—';
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    if (!h) return `${m}min`;
    return m ? `${h}h ${String(m).padStart(2, '0')}min` : `${h}h`;
  }

  function normalizarFilme(filme) {
    return {
      ...filme,
      is_assistido: Boolean(filme.is_assistido),
      generos: Array.isArray(filme.generos) ? filme.generos : [],
    };
  }

  const temGenero = (filme) => generoFiltro === 'todos' || filme.generos.includes(generoFiltro);

  // ----------------------------------------
  // Ordenação
  // ----------------------------------------
  const tempoAdicionado = (f) => new Date(f.dt_adicionado).getTime() || null;
    const notaDe = (f) => {
    const n = parseFloat(f.nota_combinada ?? f.nr_nota_media);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  // valores ausentes (null) sempre ficam no fim, em qualquer direção
  const porValor = (valor, direcao) => (a, b) => {
    const va = valor(a);
    const vb = valor(b);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    return (va - vb) * direcao;
  };

  const porTitulo = (a, b) =>
    String(a.nm_filme).localeCompare(String(b.nm_filme), 'pt-BR', { sensitivity: 'base' });

  const COMPARADORES = {
    adicionados_antigos: porValor(tempoAdicionado, 1),
    adicionados_recentes: porValor(tempoAdicionado, -1),
    maior_nota: porValor(notaDe, -1),
    menor_nota: porValor(notaDe, 1),
    lancamento_antigos: porValor((f) => f.dt_lancamento || null, 1),
    lancamento_recentes: porValor((f) => f.dt_lancamento || null, -1),
    duracao_curta: porValor((f) => f.nr_duracao || null, 1),
    duracao_longa: porValor((f) => f.nr_duracao || null, -1),
    titulo: porTitulo,
  };

  function filmesVisiveis() {
    let resultado = filmes.filter(temGenero);

    if (ehDono && filtro === 'pendentes') resultado = resultado.filter((f) => !f.is_assistido);
    if (ehDono && filtro === 'assistidos') resultado = resultado.filter((f) => f.is_assistido);

    const comparar = COMPARADORES[ordem] || COMPARADORES.adicionados_antigos;
    return [...resultado].sort((a, b) => comparar(a, b) || porTitulo(a, b) || a.id_filme - b.id_filme);
  }

  // ----------------------------------------
  // Estados de exibição
  // ----------------------------------------
  function esconderEstados() {
    estadoCarregando.classList.add('hidden');
    estadoVazio.classList.add('hidden');
    estadoFiltroVazio.classList.add('hidden');
    estadoErro.classList.add('hidden');
  }

  function mostrarCarregando() {
    esconderEstados();
    gridFilmes.innerHTML = '';
    estadoCarregando.classList.remove('hidden');
  }

  function mostrarErro(mensagem) {
    esconderEstados();
    gridFilmes.innerHTML = '';
    cabecalhoLista.classList.add('hidden');
    controles.classList.add('hidden');
    estadoErro.textContent = mensagem;
    estadoErro.classList.remove('hidden');
  }

  function mensagemSemResultado() {
    if (generoFiltro !== 'todos') {
      if (ehDono && filtro === 'pendentes') return `Nenhum filme de ${generoFiltro} para assistir nesta lista.`;
      if (ehDono && filtro === 'assistidos') return `Você ainda não assistiu nenhum filme de ${generoFiltro} desta lista.`;
      return `Nenhum filme de ${generoFiltro} nesta lista.`;
    }

    return filtro === 'pendentes'
      ? 'Você já assistiu todos os filmes desta lista.'
      : 'Você ainda não marcou nenhum filme como assistido.';
  }

  // ----------------------------------------
  // Cabeçalho e resumo
  // ----------------------------------------
  function renderizarCabecalho() {
    listaRotulo.textContent = ehDono ? 'Sua lista' : `Lista de ${lista.nm_dono || 'outro usuário'}`;
    listaNome.textContent = lista.nm_lista;
    document.title = `${lista.nm_lista} · CineTrack`;

    if (lista.ds_lista) {
      listaDescricao.textContent = lista.ds_lista;
      listaDescricao.classList.remove('hidden');
    } else {
      listaDescricao.classList.add('hidden');
    }

    const publica = Boolean(lista.is_visibilidade);
    listaBadge.textContent = publica ? 'Pública' : 'Privada';
    listaBadge.className =
      'text-[10px] font-mono uppercase tracking-wide rounded-sm px-2 py-1 shrink-0 ' +
      (publica ? 'bg-amber/10 text-amber' : 'bg-border text-muted');

    linkVoltar.textContent = ehDono ? '← Minhas listas' : '← Início';
    linkVoltar.href = ehDono ? 'listas.html' : '../../index.html';

    btnEditarLista.classList.toggle('hidden', !ehDono);
    filtroAssistido.classList.toggle('hidden', !ehDono);
    blocoProgresso.classList.toggle('hidden', !ehDono);

    cabecalhoLista.classList.remove('hidden');
  }

  function atualizarResumo() {
    const total = filmes.length;
    const vistos = filmes.filter((f) => f.is_assistido).length;

    let meta = plural(total, 'filme', 'filmes');
    if (ehDono && total > 0) meta += ` · ${plural(vistos, 'assistido', 'assistidos')}`;
    listaMeta.textContent = meta;

    progresso.max = Math.max(total, 1);
    progresso.value = vistos;

    const rotulos = {
      todos: `Todos (${total})`,
      pendentes: `Para assistir (${total - vistos})`,
      assistidos: `Assistidos (${vistos})`,
    };

    pillsFiltro.forEach((pill) => {
      const ativo = pill.dataset.filtro === filtro;
      pill.textContent = rotulos[pill.dataset.filtro];
      ['bg-amber', 'text-night', 'border-amber'].forEach((c) => pill.classList.toggle(c, ativo));
      ['bg-surface', 'text-muted', 'border-border'].forEach((c) => pill.classList.toggle(c, !ativo));
    });
  }

  /**
   * Monta o seletor de gênero só com os gêneros que existem na lista, com a contagem
   * de filmes de cada um. Se o gênero escolhido deixou de existir (ex.: o último filme
   * dele foi removido), volta para "todos".
   */
  function atualizarOpcoesGenero() {
    const contagem = new Map();
    filmes.forEach((filme) => {
      filme.generos.forEach((genero) => contagem.set(genero, (contagem.get(genero) || 0) + 1));
    });

    const nomes = [...contagem.keys()].sort((a, b) => a.localeCompare(b, 'pt-BR'));

    if (generoFiltro !== 'todos' && !contagem.has(generoFiltro)) generoFiltro = 'todos';

    seletorGenero.innerHTML = '';
    seletorGenero.add(new Option('Todos os gêneros', 'todos'));
    nomes.forEach((nome) => seletorGenero.add(new Option(`${nome} (${contagem.get(nome)})`, nome)));
    seletorGenero.value = generoFiltro;

    // sem nenhum gênero cadastrado nos filmes, não há o que filtrar
    blocoGenero.classList.toggle('hidden', nomes.length === 0);
  }

  // ----------------------------------------
  // Cards
  // ----------------------------------------
    function criarCard(filme) {
    const card = templateCard.content.cloneNode(true);
    const artigo = card.querySelector('.card-filme');
    artigo.dataset.id = filme.id_filme;

    const posterEl = card.querySelector('.poster');
    if (filme.ds_poster) posterEl.style.backgroundImage = `url('${filme.ds_poster}')`;

    card.querySelector('.titulo').textContent = filme.nm_filme;

    const nota = notaDe(filme);
    const notaEl = card.querySelector('.nota');
    notaEl.textContent = `★ ${nota ? formatarNota(nota) : '—'}`;
    notaEl.title = filme.total_avaliacoes > 0
      ? `Combina a nota do TMDB com ${filme.total_avaliacoes} ${filme.total_avaliacoes === 1 ? 'avaliação' : 'avaliações'} do CineTrack`
      : 'Nota do TMDB';

    card.querySelector('.ano').textContent = formatarAno(filme.dt_lancamento);
    card.querySelector('.duracao').textContent = formatarDuracao(filme.nr_duracao);

    const generosEl = card.querySelector('.generos');
    if (filme.generos.length > 0) {
      generosEl.textContent = filme.generos.slice(0, GENEROS_POR_CARD).join(' · ');
      generosEl.title = filme.generos.join(', ');
    } else {
      generosEl.classList.add('hidden');
    }

    if (filme.id_filme === idSorteado) artigo.classList.add('ring-2', 'ring-amber');

    const acoes = card.querySelector('.acoes');
    if (!ehDono) {
      acoes.classList.add('hidden');
      return card;
    }

    const btnAssistido = card.querySelector('.btn-assistido');
    if (filme.is_assistido) {
      posterEl.classList.add('opacity-50');
      card.querySelector('.badge-assistido').classList.remove('hidden');
      btnAssistido.textContent = '✓ Assistido';
      btnAssistido.classList.add('border-amber/40', 'bg-amber/10', 'text-amber');
    } else {
      btnAssistido.textContent = 'Já assisti';
      btnAssistido.classList.add('border-border', 'text-cream', 'hover:border-amber', 'hover:text-amber');
    }

    btnAssistido.addEventListener('click', () => alternarAssistido(filme, btnAssistido));
    card.querySelector('.btn-remover').addEventListener('click', () => abrirModalRemover(filme));

    return card;
  }

  function renderizar() {
    esconderEstados();
    gridFilmes.innerHTML = '';
    atualizarOpcoesGenero();
    atualizarResumo();

    const temFilmes = filmes.length > 0;
    controles.classList.toggle('hidden', !temFilmes);
    btnSortear.classList.toggle('hidden', !temFilmes);

    if (!temFilmes) {
      fecharDestaque();
      estadoVazio.classList.remove('hidden');
      return;
    }

    const visiveis = filmesVisiveis();

    if (visiveis.length === 0) {
      estadoFiltroVazio.textContent = mensagemSemResultado();
      estadoFiltroVazio.classList.remove('hidden');
      return;
    }

    visiveis.forEach((filme) => gridFilmes.appendChild(criarCard(filme)));
  }

  // ----------------------------------------
  // Carregar a lista
  // ----------------------------------------
  async function carregarLista() {
    mostrarCarregando();

    try {
      const resposta = await ListasAPI.verFilmes(idLista);

      lista = resposta.lista;
      ehDono = Boolean(resposta.is_dono);
      filmes = resposta.filmes.map(normalizarFilme);
      duracoesPendentes = resposta.duracoes_pendentes || 0;

      renderizarCabecalho();
      renderizar();
      acompanharDuracoes(1);
    } catch (err) {
      mostrarErro(err.message);
    }
  }

  /**
   * As durações são buscadas no TMDB em segundo plano pelo servidor. Enquanto houver
   * filmes sem duração, consulta de novo e apenas ENCAIXA as durações novas nos filmes
   * que já estão na tela (não mexe em mais nada, então não atrapalha o que o usuário faz).
   */
  function acompanharDuracoes(tentativa) {
    if (!duracoesPendentes || tentativa > TENTATIVAS_DURACAO) return;

    setTimeout(async () => {
      try {
        const resposta = await ListasAPI.verFilmes(idLista);
        const duracoes = new Map(resposta.filmes.map((f) => [f.id_filme, f.nr_duracao]));

        let mudou = false;
        filmes.forEach((filme) => {
          const nova = duracoes.get(filme.id_filme);
          if (nova && filme.nr_duracao !== nova) {
            filme.nr_duracao = nova;
            mudou = true;
          }
        });

        duracoesPendentes = resposta.duracoes_pendentes || 0;
        if (mudou) renderizar();
      } catch (err) {
        // silencioso: a duração é um extra, a página funciona sem ela
      }

      acompanharDuracoes(tentativa + 1);
    }, INTERVALO_DURACAO_MS);
  }

  // ----------------------------------------
  // Filtros e ordenação
  // ----------------------------------------
  pillsFiltro.forEach((pill) => {
    pill.addEventListener('click', () => {
      filtro = pill.dataset.filtro;
      renderizar();
    });
  });

  seletorGenero.addEventListener('change', () => {
    generoFiltro = seletorGenero.value;
    fecharDestaque(); // o filme sorteado pode não pertencer ao novo gênero
    renderizar();
  });

  seletorOrdem.addEventListener('change', () => {
    ordem = seletorOrdem.value;
    renderizar();
  });

  // ----------------------------------------
  // Sorteio (respeita o gênero escolhido)
  // ----------------------------------------
  function mostrarDestaque(rotulo, titulo, podeSortearOutro) {
    destaqueRotulo.textContent = rotulo;
    destaqueTitulo.textContent = titulo;
    btnSortearOutro.classList.toggle('hidden', !podeSortearOutro);
    destaqueSorteio.classList.remove('hidden');
    destaqueSorteio.classList.add('flex');
  }

  function fecharDestaque() {
    idSorteado = null;
    destaqueSorteio.classList.add('hidden');
    destaqueSorteio.classList.remove('flex');
    gridFilmes.querySelectorAll('.ring-2').forEach((card) => card.classList.remove('ring-2', 'ring-amber'));
  }

  function sortear() {
    const doGenero = filmes.filter(temGenero);
    const candidatosBase = ehDono ? doGenero.filter((f) => !f.is_assistido) : doGenero;

    if (candidatosBase.length === 0) {
      idSorteado = null;
      renderizar();
      mostrarDestaque(
        'Nada para sortear',
        generoFiltro !== 'todos'
          ? `Você já assistiu todos os filmes de ${generoFiltro} desta lista.`
          : 'Você já assistiu todos os filmes desta lista.',
        false
      );
      return;
    }

    // evita repetir o mesmo filme em sorteios seguidos, quando há outras opções
    const candidatos =
      candidatosBase.length > 1 ? candidatosBase.filter((f) => f.id_filme !== idSorteado) : candidatosBase;

    const escolhido = candidatos[Math.floor(Math.random() * candidatos.length)];
    idSorteado = escolhido.id_filme;

    // se o filtro escondesse o filme sorteado, volta para "todos"
    if (filtro === 'assistidos') filtro = 'todos';

    renderizar();
    mostrarDestaque(
      generoFiltro !== 'todos' ? `Sorteado em ${generoFiltro}` : 'Sorteado para você',
      escolhido.nm_filme,
      candidatosBase.length > 1
    );

    const card = gridFilmes.querySelector(`[data-id="${escolhido.id_filme}"]`);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  btnSortear.addEventListener('click', sortear);
  btnSortearOutro.addEventListener('click', sortear);
  btnFecharDestaque.addEventListener('click', fecharDestaque);

  // ----------------------------------------
  // Marcar como assistido
  // ----------------------------------------
  async function alternarAssistido(filme, botao) {
    limparErro(erroAcao);
    botao.disabled = true;

    const novoValor = !filme.is_assistido;

    try {
      await ListasAPI.marcarAssistido(idLista, filme.id_filme, novoValor);
      filme.is_assistido = novoValor;

      // o filme sorteado já foi assistido: o destaque perde o sentido
      if (novoValor && filme.id_filme === idSorteado) fecharDestaque();

      renderizar();
    } catch (err) {
      exibirErro(erroAcao, err.message);
      botao.disabled = false;
    }
  }

  // ----------------------------------------
  // Remover filme da lista
  // ----------------------------------------
  function abrirModalRemover(filme) {
    filmeParaRemover = filme;
    modalRemoverTitulo.textContent = filme.nm_filme;
    modalRemover.classList.remove('hidden');
    modalRemover.classList.add('flex');
  }

  function fecharModalRemover() {
    filmeParaRemover = null;
    modalRemover.classList.add('hidden');
    modalRemover.classList.remove('flex');
  }

  modalRemoverCancelar.addEventListener('click', fecharModalRemover);
  modalRemover.addEventListener('click', (evento) => {
    if (evento.target === modalRemover) fecharModalRemover();
  });

  modalRemoverConfirmar.addEventListener('click', async () => {
    if (!filmeParaRemover) return;

    const filme = filmeParaRemover;
    limparErro(erroAcao);
    modalRemoverConfirmar.disabled = true;
    modalRemoverConfirmar.textContent = 'Removendo...';

    try {
      await ListasAPI.removerFilme(idLista, filme.id_filme);
      filmes = filmes.filter((f) => f.id_filme !== filme.id_filme);
      if (filme.id_filme === idSorteado) fecharDestaque();
      fecharModalRemover();
      renderizar();
    } catch (err) {
      fecharModalRemover();
      exibirErro(erroAcao, err.message);
    } finally {
      modalRemoverConfirmar.disabled = false;
      modalRemoverConfirmar.textContent = 'Remover';
    }
  });

  // ----------------------------------------
  // Editar a lista (nome, descrição, visibilidade)
  // ----------------------------------------
  function abrirModalLista() {
    limparErro(modalListaErro);
    listaNomeInput.value = lista.nm_lista;
    listaDescricaoInput.value = lista.ds_lista || '';
    listaVisibilidadeInput.checked = Boolean(lista.is_visibilidade);

    modalLista.classList.remove('hidden');
    modalLista.classList.add('flex');
  }

  function fecharModalLista() {
    modalLista.classList.add('hidden');
    modalLista.classList.remove('flex');
  }

  btnEditarLista.addEventListener('click', abrirModalLista);
  modalListaFechar.addEventListener('click', fecharModalLista);
  modalLista.addEventListener('click', (evento) => {
    if (evento.target === modalLista) fecharModalLista();
  });

  formLista.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparErro(modalListaErro);

    const nome = listaNomeInput.value.trim();
    const descricao = listaDescricaoInput.value.trim();
    const visibilidade = listaVisibilidadeInput.checked;

    if (!nome) {
      exibirErro(modalListaErro, 'Digite um nome para a lista.');
      return;
    }

    modalListaBtnSalvar.disabled = true;
    modalListaBtnSalvar.textContent = 'Salvando...';

    try {
      await ListasAPI.editar(idLista, nome, descricao || null, visibilidade);

      lista.nm_lista = nome;
      lista.ds_lista = descricao || null;
      lista.is_visibilidade = visibilidade ? 1 : 0;

      fecharModalLista();
      renderizarCabecalho();
    } catch (err) {
      exibirErro(modalListaErro, err.message);
    } finally {
      modalListaBtnSalvar.disabled = false;
      modalListaBtnSalvar.textContent = 'Salvar';
    }
  });

  // ----------------------------------------
  // Inicialização
  // ----------------------------------------
  carregarLista();
});