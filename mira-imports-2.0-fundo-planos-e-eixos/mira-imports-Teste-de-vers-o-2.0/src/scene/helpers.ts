export const clamp = (x: number, a = 0, b = 1): number => Math.min(b, Math.max(a, x));

/** Suavização (smoothstep) de x entre a e b, resultado de 0 a 1. */
export const sm = (x: number, a: number, b: number): number => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
