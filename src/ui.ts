import { CATS, DIFERENCIAIS, PRODUTOS, SITE, wa } from "./config";
import type { CatKey } from "./config";

type Filtro = CatKey | "todos";

const $ = <T extends HTMLElement = HTMLElement>(s: string): T => document.querySelector<T>(s)!;
const $$ = <T extends HTMLElement = HTMLElement>(s: string): T[] => [...document.querySelectorAll<T>(s)];
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
  $("#dif").innerHTML = DIFERENCIAIS.map((d) => `<div><h3>${d.titulo}</h3><p>${d.texto}</p></div>`).join("");

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
        (p) => `<article class="card"><div class="pic" aria-hidden="true"><i></i><b>EXEMPLO</b></div><small>${CATS[p.cat]}</small><h3>${p.nome}</h3><p>${p.desc}</p><div class="row"><span>${p.preco}</span><a class="btn s" target="_blank" rel="noopener" href="${wa("Olá! Quero consultar a disponibilidade de: " + p.nome)}">CONSULTAR</a></div></article>`,
      )
      .join("");
    $("#empty").hidden = lista.length > 0;
    $("#count").textContent = `${lista.length} itens de exemplo`;
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
}
