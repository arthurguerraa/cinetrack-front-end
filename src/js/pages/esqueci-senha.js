// ========================================
// src/js/pages/esqueci-senha.js
// Lógica da tela de solicitar recuperação de senha.
// Depende de api.js, auth.js e main.js já carregados antes deste arquivo.
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-esqueci-senha');
  const btnEnviar = document.getElementById('btn-enviar');
  const campoEmail = document.getElementById('email');

  const erroEmail = document.getElementById('erro-email');
  const erroGeral = document.getElementById('erro-geral');

  if (Auth.estaLogado()) {
    window.location.href = '../../index.html';
    return;
  }

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    limparErro(erroEmail);
    limparErro(erroGeral);

    const email = campoEmail.value.trim();

    if (!email) {
      exibirErro(erroEmail, 'Digite seu email.');
      return;
    }

    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Enviando...';

    try {
      await AuthAPI.esqueciSenha(email);
      window.location.href = `redefinir-senha.html?email=${encodeURIComponent(email)}`;
    } catch (err) {
      exibirErro(erroGeral, err.message);
    } finally {
      btnEnviar.disabled = false;
      btnEnviar.textContent = 'Enviar código';
    }
  });
});