// ========================================
// main.js
// Lógica compartilhada entre páginas.
// Depende de api.js e auth.js já carregados antes deste arquivo.
// ========================================

/**
 * Monta o estado do header (login/logout) em qualquer página que use o
 * componente header.js. Como o menu mobile duplica os mesmos elementos
 * (nome do usuário, botão de sair), usamos classes em vez de ids e
 * aplicamos a mudança em todas as ocorrências de uma vez.
 */
function montarHeader() {
  const areasLogado = document.querySelectorAll('.header-logado');
  const areasDeslogado = document.querySelectorAll('.header-deslogado');
  const nomeUsuarioEls = document.querySelectorAll('.header-nome-usuario');
  const botoesLogout = document.querySelectorAll('.header-btn-logout');

  if (areasLogado.length === 0 && areasDeslogado.length === 0) return; // página não usa o header

  const mostrar = (el) => { el.classList.remove('hidden'); el.classList.add('flex'); };
  const esconder = (el) => { el.classList.add('hidden'); el.classList.remove('flex'); };

  if (Auth.estaLogado()) {
    const usuario = Auth.usuarioAtual();
    areasLogado.forEach(mostrar);
    areasDeslogado.forEach(esconder);
    if (usuario) {
      nomeUsuarioEls.forEach((el) => { el.textContent = usuario.nm_usuario; });
    }
  } else {
    areasLogado.forEach(esconder);
    areasDeslogado.forEach(mostrar);
  }

  botoesLogout.forEach((btn) => {
    btn.addEventListener('click', () => Auth.logout());
  });
}

function formatarAno(ano) {
  return ano ? String(ano) : 'Ano desconhecido';
}

function formatarNota(nota) {
  const numero = parseFloat(nota);
  return Number.isFinite(numero) ? numero.toFixed(1) : '—';
}

function truncarTexto(texto, limite = 140) {
  if (!texto || texto.length <= limite) return texto || '';
  const cortado = texto.slice(0, limite);
  return cortado.slice(0, cortado.lastIndexOf(' ')) + '…';
}

function exibirErro(elementoOuId, mensagem) {
  const el = typeof elementoOuId === 'string'
    ? document.getElementById(elementoOuId)
    : elementoOuId;

  if (!el) return;
  el.textContent = mensagem;
  el.classList.remove('hidden');
}

function limparErro(elementoOuId) {
  const el = typeof elementoOuId === 'string'
    ? document.getElementById(elementoOuId)
    : elementoOuId;

  if (!el) return;
  el.textContent = '';
  el.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', montarHeader);