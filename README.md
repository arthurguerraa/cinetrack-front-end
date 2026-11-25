# CineTrack — Frontend

Interface web do CineTrack, uma plataforma de avaliação de filmes onde usuários buscam títulos, avaliam, criam listas personalizadas, sorteiam filmes para assistir e acompanham o ranking dos filmes mais bem avaliados pela comunidade.

Projeto desenvolvido como estudo prático de frontend com JavaScript puro, sem frameworks — construindo desde a arquitetura de componentes até o consumo de API do zero.

Consome a [CineTrack API](https://github.com/arthurguerraa/cinetrack-api) (backend em Node.js + Express + MySQL, desenvolvido em paralelo).

---

## Tecnologias

- **HTML5** semântico
- **Tailwind CSS v4** — configuração via `@theme` no CSS, sem `tailwind.config.js`
- **JavaScript puro (Vanilla JS)** — sem frameworks, sem bibliotecas de UI, sem bundler JS
- **TMDB API** — fonte de dados de filmes em tempo real, consumida pelo backend

---

## Design system

Identidade visual inspirada em cinema clássico — marquise, sala escura, película de 35mm e tickets de ingresso.

| Token | Valor | Uso |
|---|---|---|
| `night` | `#121212` | Fundo da página |
| `surface` | `#1C1C1C` | Cards, inputs, modais |
| `border` | `#2A2A2A` | Divisórias, bordas |
| `amber` | `#E8A33D` | Cor de destaque única — botões, links, notas, pódio |
| `cream` | `#ECECEC` | Texto principal |
| `muted` | `#8C8C8C` | Texto secundário |

**Tipografia:**
- `Fraunces` (serifada) — títulos e headings
- `IBM Plex Sans` — corpo de texto, botões, UI
- `Space Mono` — dados numéricos (notas, anos, posições no ranking, códigos OTP)

**Assinaturas visuais:**
- A **trilha de sprocket**: uma faixa de pontos que remete aos furos de uma fita de película, usada como divisor entre seções (`.sprocket` em todo o projeto).
- O **card estilo ingresso**: picotes, bordas tracejadas (`border-dashed`) e cabeçalho estilizado de ticket de cinema na visualização de listas.

---

## Arquitetura

### Componentes via JavaScript

Como o projeto não usa um framework, header, footer e favicon são **gerados/aplicados dinamicamente por JavaScript** em cada página — evitando código duplicado e centralizando a manutenção:

```html
<header id="header-root"></header>
...
<script src=".../components/header.js"></script>
<script>
  renderHeader({ contexto: 'pages', paginaAtiva: 'ranking', largura: 'narrow' });
</script>
<script src=".../components/footer.js"></script>
<script>
  renderFooter({ contexto: 'pages', largura: 'narrow' });
</script>
<script src=".../components/favicon.js"></script>
<script>
  aplicarFavicon({ contexto: 'pages' });
</script>
```

- O parâmetro `contexto` (`'root'` para `index.html` na raiz, `'pages'` para arquivos em `src/pages/`) ajusta os caminhos relativos automaticamente.
- O header sincroniza o avatar do usuário com sua **foto de perfil** (ou ícone placeholder) tanto no desktop quanto no menu mobile retrátil.

### Camada única de comunicação com a API

Nenhuma página faz `fetch()` diretamente. Toda chamada passa por `api.js`, que centraliza:
- Montagem da URL base
- Injeção automática do token JWT nos headers
- Tratamento padronizado de erros e mensagens de negócio
- **Tratamento de sessão expirada / derrubada**: intercepta respostas HTTP 401 (senha trocada em outro dispositivo ou token expirado), limpando o armazenamento local e redirecionando para o login

```js
const filmes = await FilmesAPI.populares(1, 'maior_nota');
const resposta = await AuthAPI.login(email, senha);
```

### Estado sincronizado com a URL

A busca e listagem de filmes na home guardam o modo atual (populares, filtro de gênero ou busca por termo), ordenação e página direto na URL (`?q=batman&ordem=maior_nota&page=2`):
- Sobrevive ao recarregamento (F5) sem perder o contexto
- Permite compartilhar o link exato de uma busca ou filtro
- Navegação fluida com os botões voltar/avançar do navegador (`popstate`)

### Fonte de dados fresca e ranking calibrado

- A listagem de filmes sempre consulta o TMDB diretamente via backend, garantindo catálogo atualizado e filtrando títulos que ainda não foram lançados. O banco relacional armazena IDs e dados para vincular listas e avaliações.
- As notas dos filmes combinam avaliações da comunidade CineTrack com a nota base do TMDB através de um algoritmo calibrado para evitar distorções estatísticas em filmes com poucos votos.

---

## Estrutura de pastas

```
cinetrack-front-end/
├── assets/
│   ├── css/
│   │   └── output.css          ← gerado pelo build do Tailwind
│   └── images/
│       ├── android-chrome-512x512.png
│       └── favicon_io/
├── src/
│   ├── css/
│   │   └── input.css            ← design system central (@theme e componentes)
│   ├── js/
│   │   ├── api.js                ← camada de comunicação com o backend
│   │   ├── auth.js               ← sessão, JWT e sincronização de foto
│   │   ├── main.js               ← formatadores, modais e utilitários de DOM
│   │   ├── components/
│   │   │   ├── header.js          ← header com avatar e menu mobile
│   │   │   ├── footer.js          ← footer reutilizável
│   │   │   └── favicon.js         ← injetor de favicon
│   │   └── pages/
│   │       ├── home.js            ← busca, filtro, ordenação e modais
│   │       ├── login.js           ← login de usuários
│   │       ├── cadastro.js        ← cadastro de novas contas
│   │       ├── verificar-email.js ← validação de código OTP
│   │       ├── esqueci-senha.js   ← solicitação de recuperação
│   │       ├── redefinir-senha.js ← redefinição de senha com OTP
│   │       ├── listas.js          ← listagem e criação de listas
│   │       ├── lista-detalhe.js   ← página da lista, filtros, sorteio e progresso
│   │       ├── perfil.js          ← perfil, foto, bio e histórico de avaliações
│   │       ├── configuracoes.js   ← alteração de dados, email, senha e exclusão
│   │       └── ranking.js         ← ranking comunitário dos filmes
│   └── pages/
│       ├── login.html
│       ├── cadastro.html
│       ├── verificar-email.html
│       ├── esqueci-senha.html
│       ├── redefinir-senha.html
│       ├── listas.html
│       ├── lista-detalhe.html
│       ├── perfil.html
│       ├── configuracoes.html
│       └── ranking.html
├── index.html                    ← home / catálogo de filmes
├── package.json
└── README.md
```

---

## Como rodar o projeto

### Pré-requisitos
- Node.js instalado
- A [CineTrack API](https://github.com/arthurguerraa/cinetrack-api) rodando localmente em `http://localhost:3000`

### Passos

```bash
# Clone o repositório
git clone https://github.com/arthurguerraa/cinetrack-front-end.git
cd cinetrack-front-end

# Instale as dependências
npm install
```

Rode o build do Tailwind em modo watch (mantenha o terminal aberto):

```bash
npm run build:css
```

Abra o arquivo `index.html` no navegador ou utilize uma extensão como o **Live Server** no VS Code.

---

## Páginas

| Página | Rota | Requer login? |
|---|---|---|
| Home / Catálogo | `index.html` | Não |
| Ranking | `src/pages/ranking.html` | Não |
| Login | `src/pages/login.html` | Não |
| Cadastro | `src/pages/cadastro.html` | Não |
| Verificar email | `src/pages/verificar-email.html` | Não |
| Esqueci minha senha | `src/pages/esqueci-senha.html` | Não |
| Redefinir senha | `src/pages/redefinir-senha.html` | Não |
| Minhas listas | `src/pages/listas.html` | Sim |
| Detalhes da lista | `src/pages/lista-detalhe.html?id=...` | Sim |
| Meu perfil | `src/pages/perfil.html` | Sim |
| Configurações da conta | `src/pages/configuracoes.html` | Sim |

Páginas protegidas verificam a sessão **antes** da renderização visual através de `Auth.protegerPagina()` chamado no `<head>`, prevenindo o "flash" de conteúdo não autorizado.

---

## Funcionalidades

### 🔐 Autenticação e Segurança
- Cadastro com verificação de email via código OTP de 6 dígitos.
- Inputs OTP com avanço automático, backspace inteligente, navegação por setas e suporte a colar código completo.
- Login com bloqueio inteligente de contas não verificadas e redirecionamento direto para a tela de confirmação.
- Recuperação de senha com código por e-mail e redefinição com renovação de sessão imediata.
- Versionamento de tokens e invalidação de sessão automática no caso de alteração de credenciais.

### Busca e Descoberta de Filmes
- Três modos de navegação na home: filmes populares na semana, filtro dinâmico por gêneros e busca textual por título.
- **Ordenação flexível**: ordene por nota (maior/menor), ano de lançamento (recentes/antigos) ou relevância.
- Filtro automático contra filmes que ainda não estrearam nos cinemas.
- Paginação completa integrada ao histórico do navegador.

### Avaliações
- Avalie filmes com nota de 1 a 10 (passo 0.5) e comentários opcionais.
- Modais de avaliação rápida integrados na home, na página de detalhes da lista e no perfil.
- Edição e exclusão de avaliações a qualquer momento com recálculo automático da nota.

### Listas Interativas e Página Dedicada (`lista-detalhe`)
- Listas agora possuem **página própria completa** com cabeçalho estilizado de ticket de cinema.
- **Barra de progresso de filmes assistidos**: o ato de avaliar um filme na plataforma o marca automaticamente como assistido dentro da sua lista.
- **Filtros rápidos de visualização**: alterne entre "Todos", "Pendentes" e "Assistidos".
- **Filtro por gênero interno**: filtre os filmes presentes na lista por seus respectivos gêneros.
- **Ordenação avançada**: ordene os filmes da lista por data em que foram adicionados, nota, ano de lançamento, duração estimada ou ordem alfabética.
- **"Sortear um filme"**: recurso interativo que escolhe aleatoriamente um título não assistido da lista para ajudar na decisão do que ver.
- Adição de filmes a partir de qualquer card da home, edição de informações da lista (nome, descrição, visibilidade pública/privada) e remoção direta de filmes.

### Perfil Completo do Usuário
- **Foto de perfil personalizada**: upload de imagens (JPEG, PNG, WebP) com preview em tempo real, armazenamento e remoção (com fallback automático para avatar com as iniciais do nome).
- **Bio do usuário**: campo de biografia personalizável com contador de caracteres (limite de 160).
- Data de criação da conta ("Membro desde").
- **Resumo de listas**: cards clicáveis com atalho direto e contagem de filmes de cada lista criada.
- **Histórico de avaliações paginado**: listagem com ordenação por data, nota e título, com botão "Carregar mais".

### Central de Configurações da Conta
- Alteração do nome de exibição.
- Alteração de senha com confirmação obrigatória da senha anterior.
- Troca segura de e-mail em duas etapas (envio e confirmação de código OTP no novo endereço).
- Zona de perigo: exclusão permanente da conta e de todos os dados vinculados, protegida por senha.

### Ranking Comunitário
- Classificação dos filmes mais bem avaliados pela comunidade CineTrack.
- Destaque visual especial para o pódio (top 3 em âmbar).
- Seletor de limite para visualizar os top 10, 25 ou 50 títulos.

---

## Responsividade

Todas as interfaces foram desenhadas e revisadas para excelente usabilidade desde telas pequenas (a partir de 320px):
- Menu hamburguer acessível no header com animação e controle via `aria-expanded` abaixo do breakpoint `md`.
- Modais seguros com altura máxima (`max-h-[90vh]`) e scroll interno, evitando cortes em telas menores.
- Cabeçalhos de seções e formulários que empilham verticalmente de forma fluida (`flex-col sm:flex-row`).
- Prevenção rigorosa de overflow horizontal em elementos flexíveis através de `min-w-0`, `truncate` e `line-clamp`.
- Botões e emblemas protegidos contra distorções com `shrink-0`.

---

## Autor

Desenvolvido por **Arthur Guerra** como projeto de estudo e portfólio em desenvolvimento fullstack.

- GitHub: [github.com/arthurguerraa](https://github.com/arthurguerraa)
- LinkedIn: [linkedin.com/in/arthurguerraa](https://www.linkedin.com/in/arthurguerraa/)
