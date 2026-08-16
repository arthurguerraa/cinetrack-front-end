// ========================================
// src/js/pages/redefinir-senha.js
// Lógica da tela de redefinição de senha.
// Depende de api.js, auth.js e main.js já carregados antes deste arquivo.
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-redefinir');
  const btnRedefinir = document.getElementById('btn-redefinir');
  const btnReenviar = document.getElementById('btn-reenviar');

  const digitos = Array.from(document.querySelectorAll('.digito-codigo'));
  const emailDestino = document.getElementById('email-destino');

  const campoNovaSenha = document.getElementById('nova-senha');
  const campoConfirmarNovaSenha = document.getElementById('confirmar-nova-senha');

  const erroCodigo = document.getElementById('erro-codigo');
  const erroNovaSenha = document.getElementById('erro-nova-senha');
  const erroConfirmarNovaSenha = document.getElementById('erro-confirmar-nova-senha');
  const erroGeral = document.getElementById('erro-geral');
  const avisoReenvio = document.getElementById('aviso-reenvio');

  if (Auth.estaLogado()) {
    window.location.href = '../../index.html';
    return;
  }

  const parametros = new URLSearchParams(window.location.search);
  const email = parametros.get('email');

  if (!email) {
    window.location.href = 'esqueci-senha.html';
    return;
  }

  emailDestino.textContent = email;

  // ----------------------------------------
  // Navegação automática entre os campos do código
  // ----------------------------------------
  digitos.forEach((campo, index) => {
    campo.addEventListener('input', () => {
      campo.value = campo.value.replace(/\D/g, '').slice(0, 1);
      if (campo.value && index < digitos.length - 1) {
        digitos[index + 1].focus();
      }
    });

    campo.addEventListener('keydown', (evento) => {
      if (evento.key === 'Backspace' && !campo.value && index > 0) {
        digitos[index - 1].focus();
        digitos[index - 1].value = '';
      }
      if (evento.key === 'ArrowLeft' && index > 0) {
        digitos[index - 1].focus();
      }
      if (evento.key === 'ArrowRight' && index < digitos.length - 1) {
        digitos[index + 1].focus();
      }
    });

    campo.addEventListener('paste', (evento) => {
      evento.preventDefault();
      const texto = (evento.clipboardData || window.clipboardData).getData('text');
      const numeros = texto.replace(/\D/g, '').slice(0, 6).split('');

      numeros.forEach((numero, i) => {
        if (digitos[i]) digitos[i].value = numero;
      });

      const proximoVazio = digitos.findIndex((d) => !d.value);
      (proximoVazio === -1 ? digitos[digitos.length - 1] : digitos[proximoVazio]).focus();
    });
  });

  function obterCodigo() {
    return digitos.map((d) => d.value).join('');
  }

  function limparCampos() {
    digitos.forEach((d) => (d.value = ''));
    digitos[0].focus();
  }

  digitos[0].focus();

  // ----------------------------------------
  // Envio do formulário
  // ----------------------------------------
  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    limparErro(erroCodigo);
    limparErro(erroNovaSenha);
    limparErro(erroConfirmarNovaSenha);
    limparErro(erroGeral);
    limparErro(avisoReenvio);

    const codigo = obterCodigo();
    const novaSenha = campoNovaSenha.value;
    const confirmarNovaSenha = campoConfirmarNovaSenha.value;

    let temErro = false;

    if (codigo.length !== 6) {
      exibirErro(erroCodigo, 'Preencha os 6 dígitos do código.');
      temErro = true;
    }

    if (!novaSenha) {
      exibirErro(erroNovaSenha, 'Crie uma nova senha.');
      temErro = true;
    } else if (novaSenha.length < 6) {
      exibirErro(erroNovaSenha, 'A senha precisa ter pelo menos 6 caracteres.');
      temErro = true;
    }

    if (novaSenha && confirmarNovaSenha && novaSenha !== confirmarNovaSenha) {
      exibirErro(erroConfirmarNovaSenha, 'As senhas não coincidem.');
      temErro = true;
    }

    if (temErro) return;

    btnRedefinir.disabled = true;
    btnRedefinir.textContent = 'Redefinindo...';

    try {
      const resposta = await AuthAPI.redefinirSenha(email, codigo, novaSenha);
      Auth.salvarSessao(resposta.token);
      window.location.href = '../../index.html';
    } catch (err) {
      exibirErro(erroGeral, err.message);
      limparCampos();
    } finally {
      btnRedefinir.disabled = false;
      btnRedefinir.textContent = 'Redefinir senha';
    }
  });

  btnReenviar.addEventListener('click', async () => {
    limparErro(erroGeral);
    limparErro(avisoReenvio);

    btnReenviar.disabled = true;
    btnReenviar.textContent = 'Enviando...';

    try {
      await AuthAPI.esqueciSenha(email);
      exibirErro(avisoReenvio, 'Novo código enviado! Confira seu email.');
      limparCampos();
    } catch (err) {
      exibirErro(erroGeral, err.message);
    } finally {
      btnReenviar.disabled = false;
      btnReenviar.textContent = 'Reenviar';
    }
  });
});