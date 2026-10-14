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

## Trocar o celular procedural por um modelo GLB de iPhone

O celular atual é montado por código (geometria e materiais próprios). Para usar um modelo 3D pronto, ele precisa ter:

- licença que permita uso comercial e redistribuição do arquivo (por exemplo CC0 ou CC-BY, com o crédito exigido);
- peças separadas e nomeadas: tela e vidro, estrutura, câmeras, bateria, placa principal e vidro traseiro;
- materiais PBR e texturas em tamanho razoável (de preferência arquivo abaixo de 15 MB, comprimido).

Para conferir o que o arquivo tem, abra-o em https://gltf-viewer.donmccurdy.com e veja a árvore de nomes das peças. Guarde o arquivo em `public/models/` e passe a lista de nomes para integrar a `src/scene/phone.ts`. Não use o logotipo da Apple, e a loja não deve ser apresentada como autorizada pela fabricante.
