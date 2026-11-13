(() => {
"use strict";
const CFG = window.HEIGHT_CONFIG || {};
const $ = id => document.getElementById(id);
const MIN_CM = 100, MAX_CM = 230;
const COUNTRIES = ["Argentina","Australia","Austria","Belgium","Brazil","Bulgaria","Canada","Chile","China","Colombia","Croatia","Czechia","Denmark","Egypt","Estonia","Finland","France","Germany","Greece","Hungary","Iceland","India","Indonesia","Iran","Ireland","Israel","Italy","Japan","Kenya","Latvia","Lithuania","Malaysia","Mexico","Morocco","Netherlands","New Zealand","Nigeria","Norway","Pakistan","Peru","Philippines","Poland","Portugal","Romania","Serbia","Singapore","Slovakia","Slovenia","South Africa","South Korea","Spain","Sweden","Switzerland","Thailand","Turkey","Ukraine","United Kingdom","United States","Vietnam"];
const DEMO = [["Netherlands",183],["United Kingdom",177],["United States",175],["India",166],["Indonesia",158]];

let store = {};
try { store = JSON.parse(localStorage.getItem("height-v1") || "{}"); } catch (e) {}
const save = () => { try { localStorage.setItem("height-v1", JSON.stringify(store)); } catch (e) {} };
if (!store.unit) store.unit = "cm";
if (!store.key) { store.key = Array.from(crypto.getRandomValues(new Uint8Array(8)), b => b.toString(16).padStart(2, "0")).join(""); save(); }
let mode = "country", extraCodes = [], fileCodes = [], liveCodes = [];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const enc = s => encodeURIComponent(s.trim().slice(0, 40)).replace(/\./g, "%2E");
const dec = s => { try { return decodeURIComponent(s); } catch (e) { return s; } };

function encode(cm, country, name) { return "H1." + Math.round(cm * 10) + "." + enc(country) + "." + enc(name); }
function parse(code) {
  const m = /^H1\.(\d{3,4})\.([^.\s]*)\.([^.\s]*)$/.exec(code);
  if (!m) return null;
  const cm = +m[1] / 10;
  if (cm < MIN_CM || cm > MAX_CM) return null;
  return { cm, country: dec(m[2]).trim(), name: dec(m[3]).trim(), code };
}
const blocked = n => (CFG.blockedNames || []).some(w => norm(n).includes(norm(w)));

function fmtCm(cm) { return (Math.round(cm * 10) / 10).toString().replace(/\.0$/, "") + " cm"; }
function fmtIn(inches) { const i = Math.round(inches); return Math.floor(i / 12) + "′" + (i % 12) + "″"; }
const fmt = cm => store.unit === "cm" ? fmtCm(cm) : fmtIn(cm / 2.54);

// ---- form ----
function setUnit(u) {
  const cm = myCm();
  store.unit = u; save();
  $("u-cm").setAttribute("aria-pressed", u === "cm"); $("u-ft").setAttribute("aria-pressed", u === "ft");
  $("p-cm").hidden = u !== "cm"; $("p-ft").hidden = u !== "ft";
  $("h-label").htmlFor = u === "cm" ? "h-cm" : "h-ft";
  if (cm) fillHeight(cm);
  renderAll();
}
function fillHeight(cm) {
  $("h-cm").value = Math.round(cm * 10) / 10;
  const inches = cm / 2.54;
  $("h-ft").value = Math.floor(inches / 12);
  $("h-in").value = Math.round((inches % 12) * 10) / 10;
}
function myCm() {
  let cm;
  if (store.unit === "cm") { if ($("h-cm").value === "") return null; cm = parseFloat($("h-cm").value); }
  else { if ($("h-ft").value === "" && $("h-in").value === "") return null; cm = ((parseFloat($("h-ft").value) || 0) * 12 + (parseFloat($("h-in").value) || 0)) * 2.54; }
  return isFinite(cm) && cm >= MIN_CM && cm <= MAX_CM ? Math.round(cm * 10) / 10 : null;
}
const myCode = () => { const cm = myCm(); return cm ? encode(cm, $("country").value, $("name").value) : null; };
function formReady() { const f = CFG.form || {}; return !!(f.action && f.code && f.kind && f.key); }

function renderSend() {
  const ready = formReady(), code = myCode();
  $("send-off").hidden = ready;
  if (!ready) $("send-off").textContent = "Sending from this page isn't switched on yet. Tick the box, copy your code and send it to @" + CFG.ownerX + " on X.";
  const sentSame = store.sent && store.sent.code === code;
  $("send-btn").textContent = !ready ? "Copy my code" : store.sent && !sentSame ? "Send my updated result" : "Add me";
  $("send-btn").disabled = !$("consent").checked || !code || (ready && sentSame);
  $("remove-btn").hidden = !(ready && store.sent);
  if (sentSame) { $("send-status").className = "ok"; $("send-status").textContent = "Sent. It shows up on the chart within about ten minutes."; }
  else if (!code && ($("h-cm").value || $("h-ft").value)) { $("send-status").className = "err"; $("send-status").textContent = "Enter a height between 100 and 230 cm (3'4\" to 7'7\")."; }
  else if ($("send-status").className === "ok" || $("send-status").className === "err") $("send-status").textContent = "";
}
async function post(kind, code) {
  const f = CFG.form, body = new URLSearchParams();
  body.set(f.code, code); body.set(f.kind, kind); body.set(f.key, store.key);
  if (f.consent) body.set(f.consent, kind === "add" ? "Ticked: 16+, store name/country/height, show publicly, can be removed (consent v1) at " + new Date().toISOString() : "Removal requested at " + new Date().toISOString());
  await fetch(f.action, { method: "POST", mode: "no-cors", body });   // no-cors: we can't read the reply
}
$("send-btn").onclick = async () => {
  const code = myCode(); if (!code || !$("consent").checked) return;
  if (!formReady()) {
    try { await navigator.clipboard.writeText(code); $("send-status").className = "ok"; $("send-status").textContent = "Copied. Now send it to @" + CFG.ownerX + " on X."; }
    catch (e) { $("send-status").className = "note"; $("send-status").textContent = "Your code: " + code; }
    return;
  }
  $("send-btn").disabled = true; $("send-status").className = "note"; $("send-status").textContent = "Sending…";
  try { await post("add", code); store.sent = { code, at: Date.now() }; save(); }
  catch (e) { $("send-status").className = "err"; $("send-status").textContent = "Sending failed. Check your connection and try again."; $("send-btn").disabled = false; return; }
  renderSend(); renderAll();
};
$("remove-btn").onclick = async () => {
  if (!confirm("Remove your result from the chart?")) return;
  try { await post("remove", store.sent.code); delete store.sent; save(); $("send-status").className = "ok"; $("send-status").textContent = "Removal requested. It disappears within about ten minutes."; }
  catch (e) { $("send-status").className = "err"; $("send-status").textContent = "Removal failed. Try again."; }
  renderSend(); renderAll();
};

// ---- data ----
function allPeople() {
  const hidden = new Set(CFG.hiddenCodes || []);
  const codes = [...new Set([...fileCodes, ...liveCodes, ...extraCodes, ...(store.sent && !(store.removed) ? [store.sent.code] : [])])];
  return codes.filter(c => !hidden.has(c)).map(parse).filter(p => p && !blocked(p.name + " " + p.country));
}
function buildItems() {
  const people = allPeople(), mineSent = store.sent && store.sent.code;
  const preview = myCm() && myCode() !== mineSent ? { cm: myCm(), country: $("country").value.trim(), name: "You", preview: true } : null;
  let items = [];
  if (mode === "person") {
    items = people.map(p => ({ label: p.name || "Anonymous", sub: p.country, cm: p.cm, me: p.code === mineSent }));
    if (preview) items.push({ label: "You", sub: preview.country, cm: preview.cm, me: true });
  } else {
    const g = new Map();
    for (const p of people) { const k = norm(p.country) || "unknown"; if (!g.has(k)) g.set(k, { label: p.country || "Unknown", sum: 0, n: 0, me: false }); const e = g.get(k); e.sum += p.cm; e.n++; if (p.code === mineSent) e.me = true; }
    items = [...g.values()].map(e => ({ label: e.label, sub: "n = " + e.n, cm: e.sum / e.n, me: e.me }));
    if (preview) items.push({ label: "You", sub: preview.country || "", cm: preview.cm, me: true });
  }
  return items.sort((a, b) => b.cm - a.cm);
}

// ---- chart ----
function lerp(a, b, t) { return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }
function drawChart() {
  let items = buildItems(), demo = false;
  if (!items.length) { demo = true; items = DEMO.map(([c, cm]) => ({ label: c, sub: "example", cm })); }
  const unit = store.unit, dark = document.documentElement.dataset.theme === "dark";
  const toV = cm => unit === "cm" ? cm : cm / 2.54;
  const vals = items.map(i => toV(i.cm)), mn = Math.min(...vals), mx = Math.max(...vals), span = mx - mn;
  const steps = unit === "cm" ? [1, 2, 5, 10, 20] : [1, 2, 3, 6, 12];
  const step = steps.find(s => Math.ceil(span / s) + 3 <= 9) || steps[steps.length - 1];
  const lo = Math.floor(mn / step) * step - step;
  let hi = Math.ceil(mx / step) * step; if (hi - mx < step * 0.25) hi += step;
  const gv = lo - 1.6 * step;                         // "ground" sits below the axis: that's the funny scaling
  const slot = mode === "country" ? 120 : 92, left = 70, right = 20;
  const cw = $("chart-scroll").clientWidth || 700;
  const W = Math.max(cw, left + right + items.length * slot), H = 520, top = 24, ground = 430;
  const y = v => ground - (v - gv) / (hi - gv) * (ground - top);
  const ink = dark ? [138, 128, 224] : [122, 111, 208], low = dark ? [74, 69, 168] : [43, 40, 112];
  let s = '<defs><symbol id="p" viewBox="0 0 100 300" preserveAspectRatio="xMidYMax meet"><circle cx="50" cy="20" r="17"/><rect x="43" y="32" width="14" height="14"/><path d="M26 46 Q50 38 74 46 L75 138 L25 138 Z"/><path d="M27 48 L14 56 L6 142 L17 144 L27 84 Z"/><path d="M73 48 L86 56 L94 142 L83 144 L73 84 Z"/><path d="M25 132 L49 132 L47 296 L30 296 Z"/><path d="M51 132 L75 132 L70 296 L53 296 Z"/></symbol></defs>';
  s += '<circle class="blob" cx="' + (W / 2) + '" cy="' + ((top + ground) / 2) + '" r="' + Math.min(250, (W - left) * 0.5) + '"/>';
  for (let v = lo; v <= hi + 1e-9; v += step) {
    const yy = y(v), lab = unit === "cm" ? Math.round(v) + " cm" : fmtIn(v);
    s += '<line class="g" x1="' + left + '" x2="' + (W - right) + '" y1="' + yy + '" y2="' + yy + '"/><line class="tick" x1="' + (left - 6) + '" x2="' + left + '" y1="' + yy + '" y2="' + yy + '"/><text class="ax" x="' + (left - 10) + '" y="' + (yy + 4) + '" text-anchor="end">' + lab + '</text>';
  }
  s += '<line class="ground" x1="' + left + '" x2="' + (W - right) + '" y1="' + ground + '" y2="' + ground + '"/>';
  const inner = W - left - right;
  items.forEach((it, i) => {
    const cx = left + inner * (i + 0.5) / items.length, fh = ground - y(toV(it.cm)), fw = fh * 0.34, t = items.length > 1 ? i / (items.length - 1) : 0;
    const c = it.me ? null : lerp(ink, low, t), fill = it.me ? "var(--me)" : "rgb(" + c.join(",") + ")";
    s += '<use href="#p" x="' + (cx - fw / 2) + '" y="' + (ground - fh) + '" width="' + fw + '" height="' + fh + '" fill="' + fill + '"><title>' + esc(it.label) + ": " + fmtCm(it.cm) + " / " + fmtIn(it.cm / 2.54) + '</title></use>';
    const name = it.label.length > 14 ? it.label.slice(0, 13) + "…" : it.label;
    s += '<text class="nm" x="' + cx + '" y="' + (ground + 22) + '" text-anchor="middle">' + esc(name) + '</text><text class="vl" x="' + cx + '" y="' + (ground + 40) + '" text-anchor="middle">' + fmt(it.cm) + '</text>' + (it.sub ? '<text class="tt" x="' + cx + '" y="' + (ground + 56) + '" text-anchor="middle">' + esc(it.sub.length > 16 ? it.sub.slice(0, 15) + "…" : it.sub) + '</text>' : "");
  });
  const svg = $("chart"); svg.setAttribute("viewBox", "0 0 " + W + " " + H); svg.setAttribute("width", W); svg.setAttribute("height", H); svg.innerHTML = s;
  $("chart-note").textContent = demo ? "Example data: nobody has added a height yet. Be the first!" : (mode === "country" ? "Averages of everyone who added themselves. The orange one is you." : "Everyone who added themselves. The orange one is you.") + " " + allPeople().length + " in total.";
}
function renderAll() {
  $("m-country").setAttribute("aria-pressed", mode === "country"); $("m-person").setAttribute("aria-pressed", mode === "person");
  $("chart-title").textContent = mode === "country" ? "Average height per country" : "Everyone, tallest first";
  drawChart();
}

// ---- wiring ----
$("countries").innerHTML = COUNTRIES.map(c => '<option value="' + c + '">').join("");
$("x-link").href = "https://x.com/" + (CFG.ownerX || ""); $("x-link").textContent = "@" + (CFG.ownerX || "");
$("u-cm").onclick = () => setUnit("cm"); $("u-ft").onclick = () => setUnit("ft");
$("m-country").onclick = () => { mode = "country"; renderAll(); }; $("m-person").onclick = () => { mode = "person"; renderAll(); };
["name", "country", "h-cm", "h-ft", "h-in"].forEach(id => $(id).addEventListener("input", () => {
  store.name = $("name").value; store.country = $("country").value; const cm = myCm(); if (cm) store.cm = cm; save(); renderSend(); renderAll();
}));
$("consent").onchange = renderSend;
function setTheme(t) { document.documentElement.dataset.theme = t; $("theme").textContent = t === "dark" ? "Light" : "Dark"; $("theme").setAttribute("aria-label", "Switch to " + (t === "dark" ? "light" : "dark") + " mode"); store.theme = t; save(); drawChart(); }
$("theme").onclick = () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
document.documentElement.dataset.theme = store.theme || "light"; $("theme").textContent = store.theme === "dark" ? "Light" : "Dark";
$("name").value = store.name || ""; $("country").value = store.country || ""; if (store.cm) fillHeight(store.cm);
let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(drawChart, 150); });
setUnit(store.unit); renderSend();

async function refresh() {
  try { const r = await fetch("results.js", { cache: "no-cache" }); if (r.ok) { const t = await r.text(), i = t.indexOf("HEIGHT_RESULTS"); if (i >= 0) fileCodes = [...t.slice(i).matchAll(/"([^"\n]+)"/g)].map(m => m[1]); } } catch (e) {}
  if (CFG.liveCsv) try { const r = await fetch(CFG.liveCsv, { cache: "no-cache" }); if (r.ok) liveCodes = (await r.text()).split(/\r?\n/).map(l => l.replace(/^"|"$/g, "").trim()).filter(l => /^H1\./.test(l)); } catch (e) {}
  renderAll();
}
refresh(); setInterval(() => { if (document.visibilityState === "visible") refresh(); }, 60000);
window.HeightChart = { encode, parse, setExtra(c) { extraCodes = c; renderAll(); } };
})();
