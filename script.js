// ===== CONFIGURACIÓN =====
const CONFIG = {
  SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSYfEsLTz7SXe2LUDNxwKDHN1sK0rjk1QZO630lAua1bgDu1QLbtrdA4Eq7qnxals_IFfpme_BTd4jI/pub?gid=67911114&single=true&output=csv",  // link del Google Sheets publicado como CSV (si está vacío usa menu.js)
  WHATSAPP: "5491153145892",       // ej: 5491112345678
  INSTAGRAM: "respofantasy2025",      // usuario sin @
  LANDING: ""         // link de la landing page (opcional)
};
const SERVICES = [
  { t: "Tortas personalizadas", d: "Diseñadas a tu medida.", i: "img/torta-boca.jpg" },
  { t: "Mesa dulce", d: "Dulces y alfajores para tu evento.", i: "img/alfajores.jpg" },
  { t: "Catering para eventos", d: "Opciones saladas y dulces." },
  { t: "Postres", d: "Para compartir en casa o en un evento.", i: "img/torta-merengue.jpg" },
  { t: "Desayunos personalizados", d: "Un desayuno armado a tu gusto.", i: "img/tostadas-cafe.jpg" }
];

const $ = s => document.querySelector(s);
let items = [], cat = "Todo";
const money = p => !p ? "" : isNaN(p) ? p : "$" + Number(p).toLocaleString("es-AR");
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function parseCSV(txt) {
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (q) { if (c === '"') { if (txt[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && txt[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  const [h, ...data] = rows;
  const keys = h.map(x => x.trim().toLowerCase());
  return data.filter(r => r.some(x => x.trim())).map(r => Object.fromEntries(keys.map((k, i) => [k, (r[i] || "").trim()])));
}

function load(txt) {
  items = parseCSV(txt.trim()).filter(i => i.nombre).map(i => ({ ...i, out: /^no$/i.test(i.disponible) }));
  if (cat !== "Todo" && !items.some(i => (i.categoria || "Otros") === cat)) cat = "Todo";
  const cats = ["Todo", ...new Set(items.map(i => i.categoria || "Otros"))];
  $("#cats").innerHTML = cats.map(c => `<button class="pill${c === cat ? " on" : ""}" data-c="${esc(c)}">${esc(c)}</button>`).join("");
  draw();
}

// Aparición suave al hacer scroll
const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { rootMargin: "0px 0px -5% 0px" }) : null;

function draw() {
  const q = $("#q").value.trim().toLowerCase();
  const list = items.filter(i => (cat === "Todo" || (i.categoria || "Otros") === cat) &&
    (!q || (i.nombre + " " + i.descripcion).toLowerCase().includes(q)));
  if (!list.length) { $("#menu").innerHTML = '<p class="msg">No encontramos productos.</p>'; return; }
  const groups = {};
  list.forEach(i => (groups[i.categoria || "Otros"] ??= []).push(i));
  $("#menu").innerHTML = Object.entries(groups).map(([g, arr]) =>
    `<section><h2 class="sec-title script">${esc(g)}</h2><div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">` +
    arr.map((i, k) => `<div class="col rv" style="--d:${(k % 6) * 60}ms"><button class="item${i.out ? " out" : ""}" data-n="${items.indexOf(i)}">` +
      `<span class="thumb">${i.imagen ? `<img src="${esc(i.imagen)}" alt="${esc(i.nombre)}" loading="lazy">` : esc(i.nombre[0].toUpperCase())}</span>` +
      `<span class="info"><b>${esc(i.nombre)}</b>${i.descripcion ? `<small>${esc(i.descripcion)}</small>` : ""}</span>` +
      `<span class="price">${i.out ? "Sin stock" : money(i.precio)}</span></button></div>`).join("") + "</div></section>").join("");
  document.querySelectorAll(".rv").forEach(el => io ? io.observe(el) : el.classList.add("in"));
}

$("#cats").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  cat = b.dataset.c;
  document.querySelectorAll("#cats button").forEach(x => x.classList.toggle("on", x === b));
  $("#cats").scrollTo({ left: b.offsetLeft - ($("#cats").clientWidth - b.offsetWidth) / 2, behavior: "smooth" });
  draw();
  $("#menu").scrollIntoView({ behavior: "smooth" });
});
$("#q").addEventListener("input", draw);
$("#menu").addEventListener("click", e => {
  const b = e.target.closest(".item"); if (!b) return;
  const i = items[b.dataset.n];
  $("#sheetBody").innerHTML = (i.imagen ? `<img src="${esc(i.imagen)}" alt="${esc(i.nombre)}">` : "") +
    `<div class="b"><h3>${esc(i.nombre)}</h3><span class="price d-inline-block my-2">${i.out ? "Sin stock hoy" : money(i.precio)}</span><p class="mb-0">${esc(i.descripcion)}</p></div>`;
  bootstrap.Modal.getOrCreateInstance($("#sheet")).show();
});

// Corazones en la cabecera (una sola vez al cargar)
$("#hearts").innerHTML = Array.from({ length: 14 }, () =>
  `<i style="left:${Math.random() * 100}%;font-size:${12 + Math.random() * 14}px;animation-delay:${Math.random() * 1.5}s">♥</i>`).join("");

// Pedidos y eventos: cada tarjeta abre WhatsApp si está configurado
const wa = t => `https://wa.me/${CONFIG.WHATSAPP}?text=${encodeURIComponent("Hola, quiero consultar por: " + t)}`;
$("#services").innerHTML = SERVICES.map(s => {
  const inner = `<span class="bg"${s.i ? ` style="background-image:url('${s.i}')"` : ""}></span><div class="t"><b>${esc(s.t)}</b><small>${esc(s.d)}</small></div>`;
  return `<div class="col">` + (CONFIG.WHATSAPP ? `<a class="svc" href="${wa(s.t)}">${inner}</a>` : `<div class="svc">${inner}</div>`) + `</div>`;
}).join("");
$("#links").innerHTML =
  (CONFIG.WHATSAPP ? `<a class="btn btn-ink rounded-pill px-4" href="${wa("un pedido")}">Consultar por WhatsApp</a>` : "") +
  (CONFIG.INSTAGRAM ? `<a class="btn btn-outline-ink rounded-pill px-4" href="https://instagram.com/${CONFIG.INSTAGRAM}">Instagram</a>` : "") +
  (CONFIG.LANDING ? `<a class="btn btn-outline-ink rounded-pill px-4" href="${CONFIG.LANDING}">Ver más</a>` : "");
if (!$("#links").innerHTML) $("#links").remove();

// Carga: caché primero (abre rápido), luego datos frescos del Sheet
const KEY = "respo_menu";
if (!CONFIG.SHEET_CSV_URL) load(MENU_CSV);
else {
  load(localStorage.getItem(KEY) || MENU_CSV);
  fetch(CONFIG.SHEET_CSV_URL + (CONFIG.SHEET_CSV_URL.includes("?") ? "&" : "?") + "t=" + Date.now())
    .then(r => r.text()).then(t => { localStorage.setItem(KEY, t); load(t); }).catch(() => { });
}
