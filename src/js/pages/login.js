// ========================================
// src/js/paginas/login.js
// Lógica da página de login.
// Depende de api.js e auth.js já carregados antes deste arquivo.
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-login');
  const btnEntrar = document.getElementById('btn-entrar');

  const campoEmail = document.getElementById('email');
  const campoSenha = document.getElementById('senha');

  const erroEmail = document.getElementById('erro-email');
  const erroSenha = document.getElementById('erro-senha');
  const erroGeral = document.getElementById('erro-geral');

  // se o usuário já está logado, não faz sentido ver a tela de login de novo
  if (Auth.estaLogado()) {
    window.location.href = '../../index.html';
    return;
  }

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    limparErro(erroEmail);
    limparErro(erroSenha);
    limparErro(erroGeral);

    const email = campoEmail.value.trim();
    const senha = campoSenha.value;

    let temErro = false;

    if (!email) {
      exibirErro(erroEmail, 'Digite seu email.');
      temErro = true;
    }

    if (!senha) {
      exibirErro(erroSenha, 'Digite sua senha.');
      temErro = true;
    }

    if (temErro) return;

    btnEntrar.disabled = true;
    btnEntrar.textContent = 'Entrando...';

    try {
      const resposta = await AuthAPI.login(email, senha);
      Auth.salvarSessao(resposta.token);
      window.location.href = '../../index.html';
    } catch (err) {
      exibirErro(erroGeral, err.message);
    } finally {
      btnEntrar.disabled = false;
      btnEntrar.textContent = 'Entrar';
    }
  });
});