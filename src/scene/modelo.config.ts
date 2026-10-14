import type { ModeloCfg } from "./rig";

/** Caminho do arquivo GLB dentro da pasta public (veja public/models/LEIA-ME.md). */
export const MODELO_ARQUIVO = "models/iphone.glb";

/**
 * Como separar o modelo em peças. Os padrões são comparados com os nomes dos objetos do arquivo,
 * na ordem da lista (a primeira que combina vence). Ajuste depois de ver os nomes reais no
 * https://gltf-viewer.donmccurdy.com
 */
export const MODELO: ModeloCfg = {
  altura: 1.57,
  rotacao: [0, 0, 0],
  minimas: ["tela", "bateria", "placa"],
  partes: [
    { nome: "bateria", padrao: /batter|bateria/i, deslocamento: -0.95 },
    { nome: "placa", padrao: /logic|board|pcb|motherboard|placa/i, deslocamento: -0.6 },
    { nome: "cam", padrao: /camera|lens|lidar/i, deslocamento: -1.3 },
    { nome: "taptic", padrao: /taptic|haptic|vibra/i, deslocamento: -0.6 },
    { nome: "falante", padrao: /speaker|falante/i, deslocamento: -0.6 },
    { nome: "back", padrao: /back|rear|traseir/i, deslocamento: -1.8 },
    { nome: "tela", padrao: /screen|display|lcd|oled|front.?glass|tela/i, deslocamento: 1.45 },
  ],
};
