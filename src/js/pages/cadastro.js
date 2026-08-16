// ========================================
// src/js/pages/cadastro.js
// Lógica da página de cadastro.
// Depende de api.js e auth.js já carregados antes deste arquivo.
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-cadastro');
  const btnCadastrar = document.getElementById('btn-cadastrar');

  const campoNome = document.getElementById('nome');
  const campoEmail = document.getElementById('email');
  const campoSenha = document.getElementById('senha');
  const campoConfirmarSenha = document.getElementById('confirmar-senha');

  const erroNome = document.getElementById('erro-nome');
  const erroEmail = document.getElementById('erro-email');
  const erroSenha = document.getElementById('erro-senha');
  const erroConfirmarSenha = document.getElementById('erro-confirmar-senha');
  const erroGeral = document.getElementById('erro-geral');

  if (Auth.estaLogado()) {
    window.location.href = '../../index.html';
    return;
  }

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    limparErro(erroNome);
    limparErro(erroEmail);
    limparErro(erroSenha);
    limparErro(erroConfirmarSenha);
    limparErro(erroGeral);

    const nome = campoNome.value.trim();
    const email = campoEmail.value.trim();
    const senha = campoSenha.value;
    const confirmarSenha = campoConfirmarSenha.value;

    let temErro = false;

    if (!nome) {
      exibirErro(erroNome, 'Digite seu nome.');
      temErro = true;
    }

    if (!email) {
      exibirErro(erroEmail, 'Digite seu email.');
      temErro = true;
    }

    if (!senha) {
      exibirErro(erroSenha, 'Crie uma senha.');
      temErro = true;
    } else if (senha.length < 6) {
      exibirErro(erroSenha, 'A senha precisa ter pelo menos 6 caracteres.');
      temErro = true;
    }

    if (senha && confirmarSenha && senha !== confirmarSenha) {
      exibirErro(erroConfirmarSenha, 'As senhas não coincidem.');
      temErro = true;
    }

    if (temErro) return;

    btnCadastrar.disabled = true;
    btnCadastrar.textContent = 'Criando conta...';

    try {
      await AuthAPI.cadastrar(nome, email, senha);
      // conta criada, mas ainda não verificada — leva para a tela de código,
      // passando o email pela URL para não precisar pedir de novo
      window.location.href = `verificar-email.html?email=${encodeURIComponent(email)}`;
    } catch (err) {
      exibirErro(erroGeral, err.message);
    } finally {
      btnCadastrar.disabled = false;
      btnCadastrar.textContent = 'Criar conta';
    }
  });
});