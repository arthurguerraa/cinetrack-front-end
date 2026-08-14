// ========================================
// main.js
// Lógica compartilhada entre páginas.
// Depende de api.js e auth.js já carregados antes deste arquivo.
// ========================================

/**
 * Monta o estado do header (login/logout) em qualquer página que tenha
 * os elementos com esses IDs. Se a página não tiver, a função não faz nada
 * — então é seguro chamar em toda página sem precisar checar antes.
 */
function montarHeader() {
  const areaLogado = document.getElementById('header-logado');
  const areaDeslogado = document.getElementById('header-deslogado');
  const nomeUsuarioEl = document.getElementById('header-nome-usuario');
  const btnLogout = document.getElementById('header-btn-logout');

  if (!areaLogado && !areaDeslogado) return; // página não usa esse componente

  if (Auth.estaLogado()) {
    const usuario = Auth.usuarioAtual();
    if (areaLogado) areaLogado.classList.remove('hidden');
    if (areaDeslogado) areaDeslogado.classList.add('hidden');
    if (nomeUsuarioEl && usuario) nomeUsuarioEl.textContent = usuario.nm_usuario;
  } else {
    if (areaLogado) areaLogado.classList.add('hidden');
    if (areaDeslogado) areaDeslogado.classList.remove('hidden');
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => Auth.logout());
  }
}

/**
 * Formata o campo dt_lancamento (que no banco é só o ano) para exibição.
 * Mantido como função separada caso o formato mude no futuro.
 */
function formatarAno(ano) {
  return ano ? String(ano) : 'Ano desconhecido';
}

/**
 * Formata uma nota numérica (ex: "7.7" vindo como string do banco) para
 * sempre exibir com uma casa decimal.
 */
function formatarNota(nota) {
  const numero = parseFloat(nota);
  return Number.isFinite(numero) ? numero.toFixed(1) : '—';
}

/**
 * Trunca um texto longo (ex: sinopse) até um limite de caracteres,
 * adicionando reticências. Não corta no meio de uma palavra.
 */
function truncarTexto(texto, limite = 140) {
  if (!texto || texto.length <= limite) return texto || '';
  const cortado = texto.slice(0, limite);
  return cortado.slice(0, cortado.lastIndexOf(' ')) + '…';
}

/**
 * Exibe uma mensagem de erro em um elemento específico da página.
 * Espera um elemento com a classe já preparada para receber texto (ver login.html).
 */
function exibirErro(elementoOuId, mensagem) {
  const el = typeof elementoOuId === 'string'
    ? document.getElementById(elementoOuId)
    : elementoOuId;

  if (!el) return;
  el.textContent = mensagem;
  el.classList.remove('hidden');
}

/**
 * Esconde e limpa uma mensagem de erro.
 */
function limparErro(elementoOuId) {
  const el = typeof elementoOuId === 'string'
    ? document.getElementById(elementoOuId)
    : elementoOuId;

  if (!el) return;
  el.textContent = '';
  el.classList.add('hidden');
}

// roda automaticamente em toda página que carregar este script
document.addEventListener('DOMContentLoaded', montarHeader);