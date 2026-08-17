// ========================================
// src/js/components/footer.js
// Componente de rodapé reutilizável em todas as páginas.
//
// Uso:
//   <footer id="footer-root" class="border-t border-border mt-auto"></footer>
//   ...
//   <script src=".../js/components/footer.js"></script>
//   <script>
//     renderFooter({ contexto: 'pages', largura: 'narrow' });
//   </script>
// ========================================

const LINK_GITHUB = 'https://github.com/arthurguerraa';
const LINK_LINKEDIN = 'https://www.linkedin.com/in/arthurguerraa/';

const ICONE_GITHUB = `
  <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.34-1.28-1.7-1.28-1.7-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.77.12 3.06.74.8 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.2 0 .31.21.67.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/>
  </svg>
`;

const ICONE_LINKEDIN = `
  <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
    <path d="M20.45 20.45h-3.56v-5.58c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.68H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.47v6.27ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z"/>
  </svg>
`;

/**
 * @param {Object} opcoes
 * @param {'root'|'pages'} opcoes.contexto - 'root' para o index.html na raiz,
 *   'pages' para arquivos dentro de src/pages/.
 * @param {'wide'|'narrow'} opcoes.largura - mesma lógica usada no header.
 */
function renderFooter({ contexto = 'pages', largura = 'narrow' } = {}) {
  const raizIndex = contexto === 'root' ? './index.html' : '../../index.html';
  const raizPaginas = contexto === 'root' ? './src/pages/' : './';
  const maxWidth = largura === 'wide' ? 'max-w-5xl' : 'max-w-3xl';
  const anoAtual = new Date().getFullYear();

  const html = `
    <div class="${maxWidth} mx-auto px-6 py-10">
      <div class="sprocket mb-8 opacity-40"></div>

      <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-8">

        <div>
          <a href="${raizIndex}" class="font-display text-xl font-semibold text-cream tracking-wide">CineTrack</a>
          <p class="text-muted text-sm mt-2 max-w-xs">
            Projeto pessoal de estudo, criado para avaliar filmes e montar listas.
          </p>
        </div>

        <div class="flex flex-col gap-2 text-sm">
          <span class="text-muted text-xs uppercase tracking-wide mb-1">Navegação</span>
          <a href="${raizIndex}" class="text-muted hover:text-cream transition-colors">Início</a>
          <a href="${raizPaginas}ranking.html" class="text-muted hover:text-cream transition-colors">Ranking</a>
        </div>

        <div class="text-sm text-muted max-w-xs">
          <span class="text-muted text-xs uppercase tracking-wide mb-1 block">Dados dos filmes</span>
          Este produto usa a API do TMDB, mas não é endossado ou certificado por ela.
          <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" class="text-amber hover:brightness-110 transition-colors">
            themoviedb.org
          </a>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-muted text-xs uppercase tracking-wide mb-1">Contato</span>
          <div class="flex items-center gap-3">
            <a href="${LINK_GITHUB}" target="_blank" rel="noopener noreferrer" aria-label="GitHub" class="text-muted hover:text-amber transition-colors">
              ${ICONE_GITHUB}
            </a>
            <a href="${LINK_LINKEDIN}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" class="text-muted hover:text-amber transition-colors">
              ${ICONE_LINKEDIN}
            </a>
          </div>
        </div>

      </div>

      <p class="text-muted text-xs mt-8">
        © ${anoAtual} CineTrack · Projeto feito por Arthur Guerra
      </p>
    </div>
  `;

  const raiz = document.getElementById('footer-root');
  if (raiz) raiz.innerHTML = html;
}