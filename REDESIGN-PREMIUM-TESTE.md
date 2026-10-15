# Mira Imports — versão experimental de design premium

Esta versão adiciona uma camada visual reversível em `src/styles-premium.css` sem reescrever os componentes ou a lógica da loja.

## O que foi refinado
- Cabeçalho editorial com acabamento escuro e linhas sutis.
- Hero com tipografia maior, rótulo editorial e degradê amarelo/preto mais controlado.
- Seção de categorias com imagens em fundo integral, sobreposição escura para leitura, bordas e hover mais refinados.
- Fundo perolado e textura discreta nas áreas de catálogo e contato.
- Catálogo, serviços e rodapé com hierarquia visual mais consistente.
- Transições mais suaves e ajustes responsivos.

## O que foi preservado
- Estrutura HTML principal e configuração comercial.
- Lógica do menu, filtros, pesquisa e links do WhatsApp.
- Código Three.js da introdução e da experiência de desmontagem do telefone.
- Modelo 3D/procedural existente e todas as animações dirigidas por scroll.
- As três imagens atuais dos cards de categorias.

## Como voltar ao design anterior
Em `src/main.ts`, remova a linha:

```ts
import "./styles-premium.css";
```

Isso desativa a camada de estilo experimental sem precisar desfazer as regras do CSS original.

## Testar localmente
1. Extraia o ZIP.
2. Na pasta `mira-imports-main`, abra o terminal.
3. Execute `npm ci`.
4. Execute `npm run dev` para conferir o site localmente.
5. Para validar a compilação, execute `npm run build`.

A instalação e compilação não puderam ser concluídas neste ambiente porque o acesso ao registro do npm falhou por indisponibilidade de rede. O CSS foi analisado com um parser e não apresentou erros de sintaxe; ainda assim, a compilação completa precisa ser verificada localmente ou no GitHub Actions.
