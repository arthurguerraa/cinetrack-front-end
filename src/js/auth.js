// ========================================
// auth.js
// Gerenciamento da sessão do usuário no frontend.
// Depende de api.js já estar carregado antes deste arquivo.
// ========================================

const Auth = {
  _promessaFoto: null,

  /**
   * @param {string} token
   * @param {Object} [opcoes]
   * @param {boolean} [opcoes.manterFoto] - true quando é o MESMO usuário com um
   *   token renovado (troca de nome/senha/email). Em login/cadastro (sessão nova)
   *   a foto em cache é descartada e buscada de novo.
   */
  salvarSessao(token, { manterFoto = false } = {}) {
    localStorage.setItem('token', token);
    if (!manterFoto) localStorage.removeItem('foto');

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      localStorage.setItem('usuario', JSON.stringify({
        id_usuario: payload.id_usuario,
        nm_usuario: payload.nm_usuario,
        ds_email: payload.ds_email,
      }));
    } catch (err) {
      console.error('Não foi possível decodificar o token.', err);
    }
  },

  estaLogado() {
    return Boolean(localStorage.getItem('token'));
  },

  usuarioAtual() {
    const dados = localStorage.getItem('usuario');
    return dados ? JSON.parse(dados) : null;
  },

  // ----------------------------------------
  // Foto de perfil
  // ----------------------------------------

  /** Retorna o data URL da foto, ou null se o usuário não tem foto. */
  fotoAtual() {
    return localStorage.getItem('foto') || null;
  },

  /** true se já buscamos a foto no servidor nesta sessão (mesmo que não exista). */
  fotoSincronizada() {
    return localStorage.getItem('foto') !== null;
  },

  /** Guarda a foto localmente. Passe '' ou null para "sem foto". */
  salvarFoto(foto) {
    try {
      localStorage.setItem('foto', foto || '');
    } catch (err) {
      console.error('Não foi possível guardar a foto localmente.', err);
    }
  },

  /**
   * Busca a foto no servidor e guarda no localStorage.
   * Chamadas simultâneas compartilham a mesma requisição.
   */
  sincronizarFoto() {
    if (!this._promessaFoto) {
      this._promessaFoto = UsuariosAPI.me()
        .then((dados) => this.salvarFoto(dados.ds_foto))
        .catch(() => {})
        .finally(() => { this._promessaFoto = null; });
    }
    return this._promessaFoto;
  },

  /**
   * Calcula o caminho correto até login.html a partir da página atual.
   * O header (e o botão "Sair" dentro dele) aparece tanto na home
   * (raiz do projeto) quanto nas páginas dentro de src/pages/, e o
   * caminho relativo para login.html é diferente em cada caso.
   */
  _caminhoLogin() {
    const estaEmPages = window.location.pathname.includes('/src/pages/');
    return estaEmPages ? 'login.html' : 'src/pages/login.html';
  },

  /**
   * @param {string} [caminhoLogin] - opcional. Se não for informado,
   *   o caminho correto é calculado automaticamente com base na URL atual.
   */
  logout(caminhoLogin) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('foto');
    window.location.href = caminhoLogin || this._caminhoLogin();
  },

  /**
   * @param {string} [caminhoLogin] - mesma lógica do logout(). As páginas
   *   protegidas (listas.html, perfil.html, configuracoes.html) já ficam dentro
   *   de src/pages/, então continuam podendo chamar isso sem argumento normalmente.
   */
  protegerPagina(caminhoLogin) {
    if (!this.estaLogado()) {
      window.location.href = caminhoLogin || this._caminhoLogin();
    }
  },
};