# Mira Imports (protótipo)

Site de demonstração da Mira Imports: introdução 3D com a logo, celular que se desmonta e se remonta conforme a rolagem, catálogo com busca e filtros, serviços e contato por WhatsApp.

Os produtos, o endereço, o horário e o Instagram são **dados de exemplo**. O número de WhatsApp está vazio.

## Tecnologias

- Vite 8 e TypeScript 7 (versões fixadas no `package.json`)
- Three.js 0.128.0 para a cena 3D (a mesma versão da demonstração aprovada)
- CSS puro, sem frameworks

## Como rodar no Windows

1. Instale o Node.js LTS em https://nodejs.org (já inclui o npm).
2. Abra esta pasta no VS Code (Arquivo, Abrir Pasta) e abra o terminal (Ctrl+').
3. Rode:

```
npm install
npm run dev
```

4. Abra o endereço que aparecer no terminal (normalmente http://localhost:5173). Alterações salvas nos arquivos aparecem na hora.

Outros comandos:

```
npm run build     verifica o TypeScript e gera a pasta dist (site pronto)
npm run preview   abre a versão gerada em dist para conferir
```

## O que editar

| Quero mudar | Arquivo |
| --- | --- |
| WhatsApp, endereço, horário, Instagram, produtos, categorias, diferenciais | `src/config.ts` |
| Textos das seções, menu e estrutura da página | `index.html` |
| Cores, fontes, espaçamentos e layout | `src/styles.css` |
| Menu, catálogo, busca e filtros | `src/ui.ts` |
| Celular 3D (peças, materiais, tela de bloqueio) | `src/scene/phone.ts` |
| Introdução com partículas | `src/scene/intro.ts` |
| Rolagem, câmera e desmontagem | `src/scene/experience.ts` |
| Logo | `public/logo.jpg` (troque pelo arquivo original em alta resolução, mantendo o nome) |

O amarelo da marca é `#FFF200`, definido como `--y` no topo de `src/styles.css`.

## Publicar no GitHub e hospedar de graça (GitHub Pages)

1. Instale o Git em https://git-scm.com e crie uma conta em https://github.com.
2. Crie um repositório vazio no GitHub (por exemplo, `mira-imports`), sem README.
3. No terminal do VS Code, dentro desta pasta:

```
git init
git add .
git commit -m "Primeira versão do site Mira Imports"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/mira-imports.git
git push -u origin main
```

4. No repositório, abra Settings, depois Pages, e em Source escolha **GitHub Actions**.
5. Em Actions, acompanhe a publicação (arquivo `.github/workflows/deploy.yml`). Ao terminar, o endereço aparece em Settings, Pages, no formato `https://SEU-USUARIO.github.io/mira-imports/`.

A cada `git push` na branch `main`, o site é publicado de novo.

## Antes de entregar ao cliente

- Preencher `src/config.ts` com os dados reais e substituir os produtos de exemplo.
- Informar o WhatsApp (somente dígitos, com 55 e DDD).
- Trocar `public/logo.jpg` por um arquivo maior (o atual tem 150 x 150 pixels e fica suave na tela de bloqueio do celular).
- Escrever o texto da seção "Sobre a loja" e revisar os diferenciais.
- Validar quais serviços a loja realmente oferece (reparos, películas, avaliação de aparelhos usados).

## Ajustes rápidos do upgrade

| O que | Onde |
| --- | --- |
| Duração da abertura (dissolução e fim) | `INTRO_DISSOLVE` e `INTRO_END` em `src/scene/intro.ts` |
| Intensidade do relevo do olho na logo 3D | `BUMP` em `src/scene/intro.ts` |
| Cores e luz da faixa central | `.band` em `src/styles.css` |
| Peças, rótulos e janelas de rolagem da desmontagem | `src/scene/phone.ts` e `TAGS` em `src/scene/experience.ts` |

## Aparência e conteúdo

| O que | Onde |
| --- | --- |
| Cores base (amarelo, grafite, tons de pérola e de tinta), fontes (`--display`) e raios de borda | variáveis no topo de `src/styles.css` |
| Faixa vertical amarelo e preto da hero (e `HERO_X`, a posição do celular) | `.band` em `src/styles.css` e `HERO_X` em `src/scene/experience.ts` |
| Grão do fundo (intensidade) | `opacity` de `.grain` em `src/styles.css` |
| Fontes | Archivo (títulos) e Geist (textos), carregadas pelo Google Fonts no `index.html` |
| Textos da hero, do destaque do iPhone 15 Pro e das especificações | `index.html` |
| Diferenciais (faixa abaixo da hero), categorias em destaque e produtos | `src/config.ts` |

### Fotos de produtos

O catálogo usa ilustrações em SVG (`src/art.ts`) enquanto não houver fotos reais. Para trocar por foto, coloque o arquivo em `public/produtos/` e preencha o campo `imagem` do produto ou da categoria em destaque no `src/config.ts`, por exemplo `imagem: "produtos/capinha.jpg"`. Para produtos reais, use também `exemplo: false` para remover o selo "EXEMPLO".

### iPhone 15 Pro (destaque)

O texto do destaque usa especificações divulgadas pela Apple para o iPhone 15 Pro (titânio, tela de 6,1 pol., chip A17 Pro, câmera principal de 48 MP, USB-C). Confira-as e a variante de cor (Titânio Preto) antes de publicar. O site não informa preço, estoque, garantia ou condições de pagamento: o botão leva à consulta por WhatsApp.

### Movimento

A página respeita a preferência de movimento reduzido do sistema e tem o botão "Reduzir movimento" no rodapé. O giro do iPhone por arraste só existe no destaque.

## Modelo 3D do iPhone

O celular atual é montado por código, com as proporções externas do iPhone 15 Pro. Ele é uma representação, não uma réplica técnica dos componentes internos.

Para usar um modelo pronto, coloque um arquivo `iphone.glb` em `public/models/` e siga `public/models/LEIA-ME.md` (requisitos de licença e de peças, e como ligar os nomes das peças). Sem o arquivo, o site usa o modelo atual, sem erro.
