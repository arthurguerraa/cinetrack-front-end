// ========================================
// src/js/components/header.js
// Componente de header reutilizável em todas as páginas.
// Deve ser chamado ANTES de main.js, para que montarHeader()
// encontre os elementos .header-logado / .header-deslogado já no DOM.
//
// Uso:
//   <header id="header-root" class="border-b border-border"></header>
//   ...
//   <script src=".../js/components/header.js"></script>
//   <script>
//     renderHeader({ contexto: 'pages', paginaAtiva: 'ranking' });
//   </script>
//   <script src=".../js/main.js"></script>
// ========================================

/**
 * @param {Object} opcoes
 * @param {'root'|'pages'} opcoes.contexto - 'root' para o index.html na raiz do
 *   projeto, 'pages' para qualquer arquivo dentro de src/pages/.
 * @param {'ranking'|'listas'|'perfil'|null} opcoes.paginaAtiva - qual link fica
 *   destacado em âmbar.
 * @param {'wide'|'narrow'} opcoes.largura - largura máxima do conteúdo do header.
 */
function renderHeader({ contexto = 'pages', paginaAtiva = null, largura = 'narrow' } = {}) {
  const raizIndex = contexto === 'root' ? './index.html' : '../../index.html';
  const raizPaginas = contexto === 'root' ? './src/pages/' : './';
  const maxWidth = largura === 'wide' ? 'max-w-5xl' : 'max-w-3xl';

  const classeLink = (nome) =>
    paginaAtiva === nome
      ? 'text-amber'
      : 'text-muted hover:text-cream transition-colors';

  const html = `
    <div class="${maxWidth} mx-auto px-6 py-4 flex items-center justify-between">
      <a href="${raizIndex}" class="font-display text-2xl font-semibold tracking-wide">CineTrack</a>

      <!-- navegação desktop -->
      <nav class="hidden md:flex items-center gap-6 text-sm">
        <a href="${raizPaginas}ranking.html" class="${classeLink('ranking')}">Ranking</a>

        <div class="header-logado hidden items-center gap-4">
          <a href="${raizPaginas}listas.html" class="${classeLink('listas')}">Minhas listas</a>
          <a href="${raizPaginas}perfil.html" class="${classeLink('perfil')}">Perfil</a>
          <span class="text-muted">·</span>
          <span class="header-nome-usuario text-cream"></span>
          <button class="header-btn-logout text-muted hover:text-amber transition-colors text-xs border border-border rounded-card px-3 py-1.5">
            Sair
          </button>
        </div>

        <div class="header-deslogado hidden items-center gap-3">
          <a href="${raizPaginas}login.html" class="text-muted hover:text-cream transition-colors">Entrar</a>
          <a href="${raizPaginas}cadastro.html" class="bg-amber text-night font-semibold text-xs rounded-card px-3 py-2 hover:brightness-110 transition-all">
            Cadastre-se
          </a>
        </div>
      </nav>

      <!-- botão hamburguer, só visível abaixo do breakpoint md -->
      <button id="header-menu-toggle" type="button" class="md:hidden text-cream p-1" aria-label="Abrir menu" aria-expanded="false">
        <svg id="icone-menu-abrir" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
        </svg>
        <svg id="icone-menu-fechar" class="hidden w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- painel mobile, escondido por padrão -->
    <div id="header-menu-mobile" class="hidden md:hidden border-t border-border">
      <div class="${maxWidth} mx-auto px-6 py-4 flex flex-col gap-4 text-sm">
        <a href="${raizPaginas}ranking.html" class="${classeLink('ranking')}">Ranking</a>

        <div class="header-logado hidden flex-col gap-3">
          <a href="${raizPaginas}listas.html" class="${classeLink('listas')}">Minhas listas</a>
          <a href="${raizPaginas}perfil.html" class="${classeLink('perfil')}">Perfil</a>
          <div class="flex items-center justify-between pt-3 border-t border-border">
            <span class="header-nome-usuario text-cream"></span>
            <button class="header-btn-logout text-muted hover:text-amber transition-colors text-xs border border-border rounded-card px-3 py-1.5">
              Sair
            </button>
          </div>
        </div>

        <div class="header-deslogado hidden flex-col gap-3">
          <a href="${raizPaginas}login.html" class="text-muted hover:text-cream transition-colors">Entrar</a>
          <a href="${raizPaginas}cadastro.html" class="bg-amber text-night font-semibold text-xs rounded-card px-3 py-2 hover:brightness-110 transition-all text-center">
            Cadastre-se
          </a>
        </div>
      </div>
    </div>
  `;

  const raiz = document.getElementById('header-root');
  if (raiz) raiz.innerHTML = html;

  configurarMenuMobile();
}

/**
 * Liga a interatividade do botão hamburguer: abre/fecha o painel mobile,
 * alterna o ícone entre hambúrguer e X, e fecha automaticamente ao clicar
 * em qualquer link dentro do painel.
 */
function configurarMenuMobile() {
  const btnToggle = document.getElementById('header-menu-toggle');
  const painel = document.getElementById('header-menu-mobile');
  const iconeAbrir = document.getElementById('icone-menu-abrir');
  const iconeFechar = document.getElementById('icone-menu-fechar');

  if (!btnToggle || !painel) return;

  function abrirMenu() {
    painel.classList.remove('hidden');
    iconeAbrir.classList.add('hidden');
    iconeFechar.classList.remove('hidden');
    btnToggle.setAttribute('aria-expanded', 'true');
  }

  function fecharMenu() {
    painel.classList.add('hidden');
    iconeAbrir.classList.remove('hidden');
    iconeFechar.classList.add('hidden');
    btnToggle.setAttribute('aria-expanded', 'false');
  }

  btnToggle.addEventListener('click', () => {
    const estaAberto = !painel.classList.contains('hidden');
    estaAberto ? fecharMenu() : abrirMenu();
  });

  // fecha o menu ao clicar em qualquer link dentro dele
  painel.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', fecharMenu);
  });

  // se a tela for redimensionada para desktop com o menu aberto, fecha
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) fecharMenu();
  });
}