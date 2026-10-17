# Modelo 3D do iPhone (opcional)

O site já roda com um iPhone feito por código. Para usar um modelo 3D pronto, coloque aqui um arquivo chamado `iphone.glb`.
Se o arquivo não existir, nada é carregado e o site usa o modelo atual.

## O que o arquivo precisa ter

- Formato GLB (ou GLTF convertido para GLB), sem compressão Draco ou Meshopt.
- Licença que permita uso comercial e a publicação do arquivo em um site (leia o texto da licença: muitos marketplaces permitem usar o modelo em um produto, mas proíbem distribuir o arquivo cru, e um site entrega o arquivo ao navegador).
- Peças em objetos separados e com nomes reconhecíveis: tela ou vidro, bateria, placa lógica, câmeras e vidro traseiro. As mínimas exigidas são tela, bateria e placa.
- Materiais PBR e texturas razoáveis (de preferência abaixo de 15 MB no total).
- Frente do aparelho voltada para +z depois da rotação definida em `src/scene/modelo.config.ts` (campo `rotacao`).

## Como conferir e ligar

1. Abra o arquivo em https://gltf-viewer.donmccurdy.com e veja a árvore de nomes.
2. Ajuste os padrões de nome em `src/scene/modelo.config.ts`.
3. Rode `npm run dev` e abra o console do navegador: se faltar alguma peça mínima, o aviso aparece lá e o site continua com o modelo atual.

Não use o logotipo da Apple e não apresente a loja como autorizada pela fabricante.
