// ========================================
// src/js/components/favicon.js
// Aplica o favicon em todas as páginas via JS, evitando repetir a tag
// <link rel="icon"> em cada arquivo HTML.
// ========================================

function aplicarFavicon({ contexto = 'pages' } = {}) {
  const caminhoBase = contexto === 'root'
    ? './assets/images/'
    : '../../assets/images/';

  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = `${caminhoBase}android-chrome-512x512.png`;

  document.head.appendChild(link);
}