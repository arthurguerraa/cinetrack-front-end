// ========================================
// src/js/pages/login.js
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

  if (Auth.estaLogado()) {
    window.location.href = '../../index.html';
    return;
  }

  const parametros = new URLSearchParams(window.location.search);
  if (parametros.get('cadastro') === 'sucesso') {
    const avisoSucesso = document.getElementById('aviso-sucesso');
    if (avisoSucesso) avisoSucesso.classList.remove('hidden');
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
      if (err.emailNaoVerificado) {
        // manda direto para a tela de código, já com o email preenchido
        window.location.href = `verificar-email.html?email=${encodeURIComponent(email)}`;
        return;
      }
      exibirErro(erroGeral, err.message);
    } finally {
      btnEntrar.disabled = false;
      btnEntrar.textContent = 'Entrar';
    }
  });
});