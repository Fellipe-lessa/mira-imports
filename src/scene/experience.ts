import * as THREE from "three";
import { clamp, sm } from "./helpers";
import { buildPhone } from "./phone";
import { createIntro, INTRO_DISSOLVE, INTRO_END } from "./intro";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, fail) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = fail;
    i.src = src;
  });
}

/** Rótulos técnicos: peça (índice em parts) e janela de rolagem em que ficam visíveis. */
const TAGS: { part: number; w: [number, number] }[] = [
  { part: 0, w: [0.3, 0.4] }, // tela
  { part: 5, w: [0.4, 0.5] }, // câmeras
  { part: 4, w: [0.5, 0.6] }, // bateria
  { part: 2, w: [0.6, 0.7] }, // placa principal
];

/** Intervalos (progresso da seção de assistência) em que cada texto fica visível. */
const STAGES: [number, number][] = [[-1, 0.2], [0.2, 0.46], [0.46, 0.7], [0.7, 0.88], [0.88, 2]];

function createRenderer(canvas: HTMLCanvasElement, mob: boolean): THREE.WebGLRenderer | null {
  try {
    return new THREE.WebGLRenderer({ canvas, antialias: !mob, alpha: true });
  } catch {
    return null;
  }
}

/** Inicia a abertura e a cena do celular. Retorna false se o WebGL não estiver disponível. */
export async function startExperience(logoUrl: string): Promise<boolean> {
  const canvas = document.querySelector<HTMLCanvasElement>("#gl")!;
  const introEl = document.querySelector<HTMLElement>("#intro")!;
  const exEl = document.querySelector<HTMLElement>("#assistencia")!;
  const word = document.querySelector<HTMLElement>(".word")!;
  const band = document.querySelector<HTMLElement>(".band")!;
  const lgEl = document.querySelector<HTMLElement>("#lg")!;
  const stages = [...document.querySelectorAll<HTMLElement>(".st")];
  const tags = [...document.querySelectorAll<HTMLElement>(".tag")];
  const v3 = new THREE.Vector3();
  const legend = [...document.querySelectorAll<HTMLElement>("#lg li")];
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let mob = innerWidth < 760;

  const R = createRenderer(canvas, mob);
  if (!R) return false;
  const img = await loadImage(logoUrl).catch(() => null);
  if (!img) return false;

  const S = new THREE.Scene();
  const C = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  C.position.z = 6;
  R.outputEncoding = THREE.sRGBEncoding;
  R.toneMapping = THREE.ACESFilmicToneMapping;
  R.toneMappingExposure = 1.1;

  S.add(new THREE.AmbientLight(0xffffff, 0.3));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(2, 3, 4);
  const rim = new THREE.PointLight(0xfff200, 1.6, 12);
  rim.position.set(-3, 1, -2.5);
  const fill = new THREE.PointLight(0xffffff, 0.5, 10);
  fill.position.set(2, -2, 3);
  S.add(key, rim, fill);

  const tex = new THREE.TextureLoader().load(logoUrl);
  tex.encoding = THREE.sRGBEncoding;
  const { phone, parts } = buildPhone(S, R, logoUrl);
  const intro = createIntro(tex, img, mob);
  S.add(intro.group);

  let introOn = true;
  let lowQ = false;
  let frames = 0;
  let acc = 0;
  let baseZ = 6;
  let speed = 1;
  let tI = 0;
  let last = performance.now();
  let E = 0;
  let mx = 0;
  let my = 0;
  let tx = 0;
  let ty = 0;

  /** Libera a página: o site aparece enquanto a logo ainda se dispersa. */
  function revealHome(): void {
    document.body.classList.remove("intro");
    phone.visible = true;
  }

  function endIntro(): void {
    if (!introOn) return;
    introOn = false;
    revealHome();
    try {
      sessionStorage.setItem("mira", "1");
    } catch {
      /* armazenamento indisponível: a abertura volta na próxima visita */
    }
    S.remove(intro.group);
    intro.dispose();
    tex.dispose();
    baseZ = 6;
    C.position.z = 6;
  }

  function resize(): void {
    mob = innerWidth < 760;
    R!.setPixelRatio(lowQ ? 1 : Math.min(devicePixelRatio, mob ? 1.5 : 2));
    R!.setSize(innerWidth, innerHeight, false);
    C.aspect = innerWidth / innerHeight;
    C.updateProjectionMatrix();
    if (introOn) intro.group.scale.setScalar(Math.min(1, (3.78 * C.aspect * 0.9) / 4.2));
  }

  function scene(t: number, dt: number): void {
    // amortecimento independente da taxa de quadros: mesma sensação em 60 Hz e 144 Hz
    const k1 = 1 - Math.exp(-dt * 6);
    mx += (tx - mx) * k1;
    my += (ty - my) * k1;
    const len = Math.max(1, exEl.offsetHeight - innerHeight);
    const e = clamp((scrollY - exEl.offsetTop) / len);
    E += (e - E) * (RM ? 1 : 1 - Math.exp(-dt * 9));
    const a = sm(E, 0.12, 0.4) - sm(E, 0.6, 0.88);
    const k = mob ? 0.6 : 1;
    for (const o of parts) o.position.z = o.userData.z + o.userData.o * a * k;
    phone.position.set(mob ? 0 : 1.15, mob ? 0.75 : -0.05, 0);
    phone.scale.setScalar(mob ? 1.05 : 1.45);
    const idle = RM ? 0 : Math.sin(t * 0.5) * 0.3 + mx * 0.4;
    phone.rotation.y = idle * (1 - 0.7 * a) - 0.8 * a + sm(E, 0.9, 1) * 6.283;
    phone.rotation.x = 0.14 * a + (RM ? 0 : my * 0.12);
    const fade = String(clamp(1 - scrollY / (innerHeight * 0.8)));
    // câmera de inspeção: desloca e aproxima em direção à peça destacada
    const win = (i: number): number =>
      sm(E, TAGS[i].w[0] - 0.03, TAGS[i].w[0] + 0.02) * (1 - sm(E, TAGS[i].w[1] - 0.02, TAGS[i].w[1] + 0.03));
    let cx = 0;
    let cy = 0;
    let cw = 0;
    TAGS.forEach((tg, i) => {
      const w = win(i);
      parts[tg.part].getWorldPosition(v3);
      cx += v3.x * w;
      cy += v3.y * w;
      cw += w;
    });
    C.position.set(cx * (mob ? 0.2 : 0.4), cy * (mob ? 0.2 : 0.4), baseZ - cw * (mob ? 0.4 : 0.8));
    word.style.opacity = fade;
    band.style.opacity = fade;
    stages.forEach((s, i) => {
      const o = clamp(Math.min((E - STAGES[i][0]) / 0.04, (STAGES[i][1] - E) / 0.04));
      s.style.opacity = String(o);
      s.style.setProperty("--o", String(o));
      s.style.pointerEvents = o > 0.5 ? "auto" : "none";
    });
    const idx = E > 0.3 && E < 0.72 ? clamp(Math.floor(((E - 0.3) / 0.4) * 4), 0, 3) : -1;
    legend.forEach((l, i) => l.classList.toggle("on", i === idx));
    lgEl.style.opacity = a > 0.2 ? "1" : "0";

    // rótulos técnicos presos às peças
    C.updateMatrixWorld();
    TAGS.forEach((tg, i) => {
      const el = tags[i];
      if (!el) return;
      parts[tg.part].getWorldPosition(v3).project(C);
      el.style.opacity = String(win(i));
      el.style.transform = `translate(${((v3.x + 1) / 2) * innerWidth}px, ${((1 - v3.y) / 2) * innerHeight}px)`;
    });
  }

  function loop(now: number): void {
    requestAnimationFrame(loop);
    if (document.hidden) {
      last = now;
      return;
    }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (introOn) {
      tI += dt * speed;
      baseZ = intro.update(tI);
      introEl.classList.toggle("tg", tI > 3.6 && tI < INTRO_DISSOLVE);
      if (tI > INTRO_DISSOLVE + 0.7) revealHome();
      if (phone.visible) scene(now / 1000, dt);
      if (tI >= INTRO_END) endIntro();
    } else {
      scene(now / 1000, dt);
    }
    if (!phone.visible) C.position.z = baseZ;
    // qualidade adaptativa: se a média dos primeiros quadros for lenta, reduz a resolução
    if (!introOn && !lowQ && frames < 120) {
      acc += dt;
      if (++frames === 120 && acc / frames > 0.028) {
        lowQ = true;
        resize();
      }
    }
    // depois da seção do celular o catálogo cobre a tela: não há o que desenhar
    const covered = !introOn && scrollY >= exEl.offsetTop + exEl.offsetHeight - 32;
    if (!covered) R!.render(S, C);
  }

  // "Pular" acelera a abertura, que termina com a mesma dissolução, sem corte brusco
  document.querySelector("#skip")!.addEventListener("click", () => {
    speed = 4;
  });
  addEventListener("pointermove", (e) => {
    tx = e.clientX / innerWidth - 0.5;
    ty = e.clientY / innerHeight - 0.5;
  });
  addEventListener("resize", resize);
  addEventListener("pagehide", () => R.dispose());

  let skip = RM;
  try {
    if (sessionStorage.getItem("mira")) skip = true;
  } catch {
    /* sem sessionStorage */
  }
  resize();
  if (skip) endIntro();
  requestAnimationFrame(loop);
  return true;
}
