// ========================================
// api.js
// Camada única de comunicação com o backend.
// Nenhum outro arquivo deve usar fetch() diretamente.
// ========================================

const API_URL = "http://localhost:3000";

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let resposta;
  try {
    resposta = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  } catch (err) {
    throw new Error(
      "Não foi possível conectar ao servidor. Verifique se a API está rodando.",
    );
  }

  const temCorpo = resposta.status !== 204;
  const dados = temCorpo ? await resposta.json().catch(() => ({})) : {};

  // Sessão derrubada (senha trocada em outro dispositivo, conta excluída ou token expirado):
  // limpa a sessão local e leva para o login. As rotas /auth/ ficam de fora, porque lá o 401
  // significa "email ou senha inválidos", e não "sessão encerrada".
  if (resposta.status === 401 && token && !endpoint.startsWith("/auth/")) {
    if (typeof Auth !== "undefined") Auth.logout();
    throw new Error(dados.error || "Sua sessão expirou. Faça login novamente.");
  }

  if (!resposta.ok) {
    const erro = new Error(dados.error || "Ocorreu um erro na requisição.");
    Object.assign(erro, dados);
    throw erro;
  }

  return dados;
}

// ----------------------------------------
// Autenticação
// ----------------------------------------
const AuthAPI = {
  login: (ds_email, ds_senha) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ ds_email, ds_senha }),
    }),

  cadastrar: (nm_usuario, ds_email, ds_senha) =>
    apiRequest("/auth/cadastrar", {
      method: "POST",
      body: JSON.stringify({ nm_usuario, ds_email, ds_senha }),
    }),

  verificarCodigo: (ds_email, codigo) =>
    apiRequest("/auth/verificar", {
      method: "POST",
      body: JSON.stringify({ ds_email, codigo }),
    }),

  reenviarCodigo: (ds_email) =>
    apiRequest("/auth/reenviar-codigo", {
      method: "POST",
      body: JSON.stringify({ ds_email }),
    }),

  esqueciSenha: (ds_email) =>
    apiRequest("/auth/esqueci-senha", {
      method: "POST",
      body: JSON.stringify({ ds_email }),
    }),

  redefinirSenha: (ds_email, codigo, nova_senha) =>
    apiRequest("/auth/redefinir-senha", {
      method: "POST",
      body: JSON.stringify({ ds_email, codigo, nova_senha }),
    }),
};

// ----------------------------------------
// Filmes
// ordem: padrao | maior_nota | menor_nota | lancamento_recentes | lancamento_antigos | titulo
// Resposta: { data, pagination, ordenacao } — ordenacao: 'padrao' | 'global' | 'pagina'
// ----------------------------------------
const FilmesAPI = {
  populares: (page = 1, ordem = "padrao") =>
    apiRequest(`/filmes/populares?page=${page}&ordem=${encodeURIComponent(ordem)}`),

  porGenero: (genero, page = 1, ordem = "padrao") =>
    apiRequest(
      `/filmes/genero?nome=${encodeURIComponent(genero)}&page=${page}&ordem=${encodeURIComponent(ordem)}`,
    ),

  buscar: (termo, page = 1, ordem = "padrao") =>
    apiRequest(
      `/filmes/buscar?q=${encodeURIComponent(termo)}&page=${page}&ordem=${encodeURIComponent(ordem)}`,
    ),
};

// ----------------------------------------
// Gêneros
// ----------------------------------------
const GenerosAPI = {
  listar: () => apiRequest("/generos"),
};

// ----------------------------------------
// Avaliações
// ----------------------------------------
const AvaliacoesAPI = {
  criar: (id_filme, nr_nota, ds_comentario) =>
    apiRequest("/avaliacoes", {
      method: "POST",
      body: JSON.stringify({ id_filme, nr_nota, ds_comentario }),
    }),

  listarMinhas: () => apiRequest("/avaliacoes/minhas"),

  editar: (id_avaliacao, nr_nota, ds_comentario) =>
    apiRequest(`/avaliacoes/${id_avaliacao}`, {
      method: "PUT",
      body: JSON.stringify({ nr_nota, ds_comentario }),
    }),

  deletar: (id_avaliacao) =>
    apiRequest(`/avaliacoes/${id_avaliacao}`, { method: "DELETE" }),
};

// ----------------------------------------
// Listas
// ----------------------------------------
const ListasAPI = {
  criar: (nm_lista, ds_lista, is_visibilidade) =>
    apiRequest("/listas", {
      method: "POST",
      body: JSON.stringify({ nm_lista, ds_lista, is_visibilidade }),
    }),

  listarMinhas: () => apiRequest("/listas"),

  editar: (id_lista, nm_lista, ds_lista, is_visibilidade) =>
    apiRequest(`/listas/${id_lista}`, {
      method: "PUT",
      body: JSON.stringify({ nm_lista, ds_lista, is_visibilidade }),
    }),

  deletar: (id_lista) =>
    apiRequest(`/listas/${id_lista}`, { method: "DELETE" }),

  adicionarFilme: (id_lista, id_filme) =>
    apiRequest("/listas/filmes", {
      method: "POST",
      body: JSON.stringify({ id_lista, id_filme }),
    }),

  // Resposta: { lista, is_dono, duracoes_pendentes, filmes: [...] }
  verFilmes: (id_lista) => apiRequest(`/listas/${id_lista}/filmes`),

  removerFilme: (id_lista, id_filme) =>
    apiRequest(`/listas/${id_lista}/filmes/${id_filme}`, { method: "DELETE" }),

};

// ----------------------------------------
// Ranking
// ----------------------------------------
const RankingAPI = {
  ver: (limit = 10) => apiRequest(`/ranking?limit=${limit}`),
};

// ----------------------------------------
// Usuários (perfil, bio, foto e configurações da conta)
// ----------------------------------------
const UsuariosAPI = {
  me: () => apiRequest("/usuarios/me"),

  atualizarBio: (ds_bio) =>
    apiRequest("/usuarios/bio", {
      method: "PUT",
      body: JSON.stringify({ ds_bio }),
    }),

  atualizarFoto: (ds_foto) =>
    apiRequest("/usuarios/foto", {
      method: "PUT",
      body: JSON.stringify({ ds_foto }),
    }),

  removerFoto: () => apiRequest("/usuarios/foto", { method: "DELETE" }),

  // Histórico de avaliações paginado por offset.
  // ordem: recentes | antigas | maior_nota | menor_nota | titulo
  // Resposta: { data: [...], pagination: { total, limit, offset, hasMore } }
  minhasAvaliacoes: ({ limit = 10, offset = 0, ordem = "recentes" } = {}) =>
    apiRequest(
      `/usuarios/me/avaliacoes?limit=${limit}&offset=${offset}&ordem=${encodeURIComponent(ordem)}`,
    ),

  // Listas do usuário, cada uma com total_filmes
  minhasListas: () => apiRequest("/usuarios/me/listas"),

  // Todas as rotas abaixo devolvem { message, token } (exceto reenviar e excluir),
  // e o token novo deve ser salvo com Auth.salvarSessao().
  atualizarNome: (nm_usuario) =>
    apiRequest("/usuarios/nome", {
      method: "PUT",
      body: JSON.stringify({ nm_usuario }),
    }),

  alterarSenha: (senha_atual, nova_senha) =>
    apiRequest("/usuarios/senha", {
      method: "PUT",
      body: JSON.stringify({ senha_atual, nova_senha }),
    }),

  solicitarTrocaEmail: (novo_email, senha_atual) =>
    apiRequest("/usuarios/email/solicitar", {
      method: "POST",
      body: JSON.stringify({ novo_email, senha_atual }),
    }),

  reenviarCodigoEmail: () =>
    apiRequest("/usuarios/email/reenviar", {
      method: "POST",
      body: JSON.stringify({}),
    }),

  confirmarTrocaEmail: (codigo) =>
    apiRequest("/usuarios/email/confirmar", {
      method: "POST",
      body: JSON.stringify({ codigo }),
    }),

  excluirConta: (senha_atual) =>
    apiRequest("/usuarios", {
      method: "DELETE",
      body: JSON.stringify({ senha_atual }),
    }),
};
