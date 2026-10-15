import { arte } from "./art";
import { CATS, DESTAQUES, DIFERENCIAIS, PRODUTOS, SITE, wa } from "./config";
import type { CatKey } from "./config";

type Filtro = CatKey | "todos";

const $ = <T extends HTMLElement = HTMLElement>(s: string): T => document.querySelector<T>(s)!;
const $$ = <T extends HTMLElement = HTMLElement>(s: string): T[] => [...document.querySelectorAll<T>(s)];
const ARROW = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
const ICONES = [
  '<path d="M4 5h16v11H9l-5 4z"/>',
  '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
  '<circle cx="12" cy="12" r="8"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  '<circle cx="12" cy="12" r="6"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>',
];
const norm = (s: string): string => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function initUI(): void {
  $$<HTMLAnchorElement>("[data-wa]").forEach((a) => {
    a.href = wa(a.dataset.wa ?? "");
    a.target = "_blank";
    a.rel = "noopener";
  });
  $$("[data-s]").forEach((e) => {
    const k = e.dataset.s as keyof typeof SITE;
    e.textContent = SITE[k] || "A configurar";
  });
  $("#ano").textContent = String(new Date().getFullYear());
  $("#dif").innerHTML = DIFERENCIAIS.map(
    (d, i) => `<li><svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONES[i] ?? ICONES[0]}</svg><span><b>${d.titulo}</b><span class="sr">${d.texto}</span></span></li>`,
  ).join("");
  $("#cats3").innerHTML = DESTAQUES.map(
    (d, i) => `<li><a class="c3 v${i + 1}" href="#catalogo" data-cat="${d.cat}"><span class="vis">${d.imagem ? `<img src="${d.imagem}" alt="" loading="lazy">` : arte(d.cat)}</span><span class="t">${CATS[d.cat]}</span><span class="go">${ARROW}</span></a></li>`,
  ).join("");

  // menu hambúrguer
  const mb = $("#mb");
  const mn = $("#menu");
  function toggleMenu(open?: boolean): void {
    const v = open === undefined ? !mn.classList.contains("open") : open;
    mn.classList.toggle("open", v);
    mb.setAttribute("aria-expanded", String(v));
    mb.setAttribute("aria-label", v ? "Fechar menu" : "Abrir menu");
    if (v) mn.querySelector<HTMLElement>("a")!.focus();
    else mb.focus();
  }
  mb.addEventListener("click", () => toggleMenu());
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mn.classList.contains("open")) toggleMenu(false);
  });
  mn.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("a")) toggleMenu(false);
  });

  // catálogo
  let cat: Filtro = "todos";
  let q = "";
  function drawChips(): void {
    const itens: [string, string][] = [["todos", "Todos"], ...(Object.entries(CATS) as [string, string][])];
    $("#chips").innerHTML = itens
      .map(([k, v]) => `<button type="button" data-k="${k}" aria-pressed="${k === cat}">${v}</button>`)
      .join("");
  }
  function render(): void {
    const lista = PRODUTOS.filter(
      (p) => (cat === "todos" || p.cat === cat) && norm(p.nome + " " + p.desc).includes(norm(q)),
    );
    $("#grid").innerHTML = lista
      .map(
        (p) => `<article class="card"><div class="pic" aria-hidden="true">${p.imagem ? `<img src="${p.imagem}" alt="" loading="lazy">` : arte(p.cat)}${p.exemplo !== false ? "<b>EXEMPLO</b>" : ""}</div><small>${CATS[p.cat]}</small><h3>${p.nome}</h3><p>${p.desc}</p><div class="row"><span>${p.preco}</span><a class="btn s" target="_blank" rel="noopener" href="${wa("Olá! Quero consultar a disponibilidade de: " + p.nome)}">CONSULTAR</a></div></article>`,
      )
      .join("");
    $("#empty").hidden = lista.length > 0;
    $("#count").textContent = `${lista.length} ${lista.every((p) => p.exemplo !== false) ? "itens de exemplo" : "itens"}`;
  }
  function setCat(c: Filtro): void {
    cat = c;
    drawChips();
    render();
  }
  $$<HTMLAnchorElement>("a[data-cat]").forEach((a) =>
    a.addEventListener("click", () => setCat(a.dataset.cat as Filtro)),
  );
  $("#chips").addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest("button");
    if (b) setCat(b.dataset.k as Filtro);
  });
  $<HTMLInputElement>("#q").addEventListener("input", (e) => {
    q = (e.target as HTMLInputElement).value;
    render();
  });
  $("#clr").addEventListener("click", () => {
    q = "";
    $<HTMLInputElement>("#q").value = "";
    setCat("todos");
  });
  drawChips();
  render();

  // "#iphone" fica dentro da cena fixa: leva a rolagem até o ponto em que o destaque aparece
  $$<HTMLAnchorElement>('a[href="#iphone"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const ex = $("#assistencia");
      scrollTo({ top: ex.offsetTop + 0.8 * (ex.offsetHeight - innerHeight), behavior: "smooth" });
    }),
  );

  // botão "Buscar" do cabeçalho: leva ao catálogo e coloca o foco no campo de busca
  $("#busca").addEventListener("click", () => {
    $("#catalogo").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => $<HTMLInputElement>("#q").focus({ preventScroll: true }), 700);
  });

  // brilho amarelo que acompanha o cursor nos cards (só em dispositivos com mouse)
  $("#grid").addEventListener("pointermove", (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>(".card");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  });

  // barra de progresso da página
  const prog = $(".prog");
  const outline = $(".outline");
  let tick = false;
  let max = 0;
  // scrollHeight força cálculo de layout: medir só quando o tamanho da página muda, não a cada rolagem
  const mede = (): void => {
    max = document.documentElement.scrollHeight - innerHeight;
  };
  mede();
  new ResizeObserver(mede).observe(document.body);
  const atualiza = (): void => {
    tick = false;
    if (scrollY < innerHeight * 1.5) outline.style.transform = `translate3d(0, ${Math.round(scrollY * 0.18)}px, 0)`;
    prog.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
  };
  addEventListener(
    "scroll",
    () => {
      if (!tick) {
        tick = true;
        requestAnimationFrame(atualiza);
      }
    },
    { passive: true },
  );

  // indicador amarelo da seção atual no menu
  const links = $$<HTMLAnchorElement>("nav.top a:not(.btn)");
  const io = new IntersectionObserver(
    (itens) => {
      itens.forEach((it) => {
        if (!it.isIntersecting) return;
        links.forEach((a) => {
          const on = a.getAttribute("href") === `#${it.target.id}`;
          a.classList.toggle("act", on);
          if (on) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  ["inicio", "assistencia", "catalogo", "contato"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  });

  reveal();
}

/** Revelação ao rolar: a hero entra quando a abertura termina; o resto, ao aparecer na tela. */
function reveal(): void {
  document.documentElement.classList.add("js");
  const marca = (sel: string, modo: string, passo: number): void =>
    $$(sel).forEach((el, i) => {
      el.setAttribute("data-reveal", modo);
      el.style.setProperty("--d", `${i * passo}ms`);
    });
  marca(".hc h1 span, .hc p.m, .hc .cta", "hero", 110);
  marca(".cats-intro > *", "", 90);
  marca("#cats3 li", "", 110);
  marca(".solid > .wrap > h2, .solid > .wrap > p, .split > *, .bar", "", 60);
  marca(".sv a", "", 70);
  marca(".f-top > *", "", 60);
  const io = new IntersectionObserver(
    (itens) =>
      itens.forEach((it) => {
        if (!it.isIntersecting) return;
        it.target.classList.add("in");
        io.unobserve(it.target);
      }),
    { rootMargin: "0px 0px -10% 0px" },
  );
  $$('[data-reveal=""]').forEach((el) => io.observe(el));
}
