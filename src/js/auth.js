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

  logout(caminhoLogin = 'login.html') {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = caminhoLogin;
  },

  protegerPagina(caminhoLogin = 'login.html') {
    if (!this.estaLogado()) {
      window.location.href = caminhoLogin;
    }
  },
};