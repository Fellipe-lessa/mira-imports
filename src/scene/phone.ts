import * as THREE from "three";

export interface PhoneRig {
  phone: THREE.Group;
  /** Peças que se afastam na vista explodida (userData: z de repouso e deslocamento). */
  parts: THREE.Object3D[];
}

/** Retângulo com cantos arredondados. */
function rr(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function slab(w: number, h: number, r: number, d: number, m: THREE.Material): THREE.Mesh {
  const g = new THREE.ExtrudeGeometry(rr(w, h, r), { depth: d, bevelEnabled: false, curveSegments: 8 });
  g.translate(0, 0, -d / 2);
  return new THREE.Mesh(g, m);
}

const box = (w: number, h: number, d: number, m: THREE.Material): THREE.Mesh =>
  new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);

function rrPlane(w: number, h: number, r: number): THREE.ShapeGeometry {
  const g = new THREE.ShapeGeometry(rr(w, h, r), 12);
  const p = g.attributes.position;
  const u = g.attributes.uv;
  for (let i = 0; i < p.count; i++) u.setXY(i, (p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h);
  return g;
}

function frameGeo(w: number, h: number, r: number, d: number, hl: number): THREE.ExtrudeGeometry {
  const b = 0.008;
  const s = rr(w - 2 * b, h - 2 * b, r - b);
  s.holes.push(rr(w - 2 * b - hl, h - 2 * b - hl, r - b - hl * 0.6));
  const t = d - 2 * b;
  const g = new THREE.ExtrudeGeometry(s, {
    depth: t,
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 4,
    curveSegments: 10,
  });
  g.translate(0, 0, -t / 2);
  return g;
}

function noiseTex(w: number, h: number, draw: (x: CanvasRenderingContext2D) => void, repeat: number): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  return t;
}

/** Textura de rugosidade do titânio escovado. */
const brushTex = (): THREE.CanvasTexture =>
  noiseTex(256, 256, (x) => {
    x.fillStyle = "#999";
    x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) {
      const v = 110 + Math.floor(Math.random() * 100);
      x.fillStyle = `rgb(${v},${v},${v})`;
      x.fillRect(0, Math.random() * 256, 256, 1);
    }
  }, 3);

/** Textura de rugosidade do vidro fosco traseiro. */
const grainTex = (): THREE.CanvasTexture =>
  noiseTex(128, 128, (x) => {
    x.fillStyle = "#bbb";
    x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 8000; i++) {
      const v = 140 + Math.floor(Math.random() * 100);
      x.fillStyle = `rgb(${v},${v},${v})`;
      x.fillRect(Math.floor(Math.random() * 128), Math.floor(Math.random() * 128), 1, 1);
    }
  }, 6);

/** Placa de circuito com trilhas e pontos de solda. */
const pcbTex = (): THREE.CanvasTexture =>
  noiseTex(256, 256, (x) => {
    x.fillStyle = "#0f1a14";
    x.fillRect(0, 0, 256, 256);
    x.strokeStyle = "#7a5c22";
    x.lineWidth = 1.2;
    for (let i = 0; i < 70; i++) {
      let px = Math.random() * 256;
      let py = Math.random() * 256;
      x.beginPath();
      x.moveTo(px, py);
      for (let k = 0; k < 4; k++) {
        if (k % 2) py += (Math.random() - 0.5) * 80;
        else px += (Math.random() - 0.5) * 80;
        x.lineTo(px, py);
      }
      x.stroke();
    }
    x.fillStyle = "#b08d57";
    for (let i = 0; i < 90; i++) {
      x.beginPath();
      x.arc(Math.random() * 256, Math.random() * 256, 1.6, 0, 6.283);
      x.fill();
    }
  }, 2);

/** Parafuso com fenda em cruz, apontado para +z. */
function screw(m: THREE.Material, d: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.006, 14).rotateX(Math.PI / 2), m));
  const a = box(0.016, 0.003, 0.002, d);
  const b = box(0.003, 0.016, 0.002, d);
  a.position.z = b.position.z = 0.0032;
  g.add(a, b);
  return g;
}

/** Ambiente de estúdio desenhado em canvas, usado nos reflexos do metal e do vidro. */
function makeEnv(R: THREE.WebGLRenderer): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const x = c.getContext("2d")!;
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#34343a");
  g.addColorStop(0.5, "#0b0b0c");
  g.addColorStop(1, "#040404");
  x.fillStyle = g;
  x.fillRect(0, 0, 1024, 512);
  x.fillStyle = "#fff";
  x.fillRect(170, 110, 170, 95);
  x.fillRect(640, 80, 240, 60);
  x.fillRect(880, 200, 60, 150);
  x.fillStyle = "#FFF200";
  x.fillRect(440, 240, 36, 210);
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.encoding = THREE.sRGBEncoding;
  const pm = new THREE.PMREMGenerator(R);
  const e = pm.fromEquirectangular(t).texture;
  pm.dispose();
  t.dispose();
  return e;
}

/** Tela de bloqueio: a logo da loja como papel de parede, com data e hora reais. */
function screenTex(img: HTMLImageElement): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 1092;
  const x = c.getContext("2d")!;
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 4;
  const pill = (cx: number, cy: number, w: number, h: number, col: string): void => {
    x.fillStyle = col;
    x.beginPath();
    x.arc(cx - w / 2 + h / 2, cy, h / 2, Math.PI / 2, Math.PI * 1.5);
    x.arc(cx + w / 2 - h / 2, cy, h / 2, -Math.PI / 2, Math.PI / 2);
    x.closePath();
    x.fill();
  };
  function draw(): void {
    x.fillStyle = "#FEF200";
    x.fillRect(0, 0, 512, 1092);
    if (img.naturalWidth) {
      x.imageSmoothingQuality = "high";
      x.drawImage(img, 0, 300, 512, 512);
    }
    const d = new Date();
    x.textAlign = "center";
    x.fillStyle = "#111";
    x.font = "500 30px system-ui,sans-serif";
    x.fillText(d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }), 256, 150);
    x.font = "600 172px system-ui,sans-serif";
    x.fillText(String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"), 256, 300);
    pill(256, 48, 178, 50, "#000");
    for (let i = 0; i < 4; i++) x.fillRect(66 + i * 10, 48 - i * 4, 7, 6 + i * 4);
    x.strokeStyle = "#111";
    x.lineWidth = 2;
    x.strokeRect(420, 38, 34, 16);
    x.fillRect(423, 41, 24, 10);
    x.fillStyle = "rgba(17,17,17,.6)";
    [78, 434].forEach((cx) => {
      x.beginPath();
      x.arc(cx, 990, 38, 0, 6.283);
      x.fill();
    });
    x.fillStyle = "#fff";
    x.fillRect(70, 972, 16, 10);
    x.fillRect(73, 982, 10, 20);
    x.fillRect(420, 978, 28, 20);
    x.fillStyle = "#222";
    x.beginPath();
    x.arc(434, 988, 6, 0, 6.283);
    x.fill();
    pill(256, 1062, 176, 8, "#111");
    t.needsUpdate = true;
  }
  draw();
  img.addEventListener("load", draw);
  setInterval(draw, 30000);
  return t;
}

export function buildPhone(S: THREE.Scene, R: THREE.WebGLRenderer, logoUrl: string): PhoneRig {
  const phone = new THREE.Group();
  phone.visible = false;
  const parts: THREE.Object3D[] = [];
  try {
    S.environment = makeEnv(R);
  } catch {
    /* sem reflexos de ambiente, a cena continua funcionando */
  }
  const img = new Image();
  img.src = logoUrl;

  const M = (c: number, m: number, r: number, o: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial =>
    new THREE.MeshStandardMaterial({ color: c, metalness: m, roughness: r, ...o });
  const ti = M(0x3a3a3e, 1, 0.55, { roughnessMap: brushTex() });
  const dk = M(0x151517, 0.5, 0.5);
  const glass = M(0x020203, 0.2, 0.06);
  const al = M(0xb9bcc2, 0.9, 0.4);
  const pcb = M(0xffffff, 0.3, 0.6, { map: pcbTex() });
  const cu = M(0xb87333, 0.9, 0.35);
  const bk = M(0x000000, 0, 0.3);
  const wh = M(0xdddddd, 0, 0.8);
  const frost = new THREE.MeshPhysicalMaterial({
    color: 0x2d2d30,
    roughness: 0.8,
    roughnessMap: grainTex(),
    metalness: 0.15,
    clearcoat: 0.25,
    clearcoatRoughness: 0.5,
  });
  const W = 0.75;
  const H = 1.57;
  const D = 0.082;
  const put = (o: THREE.Object3D, z: number, off: number): THREE.Object3D => {
    o.position.z = z;
    o.userData = { z, o: off };
    parts.push(o);
    phone.add(o);
    return o;
  };
  const disc = (r: number, z: number, m: THREE.Material): THREE.Mesh => {
    const d = new THREE.Mesh(new THREE.CircleGeometry(r, 24).rotateY(Math.PI), m);
    d.position.z = z;
    return d;
  };

  // tela ligada, com a tela de bloqueio da loja
  const tela = new THREE.Group();
  tela.add(slab(W - 0.01, H - 0.01, 0.108, 0.012, glass));
  const sc = new THREE.Mesh(
    rrPlane(W - 0.04, H - 0.04, 0.092),
    new THREE.MeshBasicMaterial({ map: screenTex(img), toneMapped: false }),
  );
  sc.position.z = 0.0065;
  tela.add(sc);
  const sh = new THREE.Mesh(
    rrPlane(W - 0.04, H - 0.04, 0.092),
    M(0, 0, 0.04, { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  sh.position.z = 0.0072;
  tela.add(sh);
  const bp = slab(W - 0.05, H - 0.05, 0.09, 0.006, al);
  bp.position.z = -0.01;
  tela.add(bp);
  const fx = box(0.18, 0.05, 0.004, cu);
  fx.position.set(0, -0.7, -0.015);
  tela.add(fx);
  put(tela, 0.042, 1.3);

  // estrutura em titânio, botões, USB-C e alto-falantes
  const fr = new THREE.Group();
  fr.add(new THREE.Mesh(frameGeo(W, H, 0.115, D, 0.03), ti));
  ([[-1, 0.56, 0.04], [-1, 0.44, 0.07], [-1, 0.31, 0.07], [1, 0.42, 0.13]] as const).forEach(([s, y, h]) => {
    const b = box(0.012, h, 0.016, ti);
    b.position.set(s * (W / 2 + 0.002), y, 0);
    fr.add(b);
  });
  const pt = box(0.1, 0.01, 0.02, bk);
  pt.position.set(0, -H / 2, 0);
  fr.add(pt);
  for (let i = 0; i < 6; i++) {
    for (const s of [-1, 1]) {
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.01, 10), bk);
      h.position.set(s * (0.14 + i * 0.03), -H / 2 + 0.002, 0);
      fr.add(h);
    }
  }
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.01, 12), bk);
    p.position.set(s * 0.1, -H / 2 + 0.001, 0);
    fr.add(p);
  }
  put(fr, 0, 0);

  // placa principal
  const bd = new THREE.Group();
  bd.add(slab(0.6, 0.44, 0.03, 0.014, pcb));
  ([[-0.17, 0.07, 0.2, 0.14], [0.12, 0.07, 0.22, 0.14], [-0.1, -0.11, 0.26, 0.1], [0.2, -0.1, 0.1, 0.1]] as const).forEach(
    ([x, y, w, h]) => {
      const c = box(w, h, 0.012, al);
      c.position.set(x, y, 0.013);
      bd.add(c);
    },
  );
  const cn = box(0.08, 0.03, 0.008, cu);
  cn.position.set(0, -0.2, 0.011);
  bd.add(cn);
  for (const [x, y] of [[-0.28, 0.2], [0.28, 0.2], [-0.28, -0.2], [0.28, -0.2]] as const) {
    const sw = screw(al, bk);
    sw.position.set(x, y, 0.01);
    bd.add(sw);
  }
  bd.position.set(0, 0.46, 0);
  put(bd, -0.012, -0.55);

  // taptic engine
  const tp = new THREE.Group();
  tp.add(box(0.22, 0.1, 0.03, dk));
  const tc = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 16).rotateX(Math.PI / 2), al);
  tc.position.z = 0.018;
  tp.add(tc);
  tp.position.set(0.18, -0.66, 0);
  put(tp, -0.02, -0.7);

  // bateria com abas adesivas
  const bt = new THREE.Group();
  bt.add(box(0.52, 0.8, 0.026, al));
  const lb = box(0.3, 0.16, 0.002, dk);
  lb.position.set(0, 0.1, 0.014);
  bt.add(lb);
  for (const x of [-0.15, 0.15]) {
    const t = box(0.07, 0.12, 0.002, wh);
    t.position.set(x, -0.45, 0.014);
    bt.add(t);
  }
  const br = box(0.5, 0.05, 0.004, al);
  br.position.set(0, 0.34, 0.015);
  bt.add(br);
  for (const x of [-0.2, 0.2]) {
    const sw = screw(al, bk);
    sw.position.set(x, 0.34, 0.017);
    bt.add(sw);
  }
  const bc = box(0.12, 0.03, 0.006, cu);
  bc.position.set(0, 0.42, 0);
  bt.add(bc);
  bt.position.set(0, -0.2, 0);
  put(bt, -0.02, -0.85);

  // módulo de câmeras: três lentes
  const cam = new THREE.Group();
  cam.add(slab(0.37, 0.37, 0.07, 0.016, al));
  ([[-0.075, 0.075], [-0.075, -0.075], [0.075, 0]] as const).forEach(([x, y]) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.026, 28).rotateX(Math.PI / 2), ti));
    g.add(disc(0.056, -0.0135, glass));
    g.add(disc(0.03, -0.0142, M(0x1c1238, 0.3, 0.1)));
    g.position.set(x, y, -0.02);
    cam.add(g);
  });
  const shield = box(0.3, 0.3, 0.004, dk);
  shield.position.z = 0.0095;
  cam.add(shield);
  for (const [x, y] of [[-0.15, 0.15], [0.15, -0.15]] as const) {
    const sw = screw(al, bk);
    sw.position.set(x, y, 0.0115);
    cam.add(sw);
  }
  cam.position.set(-0.19, 0.55, 0);
  put(cam, -0.028, -1.15);

  // vidro traseiro fosco com plateau, flash, LiDAR e bobina de carga
  const back = new THREE.Group();
  back.add(slab(W - 0.015, H - 0.015, 0.108, 0.01, frost));
  const pl = slab(0.37, 0.37, 0.07, 0.014, frost);
  pl.position.set(-0.19, 0.55, -0.012);
  back.add(pl);
  const fl = disc(0.02, -0.0195, M(0xf2efe6, 0, 0.4));
  fl.position.set(-0.09, 0.67, -0.0195);
  back.add(fl);
  const ld = disc(0.03, -0.0195, bk);
  ld.position.set(-0.09, 0.43, -0.0195);
  back.add(ld);
  for (const r of [0.17, 0.135, 0.1]) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.006, 6, 48), cu);
    t.position.set(0, -0.15, 0.008);
    back.add(t);
  }
  put(back, -0.039, -1.6);

  S.add(phone);
  return { phone, parts };
}
