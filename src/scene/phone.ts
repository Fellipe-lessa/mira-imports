import * as THREE from "three";

export interface PhoneRig {
  phone: THREE.Group;
  /** Peças que se afastam na vista explodida (userData: z de repouso e deslocamento). Cada uma tem `name`. */
  parts: THREE.Object3D[];
}

/**
 * Retângulo com cantos de curvatura contínua (os cantos do iPhone não são arcos de círculo).
 * Quanto menor `c` em relação a `k`, mais "squircle" fica o canto.
 */
function rr(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  const k = Math.min(r * 1.25, w / 2, h / 2);
  const c = k * 0.28;
  s.moveTo(x + k, y);
  s.lineTo(x + w - k, y);
  s.bezierCurveTo(x + w - c, y, x + w, y + c, x + w, y + k);
  s.lineTo(x + w, y + h - k);
  s.bezierCurveTo(x + w, y + h - c, x + w - c, y + h, x + w - k, y + h);
  s.lineTo(x + k, y + h);
  s.bezierCurveTo(x + c, y + h, x, y + h - c, x, y + h - k);
  s.lineTo(x, y + k);
  s.bezierCurveTo(x, y + c, x + c, y, x + k, y);
  return s;
}

const rect = (cx: number, cy: number, w: number, h: number): THREE.Path => {
  const p = new THREE.Path();
  p.moveTo(cx - w / 2, cy - h / 2);
  p.lineTo(cx + w / 2, cy - h / 2);
  p.lineTo(cx + w / 2, cy + h / 2);
  p.lineTo(cx - w / 2, cy + h / 2);
  p.closePath();
  return p;
};

/** Placa extrudada com cantos arredondados e furos opcionais. */
function slab(w: number, h: number, r: number, d: number, m: THREE.Material, holes: THREE.Path[] = []): THREE.Mesh {
  const s = rr(w, h, r);
  s.holes.push(...holes);
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 10 });
  g.translate(0, 0, -d / 2);
  return new THREE.Mesh(g, m);
}

/** Aro vazado (moldura fina). */
const ring = (w: number, h: number, r: number, d: number, hl: number, m: THREE.Material): THREE.Mesh =>
  slab(w, h, r, d, m, [rr(w - hl, h - hl, Math.max(r - hl / 2, 0.01))]);

const box = (w: number, h: number, d: number, m: THREE.Material): THREE.Mesh =>
  new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);

function rrPlane(w: number, h: number, r: number): THREE.ShapeGeometry {
  const g = new THREE.ShapeGeometry(rr(w, h, r), 12);
  const p = g.attributes.position;
  const u = g.attributes.uv;
  for (let i = 0; i < p.count; i++) u.setXY(i, (p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h);
  return g;
}

/** Moldura de titânio com chanfro, vazada no centro. */
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
    bevelSegments: 5,
    curveSegments: 12,
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

/** Rugosidade do titânio escovado. */
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

/** Rugosidade do vidro fosco traseiro. */
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
export function makeEnv(R: THREE.WebGLRenderer): THREE.Texture {
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

/** Tela de bloqueio: papel de parede escuro com a logo da loja, data e hora reais. */
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
    const bg = x.createRadialGradient(256, 560, 40, 256, 560, 640);
    bg.addColorStop(0, "#2a271c");
    bg.addColorStop(1, "#070706");
    x.fillStyle = bg;
    x.fillRect(0, 0, 512, 1092);
    const glow = x.createRadialGradient(256, 560, 80, 256, 560, 330);
    glow.addColorStop(0, "rgba(255,242,0,.22)");
    glow.addColorStop(1, "rgba(255,242,0,0)");
    x.fillStyle = glow;
    x.fillRect(0, 0, 512, 1092);
    if (img.naturalWidth) {
      x.save();
      x.beginPath();
      x.arc(256, 560, 170, 0, Math.PI * 2);
      x.clip();
      x.imageSmoothingQuality = "high";
      x.drawImage(img, 86, 390, 340, 340);
      x.restore();
    }
    const d = new Date();
    x.textAlign = "center";
    x.fillStyle = "#cfcabb";
    x.font = "500 30px system-ui,sans-serif";
    x.fillText(d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }), 256, 150);
    x.fillStyle = "#f4f1e8";
    x.font = "600 172px system-ui,sans-serif";
    x.fillText(String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"), 256, 300);
    pill(256, 48, 178, 50, "#000");
    x.fillStyle = "#f4f1e8";
    for (let i = 0; i < 4; i++) x.fillRect(66 + i * 10, 48 - i * 4, 7, 6 + i * 4);
    x.strokeStyle = "#f4f1e8";
    x.lineWidth = 2;
    x.strokeRect(420, 38, 34, 16);
    x.fillRect(423, 41, 24, 10);
    x.fillStyle = "rgba(255,255,255,.16)";
    [78, 434].forEach((cx) => {
      x.beginPath();
      x.arc(cx, 990, 38, 0, 6.283);
      x.fill();
    });
    x.fillStyle = "#f4f1e8";
    x.fillRect(70, 972, 16, 10);
    x.fillRect(73, 982, 10, 20);
    x.fillRect(420, 978, 28, 20);
    x.fillStyle = "#222";
    x.beginPath();
    x.arc(434, 988, 6, 0, 6.283);
    x.fill();
    pill(256, 1062, 176, 8, "#f4f1e8");
    t.needsUpdate = true;
  }
  draw();
  img.addEventListener("load", draw);
  setInterval(draw, 30000);
  return t;
}

/** Plano com a tela de bloqueio da loja, no tamanho w x h (usado no modelo procedural e no GLB). */
export function lockScreenMesh(w: number, h: number, r: number, logoUrl: string): THREE.Mesh {
  const img = new Image();
  img.src = logoUrl;
  return new THREE.Mesh(rrPlane(w, h, r), new THREE.MeshBasicMaterial({ map: screenTex(img), toneMapped: false }));
}

/**
 * iPhone procedural. Proporções externas do iPhone 15 Pro (70,6 x 146,6 x 8,25 mm) na escala 1,07
 * (1 unidade = 9,3 cm). Não é uma réplica técnica: a posição e o formato dos componentes internos
 * são representativos, e é por isso que existe a opção de carregar um modelo GLB (ver model.ts).
 */
export function buildPhone(S: THREE.Scene, R: THREE.WebGLRenderer, logoUrl: string): PhoneRig {
  const phone = new THREE.Group();
  phone.visible = false;
  const parts: THREE.Object3D[] = [];
  try {
    S.environment = makeEnv(R);
  } catch {
    /* sem reflexos de ambiente, a cena continua funcionando */
  }

  const M = (c: number, m: number, r: number, o: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial =>
    new THREE.MeshStandardMaterial({ color: c, metalness: m, roughness: r, ...o });
  const ti = M(0x2c2c30, 1, 0.5, { roughnessMap: brushTex(), envMapIntensity: 1.3 });
  const tiLight = M(0x6a6a70, 1, 0.35);
  const glass = M(0x020203, 0.1, 0.05);
  const oled = M(0x050506, 0.2, 0.4);
  const al = M(0xb9bcc2, 0.9, 0.4);
  const pcb = M(0xffffff, 0.3, 0.6, { map: pcbTex() });
  const cu = M(0xb87333, 0.9, 0.35);
  const bk = M(0x000000, 0, 0.3);
  const wh = M(0xdddddd, 0, 0.8);
  const dk = M(0x151517, 0.5, 0.5);
  const lensGlass = new THREE.MeshPhysicalMaterial({ color: 0x06060c, metalness: 0, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.02 });
  const frost = new THREE.MeshPhysicalMaterial({
    color: 0x242427,
    roughness: 0.8,
    roughnessMap: grainTex(),
    metalness: 0.12,
    clearcoat: 0.15,
    clearcoatRoughness: 0.6,
  });
  const gloss = new THREE.MeshPhysicalMaterial({ color: 0x2a2a2e, roughness: 0.22, metalness: 0.1, clearcoat: 0.8, clearcoatRoughness: 0.12 });

  const W = 0.756;
  const H = 1.57;
  const D = 0.088;
  const put = (name: string, o: THREE.Object3D, z: number, off: number): THREE.Object3D => {
    o.name = name;
    o.position.z = z;
    o.userData = { z, o: off };
    parts.push(o);
    phone.add(o);
    return o;
  };
  const disc = (r: number, z: number, m: THREE.Material): THREE.Mesh => {
    const d = new THREE.Mesh(new THREE.CircleGeometry(r, 28).rotateY(Math.PI), m);
    d.position.z = z;
    return d;
  };

  // ---- tela: vidro, painel OLED, placa traseira e flex ----
  const tela = new THREE.Group();
  tela.add(slab(W - 0.012, H - 0.012, 0.112, 0.012, glass));
  const sw = W - 0.044;
  const sh = H - 0.044;
  const sc = lockScreenMesh(sw, sh, 0.095, logoUrl);
  sc.position.z = 0.0065;
  tela.add(sc);
  const shine = new THREE.Mesh(
    rrPlane(sw, sh, 0.095),
    M(0, 0, 0.04, { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  shine.position.z = 0.0072;
  tela.add(shine);
  const cam0 = disc(0.011, 0.0074, M(0x0a0a1a, 0, 0.1));
  cam0.position.set(0.075, sh / 2 - (48 / 1092) * sh, 0.0074);
  tela.add(cam0);
  const panel = slab(W - 0.04, H - 0.04, 0.1, 0.008, oled);
  panel.position.z = -0.007;
  tela.add(panel);
  const bp = slab(W - 0.06, H - 0.06, 0.09, 0.006, al);
  bp.position.z = -0.013;
  tela.add(bp);
  const flex = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.7, -0.016), new THREE.Vector3(0, -0.78, -0.03), new THREE.Vector3(0.02, -0.8, -0.07)]),
      12,
      0.02,
      6,
      false,
    ),
    cu,
  );
  flex.scale.set(3, 1, 0.15);
  tela.add(flex);
  put("tela", tela, 0.04, 1.45);

  // ---- estrutura: moldura de titânio, botões, USB-C, alto-falantes e placa intermediária ----
  const fr = new THREE.Group();
  fr.add(new THREE.Mesh(frameGeo(W, H, 0.115, D, 0.03), ti));
  const side = (s: number, y: number, len: number): void => {
    const b = slab(0.016, len, 0.007, 0.014, ti);
    b.rotation.y = Math.PI / 2;
    b.position.set(s * (W / 2 + 0.002), y, 0);
    fr.add(b);
  };
  side(-1, 0.56, 0.04); // botão de ação
  side(-1, 0.44, 0.07); // volume
  side(-1, 0.31, 0.07);
  side(1, 0.42, 0.13); // botão lateral
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const a = box(0.004, 0.01, D - 0.012, bk);
      a.position.set(sx * (W / 2 + 0.0005), sy * 0.62, 0);
      fr.add(a);
      const b = box(0.01, 0.004, D - 0.012, bk);
      b.position.set(sx * 0.22, sy * (H / 2 + 0.0005), 0);
      fr.add(b);
    }
  }
  const usb = box(0.1, 0.014, 0.028, bk);
  usb.position.set(0, -H / 2 + 0.001, 0);
  fr.add(usb);
  for (let i = 0; i < 6; i++) {
    for (const s of [-1, 1]) {
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.01, 10), bk);
      h.position.set(s * (0.14 + i * 0.03), -H / 2 + 0.002, 0);
      fr.add(h);
    }
  }
  for (const s of [-1, 1]) {
    const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.01, 10), bk);
    mic.position.set(s * 0.1, -H / 2 + 0.002, 0);
    fr.add(mic);
  }
  const plate = slab(W - 0.07, 0.965, 0.085, 0.006, tiLight, [rect(0, 0.0575, 0.55, 0.82)]);
  plate.position.set(0, -0.2575, -0.03);
  fr.add(plate);
  put("frame", fr, 0, 0);

  // ---- placa principal ----
  const bd = new THREE.Group();
  bd.add(slab(0.62, 0.46, 0.03, 0.014, pcb));
  ([[-0.17, 0.07, 0.2, 0.14], [0.12, 0.07, 0.22, 0.14], [-0.1, -0.11, 0.26, 0.1], [0.2, -0.1, 0.1, 0.1]] as const).forEach(([x, y, w, h]) => {
    const c = box(w, h, 0.012, al);
    c.position.set(x, y, 0.013);
    bd.add(c);
  });
  const soc = box(0.11, 0.11, 0.012, dk);
  soc.position.set(0.12, 0.07, 0.025);
  bd.add(soc);
  const cn = box(0.08, 0.03, 0.008, cu);
  cn.position.set(0, -0.2, 0.011);
  bd.add(cn);
  for (const [x, y] of [[-0.29, 0.2], [0.29, 0.2], [-0.29, -0.2], [0.29, -0.2]] as const) {
    const s = screw(al, bk);
    s.position.set(x, y, 0.01);
    bd.add(s);
  }
  bd.position.set(0, 0.46, 0);
  put("placa", bd, -0.012, -0.6);

  // ---- taptic engine e alto-falante ----
  const tp = new THREE.Group();
  tp.add(box(0.22, 0.1, 0.018, dk));
  const tc = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 16).rotateX(Math.PI / 2), al);
  tc.position.z = 0.012;
  tp.add(tc);
  tp.position.set(0.2, -0.67, 0);
  put("taptic", tp, -0.014, -0.6);

  const sp = new THREE.Group();
  sp.add(box(0.2, 0.1, 0.018, M(0x232327, 0.4, 0.5)));
  for (let i = -2; i <= 2; i++) {
    const g = box(0.012, 0.07, 0.004, bk);
    g.position.set(i * 0.03, 0, 0.011);
    sp.add(g);
  }
  sp.position.set(-0.2, -0.67, 0);
  put("falante", sp, -0.014, -0.6);

  // ---- bateria com abas adesivas, suporte e conector ----
  const bt = new THREE.Group();
  bt.add(slab(0.52, 0.8, 0.045, 0.026, al));
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
    const s = screw(al, bk);
    s.position.set(x, 0.34, 0.017);
    bt.add(s);
  }
  const bc = box(0.12, 0.03, 0.006, cu);
  bc.position.set(0, 0.42, 0);
  bt.add(bc);
  bt.position.set(0, -0.2, 0);
  put("bateria", bt, -0.02, -0.95);

  // ---- módulo de câmeras: três lentes com anel, vidro e cúpula ----
  const cam = new THREE.Group();
  cam.add(slab(0.38, 0.38, 0.07, 0.018, al));
  const shield = box(0.3, 0.3, 0.004, dk);
  shield.position.z = 0.0105;
  cam.add(shield);
  for (const [x, y] of [[-0.15, 0.15], [0.15, -0.15]] as const) {
    const s = screw(al, bk);
    s.position.set(x, y, 0.0125);
    cam.add(s);
  }
  ([[-0.09, 0.09], [-0.09, -0.09], [0.075, 0]] as const).forEach(([x, y]) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.026, 32).rotateX(Math.PI / 2), tiLight).translateZ(-0.022));
    const rg = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.006, 8, 36), al);
    rg.position.z = -0.035;
    g.add(rg, disc(0.052, -0.0353, lensGlass), disc(0.03, -0.0357, M(0x1c1238, 0.3, 0.1)));
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.06, 28, 12, 0, Math.PI * 2, 0, 0.5).rotateX(-Math.PI / 2), lensGlass);
    dome.position.z = 0.0171;
    g.add(dome);
    g.position.set(x, y, 0);
    cam.add(g);
  });
  cam.position.set(-0.16, 0.55, 0);
  put("cam", cam, -0.032, -1.3);

  // ---- vidro traseiro fosco: plateau das câmeras, flash, LiDAR, microfone e bobina de carga ----
  const back = new THREE.Group();
  back.add(slab(W - 0.016, H - 0.016, 0.112, 0.01, frost));
  const pl = slab(0.4, 0.4, 0.082, 0.016, gloss);
  pl.position.set(-0.16, 0.55, -0.013);
  back.add(pl);
  const pr = ring(0.408, 0.408, 0.086, 0.02, 0.016, tiLight);
  pr.position.set(-0.16, 0.55, -0.013);
  back.add(pr);
  const fl = disc(0.02, -0.0215, M(0xf2efe6, 0, 0.4));
  fl.position.set(-0.02, 0.68, -0.0215);
  back.add(fl);
  const ld = disc(0.028, -0.0215, bk);
  ld.position.set(-0.02, 0.42, -0.0215);
  back.add(ld);
  const mc = disc(0.006, -0.0215, bk);
  mc.position.set(-0.01, 0.55, -0.0215);
  back.add(mc);
  for (const r of [0.17, 0.135, 0.1]) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.006, 6, 48), cu);
    t.position.set(0, -0.12, 0.0075);
    back.add(t);
  }
  const mag = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.008, 6, 64), tiLight);
  mag.position.set(0, -0.12, 0.0075);
  back.add(mag);
  put("back", back, -0.042, -1.8);

  S.add(phone);
  return { phone, parts };
}
