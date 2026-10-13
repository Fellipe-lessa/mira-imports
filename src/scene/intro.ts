import * as THREE from "three";
import { clamp, sm } from "./helpers";

/** Abertura: partículas convergem em um anel com marcas em cruz e revelam a logo original. */
export function createIntro(tex: THREE.Texture, mob: boolean) {
  const group = new THREE.Group();
  const N = mob ? 800 : 1600;
  const st = new Float32Array(N * 3);
  const tg = new Float32Array(N * 3);
  const dl = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const a = Math.random() * 6.283;
    const r = 3 + Math.random() * 4;
    const j = i * 3;
    st[j] = Math.cos(a) * r;
    st[j + 1] = Math.sin(a) * r * 0.7;
    st[j + 2] = (Math.random() - 0.5) * 8;
    let ang = (i / N) * 6.283;
    let rad = 1.2;
    if (i % 6 === 0) {
      ang = (((i / 6) | 0) % 4) * (Math.PI / 2);
      rad = 1.45 + Math.random() * 0.55;
    }
    tg[j] = Math.cos(ang) * rad;
    tg[j + 1] = Math.sin(ang) * rad;
    tg[j + 2] = (Math.random() - 0.5) * 0.3;
    dl[i] = Math.random() * 0.4;
  }
  const pos = new THREE.BufferAttribute(st.slice(), 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", pos);
  const pm = new THREE.PointsMaterial({
    color: 0xfff200,
    size: mob ? 0.05 : 0.035,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    opacity: 0,
  });
  const dm = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, toneMapped: false });
  const rm = new THREE.MeshBasicMaterial({ color: 0xfff200, transparent: true, opacity: 0, toneMapped: false });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.2, 64), dm);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.24, 0.015, 12, 96), rm);
  group.add(new THREE.Points(g, pm), disc, ring);

  /** t = segundos desde o início da abertura. */
  function update(t: number): void {
    const A = pos.array as Float32Array;
    const u = (t - 0.3) / 2.6;
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      const q = sm(u - dl[i], 0, 0.6);
      const x = st[j] + (tg[j] - st[j]) * q;
      const y = st[j + 1] + (tg[j + 1] - st[j + 1]) * q;
      const a = (1 - q) * 1.4;
      const s = Math.sin(a);
      const c = Math.cos(a);
      A[j] = x * c - y * s;
      A[j + 1] = x * s + y * c;
      A[j + 2] = st[j + 2] + (tg[j + 2] - st[j + 2]) * q;
    }
    pos.needsUpdate = true;
    const v = sm(t, 2.8, 4.2);
    pm.opacity = clamp(t / 0.8) * (1 - 0.55 * v);
    dm.opacity = rm.opacity = v;
    disc.rotation.y = ring.rotation.y = (1 - v) * -1.1;
    group.rotation.y = Math.sin(t * 0.6) * 0.12;
  }
  return { group, update };
}
