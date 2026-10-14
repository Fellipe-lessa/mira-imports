import * as THREE from "three";
import { clamp, sm } from "./helpers";

/** Instante (s) em que as partículas começam a se dispersar e a logo se dissolve. */
export const INTRO_DISSOLVE = 5.4;
/** Duração total da abertura (s). */
export const INTRO_END = 7.4;

/** Intensidade do relevo do olho na face da logo (aumente para mais relevo). */
const BUMP = 1.2;

/** Lê o desenho original e devolve coordenadas (x,y) de pontos escuros, em unidades da cena. */
function sampleEye(img: HTMLImageElement, count: number): Float32Array {
  const s = 150;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const x = c.getContext("2d", { willReadFrequently: true })!;
  x.drawImage(img, 0, 0, s, s);
  const d = x.getImageData(0, 0, s, s).data;
  const pts: number[] = [];
  for (let py = 0; py < s; py++) {
    for (let px = 0; px < s; px++) {
      const dx = px - s / 2;
      const dy = py - s / 2;
      if (dx * dx + dy * dy > (s * s) / 4) continue;
      const i = (py * s + px) * 4;
      if (d[i] + d[i + 1] + d[i + 2] < 200) pts.push((px / s - 0.5) * 2.4, -(py / s - 0.5) * 2.4);
    }
  }
  const n = Math.max(1, pts.length / 2);
  const out = new Float32Array(count * 2);
  for (let k = 0; k < count; k++) {
    const j = Math.floor(Math.random() * n) * 2;
    out[k * 2] = pts[j] ?? 0;
    out[k * 2 + 1] = pts[j + 1] ?? 0;
  }
  return out;
}

const easeInOut = (q: number): number => (q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2);

/**
 * Abertura: partículas em curvas convergem para o desenho da logo (disco, anel, marcas em cruz e
 * o olho amostrado da imagem original), a logo ganha volume e luz, e depois se dispersa.
 */
export function createIntro(tex: THREE.Texture, img: HTMLImageElement, mob: boolean) {
  const group = new THREE.Group();
  const nFill = mob ? 500 : 1100;
  const nRing = mob ? 200 : 360;
  const nTick = mob ? 80 : 120;
  const nEye = mob ? 500 : 900;
  const N = nFill + nRing + nTick + nEye;
  const S0 = new Float32Array(N * 3);
  const T = new Float32Array(N * 3);
  const CT = new Float32Array(N * 3);
  const D = new Float32Array(N * 3);
  const dl = new Float32Array(N);
  const col = new Float32Array(N * 3);
  const eye = sampleEye(img, nEye);

  for (let i = 0; i < N; i++) {
    const j = i * 3;
    let tx = 0;
    let ty = 0;
    let tz = 0.1;
    let r = 1;
    let g = 0.95;
    let b = 0;
    if (i < nFill) {
      const a = Math.random() * 6.283;
      const rad = Math.sqrt(Math.random()) * 1.15;
      tx = Math.cos(a) * rad;
      ty = Math.sin(a) * rad;
    } else if (i < nFill + nRing) {
      const a = Math.random() * 6.283;
      tx = Math.cos(a) * 1.25;
      ty = Math.sin(a) * 1.25;
      tz = 0.02;
    } else if (i < nFill + nRing + nTick) {
      const a = (Math.floor(Math.random() * 4) * Math.PI) / 2;
      const rad = 1.5 + Math.random() * 0.5;
      tx = Math.cos(a) * rad;
      ty = Math.sin(a) * rad;
      tz = 0.02;
    } else {
      const k = i - nFill - nRing - nTick;
      tx = eye[k * 2];
      ty = eye[k * 2 + 1];
      tz = 0.14;
      g = 0.97;
      b = 0.8;
    }
    T.set([tx, ty, tz], j);
    col.set([r, g, b], j);
    const a0 = Math.random() * 6.283;
    const r0 = 2.5 + Math.random() * 4.5;
    const sx = Math.cos(a0) * r0;
    const sy = Math.sin(a0) * r0 * 0.7;
    const sz = (Math.random() - 0.7) * 8;
    S0.set([sx, sy, sz], j);
    const off = 1.2 + Math.random() * 1.8;
    CT.set(
      [(sx + tx) / 2 + (Math.random() - 0.5) * off, (sy + ty) / 2 + (Math.random() - 0.5) * off, (sz + tz) / 2 + (Math.random() - 0.5) * off],
      j,
    );
    D.set([(Math.random() - 0.5) * 6, (Math.random() - 0.5) * 5, 1 + Math.random() * 5], j);
    dl[i] = Math.random() * 0.45;
  }

  const pos = new THREE.BufferAttribute(S0.slice(), 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", pos);
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const pm = new THREE.PointsMaterial({
    size: mob ? 0.05 : 0.036,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    opacity: 0,
  });
  group.add(new THREE.Points(geo, pm));

  // logo sólida: disco com espessura, aro arredondado e a arte original na face frontal
  const solid = new THREE.Group();
  const mats: THREE.Material[] = [];
  const mk = (m: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial => {
    m.transparent = true;
    m.opacity = 0;
    mats.push(m);
    return m;
  };
  const face = mk(
    new THREE.MeshStandardMaterial({
      map: tex,
      bumpMap: tex,
      bumpScale: BUMP,
      emissive: 0xffffff,
      emissiveMap: tex,
      emissiveIntensity: 0.45,
      roughness: 0.4,
      metalness: 0.1,
    }),
  );
  face.toneMapped = false;
  const front = new THREE.Mesh(new THREE.CircleGeometry(1.2, 96), face);
  front.position.z = 0.1;
  const gold = mk(new THREE.MeshStandardMaterial({ color: 0xfff200, metalness: 0.9, roughness: 0.25 }));
  const side = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.2, 96, 1, true).rotateX(Math.PI / 2), gold);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.095, 20, 120), gold);
  const back = new THREE.Mesh(
    new THREE.CircleGeometry(1.2, 96).rotateY(Math.PI),
    mk(new THREE.MeshStandardMaterial({ color: 0x1a1a1c, metalness: 0.5, roughness: 0.5 })),
  );
  back.position.z = -0.1;
  solid.add(side, rim, front, back);
  group.add(solid);

  const sweep = new THREE.PointLight(0xfff6b0, 0, 7, 2);
  sweep.position.set(-2.6, 0.4, 1.6);
  group.add(sweep);

  const bell = (t: number, a: number, b: number): number => sm(t, a, a + 0.3) * (1 - sm(t, b - 0.3, b));

  /** t = segundos desde o início. Retorna a posição z desejada para a câmera. */
  function update(t: number): number {
    const A = pos.array as Float32Array;
    const u = (t - 0.5) / 2.8;
    const td = clamp((t - INTRO_DISSOLVE) / 1.9);
    const e2 = td * td;
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      const q = easeInOut(clamp((u - dl[i]) / 0.55));
      const b = 1 - q;
      for (let k = 0; k < 3; k++) {
        A[j + k] = b * b * S0[j + k] + 2 * b * q * CT[j + k] + q * q * T[j + k] + D[j + k] * e2;
      }
    }
    pos.needsUpdate = true;

    const mat = sm(t, 3.0, 4.4);
    const appear = clamp(t / 0.8);
    pm.opacity = appear * (1 - 0.75 * mat + 0.75 * sm(t, INTRO_DISSOLVE, INTRO_DISSOLVE + 0.4)) * (1 - sm(t, INTRO_DISSOLVE + 1, INTRO_DISSOLVE + 2));

    const vis = mat * (1 - sm(t, INTRO_DISSOLVE, INTRO_DISSOLVE + 1.2));
    mats.forEach((m) => (m.opacity = vis));
    solid.scale.setScalar(0.92 + 0.08 * mat + 0.1 * sm(t, INTRO_DISSOLVE, INTRO_DISSOLVE + 1.4));
    solid.rotation.y = (1 - mat) * -0.7 + Math.sin(t * 0.7) * 0.1;
    solid.rotation.x = Math.sin(t * 0.5) * 0.04;
    sweep.intensity = 3 * bell(t, 3.9, 5.3);
    sweep.position.x = -2.6 + 5.2 * clamp((t - 3.9) / 1.4);

    return 6 - 0.9 * sm(t, 1.2, 5.0) - 0.5 * sm(t, INTRO_DISSOLVE, INTRO_DISSOLVE + 1.2) + 1.4 * sm(t, INTRO_DISSOLVE + 0.9, INTRO_END);
  }

  function dispose(): void {
    group.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mt = m.material;
      if (mt) (Array.isArray(mt) ? mt : [mt]).forEach((x) => x.dispose());
    });
  }

  return { group, update, dispose };
}
