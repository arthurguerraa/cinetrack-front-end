# CineTrack — Frontend

Interface web do CineTrack, uma plataforma de avaliação de filmes onde usuários buscam títulos, avaliam, criam listas personalizadas e acompanham o ranking dos filmes mais bem avaliados pela comunidade.

Projeto desenvolvido como estudo prático de frontend com JavaScript puro, sem frameworks — construindo desde a arquitetura de componentes até o consumo de API do zero.

Consome a [CineTrack API](#) (backend em Node.js + Express + MySQL, desenvolvido em paralelo).

---

## Tecnologias

- **HTML5** semântico
- **Tailwind CSS v4** — configuração via `@theme` no CSS, sem `tailwind.config.js`
- **JavaScript puro (Vanilla JS)** — sem frameworks, sem bibliotecas de UI
- **TMDB API** — fonte de dados de filmes, consumida pelo backend

---

## Design system

Identidade visual inspirada em cinema — marquise, sala escura, ticket de ingresso.

| Token | Valor | Uso |
|---|---|---|
| `night` | `#121212` | Fundo da página |
| `surface` | `#1C1C1C` | Cards, inputs, modais |
| `border` | `#2A2A2A` | Divisórias, bordas |
| `amber` | `#E8A33D` | Cor de destaque única — botões, links, notas |
| `cream` | `#ECECEC` | Texto principal |
| `muted` | `#8C8C8C` | Texto secundário |

**Tipografia:**
- `Fraunces` (serifada) — títulos e headings
- `IBM Plex Sans` — corpo de texto, botões, UI
- `Space Mono` — dados numéricos (notas, anos, posições no ranking)

**Elemento assinatura:** a "trilha de sprocket" — uma faixa de pontos que remete aos furos de uma fita de película, usada como divisor entre seções. Reaproveitada como componente Tailwind (`.sprocket`) em todo o projeto.

---

## Arquitetura

### Componentes via JavaScript

Como o projeto não usa um framework, header e footer são **gerados dinamicamente por JavaScript** e injetados em cada página — evita repetir o mesmo HTML em todo arquivo e centraliza qualquer manutenção futura num único lugar.

```html
<header id="header-root"></header>
...
<script src=".../components/header.js"></script>
<script>
  renderHeader({ contexto: 'pages', paginaAtiva: 'ranking', largura: 'narrow' });
</script>
```

### Camada única de comunicação com a API

Nenhuma página faz `fetch()` diretamente. Toda chamada passa por `api.js`, que centraliza:
- Montagem da URL base
- Anexação automática do token JWT (quando existe)
- Tratamento padronizado de erro

```js
const filmes = await FilmesAPI.populares(1);
const resposta = await AuthAPI.login(email, senha);
```

### Estado sincronizado com a URL

A busca de filmes (home) guarda o modo atual — populares, filtro de gênero ou busca por termo — direto na URL (`?q=batman`, `?genero=Ação`, `?page=2`). Isso permite:
- Sobreviver a um F5 sem perder o contexto
- Compartilhar o link de uma busca específica
- Navegação natural com os botões voltar/avançar do navegador

### Fonte de dados sempre fresca

A listagem de filmes (populares, por gênero, ou busca) **sempre consulta o TMDB diretamente**, nunca lê de uma tabela acumulada no banco. O banco de dados funciona só como cache de apoio, garantindo que cada filme tenha um ID fixo para permitir avaliações e listas — mas nunca é a fonte do que aparece na tela.

---

## Estrutura de pastas

```
cinetrack-front-end/
├── assets/
│   └── css/
│       └── output.css          ← gerado pelo build do Tailwind
├── src/
│   ├── css/
│   │   └── input.css            ← única fonte do design system (@theme)
│   ├── js/
│   │   ├── api.js                ← camada de comunicação com o backend
│   │   ├── auth.js               ← sessão do usuário (login/logout/token)
│   │   ├── main.js               ← funções compartilhadas entre páginas
│   │   ├── components/
│   │   │   ├── header.js          ← header reutilizável (com menu mobile)
│   │   │   └── footer.js          ← footer reutilizável
│   │   └── pages/
│   │       ├── home.js
│   │       ├── login.js
│   │       ├── cadastro.js
│   │       ├── verificar-email.js
│   │       ├── esqueci-senha.js
│   │       ├── redefinir-senha.js
│   │       ├── ranking.js
│   │       ├── listas.js
│   │       └── perfil.js
│   └── pages/
│       ├── login.html
│       ├── cadastro.html
│       ├── verificar-email.html
│       ├── esqueci-senha.html
│       ├── redefinir-senha.html
│       ├── ranking.html
│       ├── listas.html
│       └── perfil.html
├── index.html                    ← home / busca de filmes
├── package.json
└── .gitignore
```

---

## Como rodar o projeto

### Pré-requisitos
- Node.js instalado
- A [CineTrack API](#) rodando localmente em `http://localhost:3000`

### Passos

```bash
# clone o repositório
git clone <url-do-repositorio>
cd cinetrack-front-end

# instale as dependências
npm install
```

Roda o build do Tailwind em modo watch (deixa esse terminal aberto):

```bash
npm run build:css
```

Abre o `index.html` no navegador — ou, para uma experiência mais próxima de produção, serve os arquivos com uma extensão tipo **Live Server** do VS Code.

---

## Páginas

| Página | Rota | Requer login? |
|---|---|---|
| Home / Busca | `index.html` | Não |
| Ranking | `src/pages/ranking.html` | Não |
| Login | `src/pages/login.html` | Não |
| Cadastro | `src/pages/cadastro.html` | Não |
| Verificar email | `src/pages/verificar-email.html` | Não |
| Esqueci minha senha | `src/pages/esqueci-senha.html` | Não |
| Redefinir senha | `src/pages/redefinir-senha.html` | Não |
| Minhas listas | `src/pages/listas.html` | Sim |
| Meu perfil | `src/pages/perfil.html` | Sim |

Páginas protegidas verificam a sessão **antes** do conteúdo renderizar (evita o "flash" de conteúdo para quem não está logado), via `Auth.protegerPagina()` chamado no `<head>`.

---

## Funcionalidades

**Autenticação completa**
Cadastro com verificação de email por código de 6 dígitos, login, e recuperação de senha — também por código, reaproveitando o mesmo componente de input em todas as telas que precisam dele.

**Busca e descoberta de filmes**
Três modos na home: filmes em alta (padrão), filtro por gênero, e busca por termo — todos com paginação.

**Avaliações**
Nota de 1 a 10 com comentário opcional, direto de um modal na home ou na tela de perfil, com edição e exclusão.

**Listas personalizadas**
Criar, editar, excluir listas, marcar como pública/privada, e adicionar filmes a elas a partir de qualquer card.

**Perfil**
Dados do usuário e histórico completo de avaliações num só lugar.

**Ranking**
Os filmes mais bem avaliados pela comunidade, com destaque visual para o pódio (top 3).

---

## Responsividade

Todas as telas foram revisadas para telas pequenas (a partir de ~320px de largura), incluindo:
- Menu hamburguer no header abaixo do breakpoint `md`
- Modais com altura máxima e scroll interno, para não cortar conteúdo em telas curtas
- Cabeçalhos com título + ação que empilham verticalmente em vez de espremer
- Textos truncados (`line-clamp`, `truncate`) para evitar quebra de layout com conteúdo longo

---

## Autor

Desenvolvido por **Arthur Guerra** como projeto de estudo e portfólio em desenvolvimento fullstack.

- GitHub: [github.com/arthurguerraa](https://github.com/arthurguerraa)
- LinkedIn: [linkedin.com/in/arthurguerraa](https://www.linkedin.com/in/arthurguerraa/)