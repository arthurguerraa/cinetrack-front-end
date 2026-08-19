// ========================================
// auth.js
// Gerenciamento da sessão do usuário no frontend.
// Depende de api.js já estar carregado antes deste arquivo.
// ========================================

const Auth = {
  salvarSessao(token) {
    localStorage.setItem('token', token);

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
    window.location.href = caminhoLogin || this._caminhoLogin();
  },

  /**
   * @param {string} [caminhoLogin] - mesma lógica do logout(). As páginas
   *   protegidas (listas.html, perfil.html) já ficam dentro de src/pages/,
   *   então continuam podendo chamar isso sem argumento normalmente.
   */
  protegerPagina(caminhoLogin) {
    if (!this.estaLogado()) {
      window.location.href = caminhoLogin || this._caminhoLogin();
    }
  },
};