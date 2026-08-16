// ========================================
// src/js/pages/verificar-email.js
// Lógica da tela de verificação de código.
// Depende de api.js, auth.js e main.js já carregados antes deste arquivo.
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-verificar');
  const btnVerificar = document.getElementById('btn-verificar');
  const btnReenviar = document.getElementById('btn-reenviar');

  const digitos = Array.from(document.querySelectorAll('.digito-codigo'));
  const emailDestino = document.getElementById('email-destino');

  const erroCodigo = document.getElementById('erro-codigo');
  const erroGeral = document.getElementById('erro-geral');
  const avisoReenvio = document.getElementById('aviso-reenvio');

  if (Auth.estaLogado()) {
    window.location.href = '../../index.html';
    return;
  }

  const parametros = new URLSearchParams(window.location.search);
  const email = parametros.get('email');

  if (!email) {
    window.location.href = 'cadastro.html';
    return;
  }

  emailDestino.textContent = email;

  // ----------------------------------------
  // Navegação automática entre os campos
  // ----------------------------------------
  digitos.forEach((campo, index) => {
    campo.addEventListener('input', () => {
      // aceita só dígito, descarta qualquer outro caractere
      campo.value = campo.value.replace(/\D/g, '').slice(0, 1);

      if (campo.value && index < digitos.length - 1) {
        digitos[index + 1].focus();
      }
    });

    campo.addEventListener('keydown', (evento) => {
      // backspace num campo vazio volta pro campo anterior e limpa ele
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

    // permite colar o código de 6 dígitos inteiro em qualquer campo
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
    limparErro(erroGeral);
    limparErro(avisoReenvio);

    const codigo = obterCodigo();

    if (codigo.length !== 6) {
      exibirErro(erroCodigo, 'Preencha os 6 dígitos do código.');
      return;
    }

    btnVerificar.disabled = true;
    btnVerificar.textContent = 'Confirmando...';

    try {
      const resposta = await AuthAPI.verificarCodigo(email, codigo);
      Auth.salvarSessao(resposta.token);
      window.location.href = '../../index.html';
    } catch (err) {
      exibirErro(erroGeral, err.message);
      limparCampos();
    } finally {
      btnVerificar.disabled = false;
      btnVerificar.textContent = 'Confirmar';
    }
  });

  btnReenviar.addEventListener('click', async () => {
    limparErro(erroGeral);
    limparErro(avisoReenvio);

    btnReenviar.disabled = true;
    btnReenviar.textContent = 'Enviando...';

    try {
      await AuthAPI.reenviarCodigo(email);
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