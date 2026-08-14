// ========================================
// api.js
// Camada única de comunicação com o backend.
// Nenhum outro arquivo deve usar fetch() diretamente.
// ========================================

const API_URL = 'http://localhost:3000';

/**
 * Função base — todas as chamadas à API passam por aqui.
 * Cuida de: montar a URL, anexar o token (se existir), tratar erro padrão.
 */
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let resposta;
  try {
    resposta = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  } catch (err) {
    // erro de rede (backend fora do ar, sem conexão, etc.)
    throw new Error('Não foi possível conectar ao servidor. Verifique se a API está rodando.');
  }

  // DELETE bem-sucedido às vezes não retorna corpo — trata isso antes do .json()
  const temCorpo = resposta.status !== 204;
  const dados = temCorpo ? await resposta.json().catch(() => ({})) : {};

  if (!resposta.ok) {
    throw new Error(dados.error || 'Ocorreu um erro na requisição.');
  }

  return dados;
}

// ----------------------------------------
// Autenticação
// ----------------------------------------
const AuthAPI = {
  login: (ds_email, ds_senha) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ ds_email, ds_senha }),
    }),

  cadastrar: (nm_usuario, ds_email, ds_senha) =>
    apiRequest('/auth/cadastrar', {
      method: 'POST',
      body: JSON.stringify({ nm_usuario, ds_email, ds_senha }),
    }),
};

// ----------------------------------------
// Filmes
// ----------------------------------------
const FilmesAPI = {
  buscar: (termo) =>
    apiRequest(`/filmes/buscar?q=${encodeURIComponent(termo)}`),

  listar: (genero) =>
    apiRequest(`/filmes${genero ? `?genero=${encodeURIComponent(genero)}` : ''}`),
};

// ----------------------------------------
// Gêneros
// ----------------------------------------
const GenerosAPI = {
  listar: () => apiRequest('/generos'),
};

// ----------------------------------------
// Avaliações
// ----------------------------------------
const AvaliacoesAPI = {
  criar: (id_filme, nr_nota, ds_comentario) =>
    apiRequest('/avaliacoes', {
      method: 'POST',
      body: JSON.stringify({ id_filme, nr_nota, ds_comentario }),
    }),

  editar: (id_avaliacao, nr_nota, ds_comentario) =>
    apiRequest(`/avaliacoes/${id_avaliacao}`, {
      method: 'PUT',
      body: JSON.stringify({ nr_nota, ds_comentario }),
    }),

  deletar: (id_avaliacao) =>
    apiRequest(`/avaliacoes/${id_avaliacao}`, { method: 'DELETE' }),
};

// ----------------------------------------
// Listas
// ----------------------------------------
const ListasAPI = {
  criar: (nm_lista, ds_lista, is_visibilidade) =>
    apiRequest('/listas', {
      method: 'POST',
      body: JSON.stringify({ nm_lista, ds_lista, is_visibilidade }),
    }),

  listarMinhas: () => apiRequest('/listas'),

  editar: (id_lista, nm_lista, ds_lista, is_visibilidade) =>
    apiRequest(`/listas/${id_lista}`, {
      method: 'PUT',
      body: JSON.stringify({ nm_lista, ds_lista, is_visibilidade }),
    }),

  deletar: (id_lista) =>
    apiRequest(`/listas/${id_lista}`, { method: 'DELETE' }),

  adicionarFilme: (id_lista, id_filme) =>
    apiRequest('/listas/filmes', {
      method: 'POST',
      body: JSON.stringify({ id_lista, id_filme }),
    }),

  verFilmes: (id_lista) =>
    apiRequest(`/listas/${id_lista}/filmes`),
};

// ----------------------------------------
// Ranking
// ----------------------------------------
const RankingAPI = {
  ver: (limit = 10) => apiRequest(`/ranking?limit=${limit}`),
};