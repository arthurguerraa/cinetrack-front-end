// ========================================
// main.js
// Lógica compartilhada entre páginas.
// Depende de api.js e auth.js já carregados antes deste arquivo.
// ========================================

/**
 * Mostra a foto do usuário nos avatares do header (desktop e mobile),
 * ou volta para o ícone placeholder quando não há foto.
 * Também é chamada pelo perfil.js depois de trocar/remover a foto.
 */
function aplicarFotoNoHeader(foto) {
  document.querySelectorAll('.header-avatar').forEach((el) => {
    const img = el.querySelector('.avatar-foto');
    const placeholder = el.querySelector('.avatar-placeholder');
    if (!img || !placeholder) return;

    if (foto) {
      img.src = foto;
      img.classList.remove('hidden');
      placeholder.classList.add('hidden');
    } else {
      img.removeAttribute('src');
      img.classList.add('hidden');
      placeholder.classList.remove('hidden');
    }
  });
}

/**
 * Monta o estado do header (login/logout) em qualquer página que use o
 * componente header.js. Como o menu mobile duplica os mesmos elementos
 * (avatar, botão de sair), usamos classes em vez de ids e
 * aplicamos a mudança em todas as ocorrências de uma vez.
 */
function montarHeader() {
  const areasLogado = document.querySelectorAll('.header-logado');
  const areasDeslogado = document.querySelectorAll('.header-deslogado');
  const avatarEls = document.querySelectorAll('.header-avatar');
  const botoesLogout = document.querySelectorAll('.header-btn-logout');

  if (areasLogado.length === 0 && areasDeslogado.length === 0) return; // página não usa o header

  const mostrar = (el) => { el.classList.remove('hidden'); el.classList.add('flex'); };
  const esconder = (el) => { el.classList.add('hidden'); el.classList.remove('flex'); };

  if (Auth.estaLogado()) {
    const usuario = Auth.usuarioAtual();
    areasLogado.forEach(mostrar);
    areasDeslogado.forEach(esconder);

    if (usuario) {
      avatarEls.forEach((el) => {
        el.setAttribute('title', `Perfil de ${usuario.nm_usuario}`);
        // No mobile o texto "Meu perfil" já descreve o link, então só o
        // avatar desktop (que é um <a>) recebe aria-label.
        if (el.tagName === 'A') el.setAttribute('aria-label', `Perfil de ${usuario.nm_usuario}`);
      });
    }

    // mostra a foto que já temos e, se ainda não buscamos no servidor
    // nesta sessão, busca agora e atualiza
    aplicarFotoNoHeader(Auth.fotoAtual());
    if (!Auth.fotoSincronizada()) {
      Auth.sincronizarFoto().then(() => aplicarFotoNoHeader(Auth.fotoAtual()));
    }
  } else {
    areasLogado.forEach(esconder);
    areasDeslogado.forEach(mostrar);
  }

  botoesLogout.forEach((btn) => {
    btn.addEventListener('click', () => Auth.logout());
  });
}

/**
 * Liga o botão de mostrar/esconder senha a um campo de senha.
 * Espera que o botão tenha dois ícones internos, com as classes
 * '.icone-mostrar' (olho aberto, visível por padrão) e '.icone-esconder'
 * (olho riscado, escondido por padrão) — ver exemplo de HTML no login.html.
 */
function configurarToggleSenha(idCampo, idBotao) {
  const campo = document.getElementById(idCampo);
  const botao = document.getElementById(idBotao);
  if (!campo || !botao) return;

  const iconeMostrar = botao.querySelector('.icone-mostrar');
  const iconeEsconder = botao.querySelector('.icone-esconder');

  botao.addEventListener('click', () => {
    const estaEscondida = campo.type === 'password';

    campo.type = estaEscondida ? 'text' : 'password';
    iconeMostrar.classList.toggle('hidden', estaEscondida);
    iconeEsconder.classList.toggle('hidden', !estaEscondida);
    botao.setAttribute('aria-label', estaEscondida ? 'Esconder senha' : 'Mostrar senha');
  });
}

function formatarAno(ano) {
  return ano ? String(ano) : 'Ano desconhecido';
}

function formatarNota(nota) {
  const numero = parseFloat(nota);
  return Number.isFinite(numero) && numero > 0 ? numero.toFixed(1) : '—';
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