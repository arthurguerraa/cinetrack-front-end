// ========================================
// auth.js
// Gerenciamento da sessão do usuário no frontend.
// Depende de api.js já estar carregado antes deste arquivo.
// ========================================

const Auth = {
  /**
   * Salva o token e os dados básicos do usuário após login/cadastro bem-sucedido.
   */
  salvarSessao(token) {
    localStorage.setItem('token', token);

    // o token JWT tem 3 partes separadas por ponto: header.payload.assinatura
    // decodifica a parte do meio (payload) para extrair id e nome sem nova chamada à API
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      localStorage.setItem('usuario', JSON.stringify({
        id_usuario: payload.id_usuario,
        nm_usuario: payload.nm_usuario,
      }));
    } catch (err) {
      console.error('Não foi possível decodificar o token.', err);
    }
  },

  /**
   * Retorna true se existe um token salvo.
   * Não valida se o token ainda é válido no backend — apenas se existe localmente.
   */
  estaLogado() {
    return Boolean(localStorage.getItem('token'));
  },

  /**
   * Retorna os dados do usuário logado (id, nome) ou null.
   */
  usuarioAtual() {
    const dados = localStorage.getItem('usuario');
    return dados ? JSON.parse(dados) : null;
  },

  /**
   * Limpa a sessão e redireciona para o login.
   * caminhoLogin deve ser o caminho relativo até login.html a partir da página atual.
   */
  logout(caminhoLogin = 'login.html') {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = caminhoLogin;
  },

  /**
   * Chama isso no topo de páginas que exigem login (ex: listas.html).
   * Se não houver sessão, redireciona antes mesmo da página carregar de fato.
   */
  protegerPagina(caminhoLogin = 'login.html') {
    if (!this.estaLogado()) {
      window.location.href = caminhoLogin;
    }
  },
};