import type { CatKey } from "./config";

/**
 * Ilustrações de produto em SVG, usadas enquanto a loja não tem fotos reais.
 * Cores vêm do CSS: `color` (corpo), `--scr` (tela/fundo interno) e `--acc` (detalhe).
 * Para usar foto real, preencha o campo `imagem` do produto ou da categoria em config.ts.
 */
const FORMAS: Record<CatKey, string> = {
  celulares: `<rect x="32" y="12" width="56" height="136" rx="11" fill="currentColor"/><rect x="36" y="16" width="48" height="128" rx="8" fill="var(--scr)"/><rect x="50" y="20" width="20" height="5" rx="2.5" fill="currentColor"/><circle cx="60" cy="84" r="15" class="ac"/><path d="M60 74v6M60 88v6M50 84h6M64 84h6" stroke="var(--scr)" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,
  fones: `<path d="M26 86C26 28 94 28 94 86" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/><rect x="16" y="78" width="24" height="46" rx="10" fill="currentColor"/><rect x="80" y="78" width="24" height="46" rx="10" fill="currentColor"/><rect x="22" y="88" width="12" height="26" rx="6" class="ac"/><rect x="86" y="88" width="12" height="26" rx="6" class="ac"/>`,
  eletronicos: `<rect x="22" y="40" width="76" height="84" rx="18" fill="currentColor"/><circle cx="60" cy="88" r="26" fill="var(--scr)"/><circle cx="60" cy="88" r="9" class="ac"/><rect x="46" y="50" width="28" height="6" rx="3" fill="var(--scr)"/>`,
  acessorios: `<rect x="40" y="22" width="40" height="52" rx="10" fill="currentColor"/><rect x="50" y="8" width="6" height="14" rx="2" fill="currentColor"/><rect x="64" y="8" width="6" height="14" rx="2" fill="currentColor"/><circle cx="60" cy="48" r="6" class="ac"/><path d="M60 74v24c0 22-26 18-26 38" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><rect x="26" y="134" width="20" height="14" rx="4" class="ac"/>`,
  copos: `<path d="M34 34h52l-6 104a8 8 0 0 1-8 8H48a8 8 0 0 1-8-8z" fill="currentColor"/><rect x="30" y="22" width="60" height="12" rx="5" fill="var(--scr)"/><path d="M88 52h10a10 10 0 0 1 0 38H84" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><rect x="46" y="62" width="28" height="36" rx="6" class="ac"/>`,
  chaveiros: `<circle cx="60" cy="38" r="18" fill="none" stroke="currentColor" stroke-width="6"/><path d="M60 56v14" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><rect x="38" y="70" width="44" height="64" rx="12" fill="currentColor"/><circle cx="60" cy="102" r="10" class="ac"/>`,
};

export const arte = (cat: CatKey): string =>
  `<svg class="art" viewBox="0 0 120 160" aria-hidden="true" focusable="false">${FORMAS[cat]}</svg>`;
