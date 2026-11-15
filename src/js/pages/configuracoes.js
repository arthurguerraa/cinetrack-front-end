// ========================================
// src/js/pages/configuracoes.js
// Lógica da página de configurações da conta:
// editar nome, alterar senha, trocar email (2 passos) e excluir conta.
// Depende de api.js, auth.js e main.js já carregados antes deste arquivo.
// A proteção de rota já rodou no <head> do configuracoes.html.
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  const el = (id) => document.getElementById(id);

  const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ----------------------------------------
  // Elementos
  // ----------------------------------------

  // nome
  const formNome = el('form-nome');
  const campoNome = el('nome');
  const erroNome = el('erro-nome');
  const erroGeralNome = el('erro-geral-nome');
  const sucessoNome = el('sucesso-nome');
  const btnSalvarNome = el('btn-salvar-nome');

  // senha
  const formSenha = el('form-senha');
  const campoSenhaAtual = el('senha-atual');
  const campoNovaSenha = el('nova-senha');
  const campoConfirmarNovaSenha = el('confirmar-nova-senha');
  const erroSenhaAtual = el('erro-senha-atual');
  const erroNovaSenha = el('erro-nova-senha');
  const erroConfirmarNovaSenha = el('erro-confirmar-nova-senha');
  const erroGeralSenha = el('erro-geral-senha');
  const sucessoSenha = el('sucesso-senha');
  const btnSalvarSenha = el('btn-salvar-senha');

  // email — passo 1
  const emailAtual = el('email-atual');
  const formEmailSolicitar = el('form-email-solicitar');
  const campoNovoEmail = el('novo-email');
  const campoSenhaEmail = el('senha-email');
  const erroNovoEmail = el('erro-novo-email');
  const erroSenhaEmail = el('erro-senha-email');
  const erroGeralEmail = el('erro-geral-email');
  const sucessoEmail = el('sucesso-email');
  const btnSolicitarEmail = el('btn-solicitar-email');

  // email — passo 2
  const formEmailConfirmar = el('form-email-confirmar');
  const emailDestino = el('email-destino');
  const digitos = Array.from(document.querySelectorAll('#campos-codigo-email .digito-codigo'));
  const erroCodigoEmail = el('erro-codigo-email');
  const erroGeralConfirmarEmail = el('erro-geral-confirmar-email');
  const avisoReenvioEmail = el('aviso-reenvio-email');
  const btnConfirmarEmail = el('btn-confirmar-email');
  const btnReenviarEmail = el('btn-reenviar-email');
  const btnCancelarEmail = el('btn-cancelar-email');

  // excluir conta
  const btnAbrirExcluir = el('btn-abrir-excluir');
  const modalExcluir = el('modal-excluir');
  const modalExcluirFechar = el('modal-excluir-fechar');
  const modalExcluirCancelar = el('modal-excluir-cancelar');
  const formExcluir = el('form-excluir');
  const campoSenhaExcluir = el('senha-excluir');
  const erroExcluir = el('erro-excluir');
  const btnConfirmarExcluir = el('modal-excluir-confirmar');

  // exibirErro/limparErro (main.js) servem para qualquer mensagem, inclusive as de sucesso
  const exibirAviso = exibirErro;
  const limparAviso = limparErro;

  // ----------------------------------------
  // Utilitários
  // ----------------------------------------
  function carregando(botao, ativo, textoAtivo, textoNormal) {
    botao.disabled = ativo;
    botao.textContent = ativo ? textoAtivo : textoNormal;
  }

  /**
   * Salva o token renovado (nome e email vão dentro do JWT) mantendo a foto em cache,
   * e atualiza na hora o que aparece na tela e no header.
   */
  function atualizarSessao(token) {
    Auth.salvarSessao(token, { manterFoto: true });

    const usuario = Auth.usuarioAtual();
    if (!usuario) return;

    emailAtual.textContent = usuario.ds_email;
    campoNome.value = usuario.nm_usuario;

    document.querySelectorAll('.header-avatar').forEach((avatar) => {
      avatar.setAttribute('title', `Perfil de ${usuario.nm_usuario}`);
      if (avatar.tagName === 'A') avatar.setAttribute('aria-label', `Perfil de ${usuario.nm_usuario}`);
    });
  }

  // ----------------------------------------
  // Nome
  // ----------------------------------------
  formNome.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    limparErro(erroNome);
    limparErro(erroGeralNome);
    limparAviso(sucessoNome);

    const nome = campoNome.value.trim();
    const usuario = Auth.usuarioAtual();

    if (nome.length < 2) {
      exibirErro(erroNome, 'O nome precisa ter pelo menos 2 caracteres.');
      return;
    }

    if (usuario && nome === usuario.nm_usuario) {
      exibirErro(erroNome, 'Esse já é o seu nome.');
      return;
    }

    carregando(btnSalvarNome, true, 'Salvando...', 'Salvar nome');

    try {
      const resposta = await UsuariosAPI.atualizarNome(nome);
      atualizarSessao(resposta.token);
      exibirAviso(sucessoNome, 'Nome atualizado com sucesso!');
    } catch (err) {
      exibirErro(erroGeralNome, err.message);
    } finally {
      carregando(btnSalvarNome, false, '', 'Salvar nome');
    }
  });

  // ----------------------------------------
  // Senha
  // ----------------------------------------
  formSenha.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    limparErro(erroSenhaAtual);
    limparErro(erroNovaSenha);
    limparErro(erroConfirmarNovaSenha);
    limparErro(erroGeralSenha);
    limparAviso(sucessoSenha);

    const senhaAtual = campoSenhaAtual.value;
    const novaSenha = campoNovaSenha.value;
    const confirmar = campoConfirmarNovaSenha.value;

    let temErro = false;

    if (!senhaAtual) {
      exibirErro(erroSenhaAtual, 'Informe sua senha atual.');
      temErro = true;
    }

    if (!novaSenha) {
      exibirErro(erroNovaSenha, 'Crie uma nova senha.');
      temErro = true;
    } else if (novaSenha.length < 6) {
      exibirErro(erroNovaSenha, 'A senha precisa ter pelo menos 6 caracteres.');
      temErro = true;
    } else if (novaSenha === senhaAtual) {
      exibirErro(erroNovaSenha, 'A nova senha precisa ser diferente da atual.');
      temErro = true;
    }

    if (novaSenha && novaSenha !== confirmar) {
      exibirErro(erroConfirmarNovaSenha, 'As senhas não coincidem.');
      temErro = true;
    }

    if (temErro) return;

    carregando(btnSalvarSenha, true, 'Salvando...', 'Alterar senha');

    try {
      const resposta = await UsuariosAPI.alterarSenha(senhaAtual, novaSenha);
      atualizarSessao(resposta.token);
      formSenha.reset();
      exibirAviso(sucessoSenha, 'Senha alterada com sucesso!');
    } catch (err) {
      exibirErro(erroGeralSenha, err.message);
    } finally {
      carregando(btnSalvarSenha, false, '', 'Alterar senha');
    }
  });

  // ----------------------------------------
  // Email — campos do código (OTP de 6 dígitos)
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

  function limparCodigo() {
    digitos.forEach((d) => (d.value = ''));
    digitos[0].focus();
  }

  // ----------------------------------------
  // Email — alternar entre os dois passos
  // ----------------------------------------
  function mostrarPassoSolicitar() {
    formEmailConfirmar.classList.add('hidden');
    formEmailSolicitar.classList.remove('hidden');
  }

  function mostrarPassoConfirmar(novoEmail) {
    emailDestino.textContent = novoEmail;
    limparErro(erroCodigoEmail);
    limparErro(erroGeralConfirmarEmail);
    limparAviso(avisoReenvioEmail);

    formEmailSolicitar.classList.add('hidden');
    formEmailConfirmar.classList.remove('hidden');
    limparCodigo();
  }

  // Passo 1: pede o código para o novo email
  formEmailSolicitar.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    limparErro(erroNovoEmail);
    limparErro(erroSenhaEmail);
    limparErro(erroGeralEmail);
    limparAviso(sucessoEmail);

    const novoEmail = campoNovoEmail.value.trim();
    const senha = campoSenhaEmail.value;
    const usuario = Auth.usuarioAtual();

    let temErro = false;

    if (!novoEmail) {
      exibirErro(erroNovoEmail, 'Informe o novo email.');
      temErro = true;
    } else if (!REGEX_EMAIL.test(novoEmail)) {
      exibirErro(erroNovoEmail, 'Informe um email válido.');
      temErro = true;
    } else if (usuario && novoEmail.toLowerCase() === usuario.ds_email.toLowerCase()) {
      exibirErro(erroNovoEmail, 'Esse já é o email da sua conta.');
      temErro = true;
    }

    if (!senha) {
      exibirErro(erroSenhaEmail, 'Informe sua senha atual.');
      temErro = true;
    }

    if (temErro) return;

    carregando(btnSolicitarEmail, true, 'Enviando...', 'Enviar código');

    try {
      await UsuariosAPI.solicitarTrocaEmail(novoEmail, senha);
      campoSenhaEmail.value = ''; // não deixa a senha parada na tela
      mostrarPassoConfirmar(novoEmail);
    } catch (err) {
      exibirErro(erroGeralEmail, err.message);
    } finally {
      carregando(btnSolicitarEmail, false, '', 'Enviar código');
    }
  });

  // Passo 2: confirma o código
  formEmailConfirmar.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    limparErro(erroCodigoEmail);
    limparErro(erroGeralConfirmarEmail);
    limparAviso(avisoReenvioEmail);

    const codigo = obterCodigo();

    if (codigo.length !== 6) {
      exibirErro(erroCodigoEmail, 'Preencha os 6 dígitos do código.');
      return;
    }

    carregando(btnConfirmarEmail, true, 'Confirmando...', 'Confirmar troca');

    try {
      const resposta = await UsuariosAPI.confirmarTrocaEmail(codigo);
      atualizarSessao(resposta.token);

      formEmailSolicitar.reset();
      mostrarPassoSolicitar();
      exibirAviso(sucessoEmail, 'Email alterado com sucesso!');
    } catch (err) {
      exibirErro(erroGeralConfirmarEmail, err.message);
      limparCodigo();
    } finally {
      carregando(btnConfirmarEmail, false, '', 'Confirmar troca');
    }
  });

  btnReenviarEmail.addEventListener('click', async () => {
    limparErro(erroGeralConfirmarEmail);
    limparAviso(avisoReenvioEmail);

    carregando(btnReenviarEmail, true, 'Enviando...', 'Reenviar código');

    try {
      await UsuariosAPI.reenviarCodigoEmail();
      exibirAviso(avisoReenvioEmail, 'Novo código enviado! Confira o novo email.');
      limparCodigo();
    } catch (err) {
      exibirErro(erroGeralConfirmarEmail, err.message);
    } finally {
      carregando(btnReenviarEmail, false, '', 'Reenviar código');
    }
  });

  btnCancelarEmail.addEventListener('click', () => {
    formEmailSolicitar.reset();
    limparErro(erroGeralEmail);
    limparAviso(sucessoEmail);
    mostrarPassoSolicitar();
  });

  // ----------------------------------------
  // Excluir conta
  // ----------------------------------------
  function abrirModalExcluir() {
    campoSenhaExcluir.value = '';
    limparErro(erroExcluir);
    modalExcluir.classList.remove('hidden');
    modalExcluir.classList.add('flex');
    campoSenhaExcluir.focus();
  }

  function fecharModalExcluir() {
    modalExcluir.classList.add('hidden');
    modalExcluir.classList.remove('flex');
    campoSenhaExcluir.value = '';
  }

  btnAbrirExcluir.addEventListener('click', abrirModalExcluir);
  modalExcluirFechar.addEventListener('click', fecharModalExcluir);
  modalExcluirCancelar.addEventListener('click', fecharModalExcluir);

  modalExcluir.addEventListener('click', (evento) => {
    if (evento.target === modalExcluir) fecharModalExcluir();
  });

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !modalExcluir.classList.contains('hidden')) {
      fecharModalExcluir();
    }
  });

  formExcluir.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparErro(erroExcluir);

    const senha = campoSenhaExcluir.value;

    if (!senha) {
      exibirErro(erroExcluir, 'Informe sua senha para confirmar.');
      return;
    }

    carregando(btnConfirmarExcluir, true, 'Excluindo...', 'Excluir');

    try {
      await UsuariosAPI.excluirConta(senha);
      Auth.logout(); // limpa token, usuário e foto e leva para o login
    } catch (err) {
      exibirErro(erroExcluir, err.message);
      carregando(btnConfirmarExcluir, false, '', 'Excluir');
    }
  });

  // ----------------------------------------
  // Inicialização
  // ----------------------------------------
  const usuario = Auth.usuarioAtual();
  if (usuario) {
    campoNome.value = usuario.nm_usuario;
    emailAtual.textContent = usuario.ds_email;
  }
});