/* Nevula demo — Station: drag/drop, KPIs, live ticking, upsell (v1) */
(function () {
  const t = window.NEV_HELP.t;
  const SERVICES = window.NEV_SERVICES;
  const byId = (id) => SERVICES.find((s) => s.id === id);
  const SLA_SEC = { acceso: 30, panico: 60, video: 60, incendio: 60, geocerca: 120, senior: 120, ambulancia: 240, iot: 9999, monitoreo: 90 };

  const ws = document.getElementById("workspace");
  const ghost = document.getElementById("dragGhost");
  const paletteSub = document.getElementById("paletteSubscribed");
  const paletteAvl = document.getElementById("paletteAvailable");
  const stackBars = document.getElementById("stackBars");

  let placed = ["panico", "senior", "ambulancia"]; // initial station
  const ticks = {}; // id -> {fn, body}

  // ---------- palette ----------
  function svcCard(s) {
    const locked = s.cat === "available";
    const inWs = placed.includes(s.id);
    const el = document.createElement("div");
    el.className = "svc" + (locked ? " locked" : "") + (inWs ? " placed-out" : "");
    el.style.setProperty("--accent", s.accent);
    el.style.setProperty("--accent-soft", s.soft);
    el.dataset.id = s.id;
    if (!locked && !inWs) el.dataset.draggable = "1";
    const grip = locked
      ? '<span class="grip" title="Activar"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span>'
      : '<span class="grip"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg></span>';
    el.innerHTML = '<span class="sic">' + s.icon + '</span><span class="smeta"><span class="snm">' + t(s) + '</span><span class="ssub">' + t({ es: s.sub.es, en: s.sub.en }) + '</span></span>' + grip;
    if (locked) el.addEventListener("click", () => openUpsell(s.id));
    return el;
  }
  function renderPalette() {
    paletteSub.innerHTML = ""; paletteAvl.innerHTML = "";
    paletteSub.style.display = "flex"; paletteSub.style.flexDirection = "column"; paletteSub.style.gap = "9px";
    paletteAvl.style.display = "flex"; paletteAvl.style.flexDirection = "column"; paletteAvl.style.gap = "9px";
    SERVICES.forEach((s) => {
      (s.cat === "subscribed" ? paletteSub : paletteAvl).appendChild(svcCard(s));
    });
  }

  // ---------- modules ----------
  function buildModule(s) {
    const w = s.widget();
    const el = document.createElement("div");
    el.className = "mod" + (s.wide ? " wide" : "");
    el.style.setProperty("--accent", s.accent);
    el.style.setProperty("--accent-soft", s.soft);
    el.dataset.id = s.id;
    el.innerHTML =
      '<div class="mhead" data-modhandle><span class="mic">' + s.icon + '</span>' +
      '<span class="mt"><span class="mn">' + t(s) + '</span><span class="ms"><span class="live" style="font-size:9px">' + t({ es: "en vivo", en: "live" }) + '</span> · ' + (SLA_SEC[s.id] < 9999 ? s.sla : t({ es: "telemetría", en: "telemetry" })) + '</span></span>' +
      '<button class="mexp" data-expand title="' + t({ es: "Enviar a monitor dedicado", en: "Send to dedicated monitor" }) + '"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg></button>' +
      '<button class="mx" title="' + t({ es: "Quitar de la estación", en: "Remove from station" }) + '"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>' +
      '<div class="mbody">' + w.html + '</div>';
    const body = el.querySelector(".mbody");
    ticks[s.id] = { fn: w.tick || function () {}, body };
    el.querySelector(".mx").addEventListener("click", () => removeModule(s.id));
    el.querySelector("[data-expand]").addEventListener("click", () => { if (window.NEV_MON) window.NEV_MON.openService(s.id); });
    requestAnimationFrame(() => { el.classList.add("justadded"); setTimeout(() => el.classList.remove("justadded"), 480); });
    return el;
  }

  function renderWorkspace() {
    // remove only module nodes; keep nothing else
    ws.innerHTML = "";
    Object.keys(ticks).forEach((k) => delete ticks[k]);
    if (placed.length === 0) {
      ws.innerHTML = '<div class="empty-hint"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.4"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><path d="M14 7h4a3 3 0 0 1 3 3v0M10 17H6a3 3 0 0 1-3-3v0"/></svg>' +
        '<div class="big">' + t({ es: "Tu estación está vacía", en: "Your station is empty" }) + '</div>' +
        '<div class="sm">' + t({ es: "Arrastra un servicio del catálogo para integrarlo como módulo en vivo.", en: "Drag a service from the catalog to plug it in as a live module." }) + '</div></div>';
      return;
    }
    placed.forEach((id) => ws.appendChild(buildModule(byId(id))));
  }

  function recompute() {
    let devices = 0, events = 0, svc = placed.length, sla = 9999;
    placed.forEach((id) => { const s = byId(id); devices += s.devices; events += s.events; sla = Math.min(sla, SLA_SEC[id]); });
    setKpi("kpi-svc", svc);
    setKpi("kpi-dev", devices);
    setKpi("kpi-evt", events);
    const slaEl = document.querySelector("[data-sla]");
    if (slaEl) slaEl.textContent = sla >= 9999 ? "—" : (sla < 60 ? "< " + sla + "s" : "< " + Math.round(sla / 60) + " min");
    // stack meter
    [...stackBars.children].forEach((b, i) => b.classList.toggle("on", i < svc));
    // palette placed flags
    document.querySelectorAll(".svc").forEach((c) => {
      const inWs = placed.includes(c.dataset.id);
      const locked = byId(c.dataset.id).cat === "available";
      c.classList.toggle("placed-out", inWs && !locked);
      if (inWs && !locked) c.removeAttribute("data-draggable"); else if (!locked) c.dataset.draggable = "1";
    });
  }
  function setKpi(id, val) {
    const el = document.querySelector("#" + id + " [data-val]");
    if (!el) return;
    const tile = document.getElementById(id);
    el.textContent = val;
    tile.classList.remove("bump"); void tile.offsetWidth; tile.classList.add("bump");
  }

  function addModule(id, index) {
    if (placed.includes(id)) return;
    if (typeof index !== "number" || index < 0 || index > placed.length) index = placed.length;
    placed.splice(index, 0, id);
    renderWorkspace(); recompute();
    const s = byId(id);
    window.NEV.toast(t({ es: "Servicio integrado", en: "Service plugged in" }) + " · " + t(s), null, { mono: "+" + (s.devices || 0) + " dev" });
  }
  function removeModule(id) {
    const el = ws.querySelector('.mod[data-id="' + id + '"]');
    if (el) { el.classList.add("leaving"); setTimeout(finish, 300); } else finish();
    function finish() {
      placed = placed.filter((x) => x !== id);
      renderWorkspace(); recompute();
    }
  }
  function moveModule(id, toIndex) {
    const cur = placed.indexOf(id);
    if (cur < 0) return;
    placed.splice(cur, 1);
    if (toIndex > cur) toIndex--;
    if (toIndex < 0) toIndex = 0; if (toIndex > placed.length) toIndex = placed.length;
    placed.splice(toIndex, 0, id);
    renderWorkspace(); recompute();
  }

  // ---------- drag engine (pointer based) ----------
  let drag = null;
  function clearIndicators() { ws.querySelectorAll(".mod-over-before").forEach((m) => m.classList.remove("mod-over-before")); }
  function computeDropIndex(x, y, excludeId) {
    const mods = [...ws.querySelectorAll(".mod")].filter((m) => m.dataset.id !== excludeId);
    clearIndicators();
    if (mods.length === 0) return { index: 0, before: null };
    let best = null, bestD = Infinity, bestBefore = true;
    mods.forEach((m) => {
      const r = m.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const d = Math.hypot(x - cx, y - cy);
      if (d < bestD) { bestD = d; best = m; bestBefore = (y < cy - 6) || (Math.abs(y - cy) <= r.height / 2 && x < cx); }
    });
    if (best) { if (bestBefore) best.classList.add("mod-over-before"); }
    const idInList = placed.filter((p) => p !== excludeId);
    let idx = idInList.indexOf(best.dataset.id);
    if (!bestBefore) idx += 1;
    // map back to full placed index
    return { index: bestBefore ? placed.indexOf(best.dataset.id) : placed.indexOf(best.dataset.id) + 1, before: bestBefore, target: best };
  }

  function startDrag(type, id, e) {
    drag = { type, id, moved: false };
    const s = byId(id);
    ghost.innerHTML = '<span style="width:18px;height:18px;display:inline-flex">' + s.icon + '</span>' + t(s);
    document.body.style.userSelect = "none";
    moveGhost(e);
  }
  function moveGhost(e) {
    ghost.style.transform = "translate(" + (e.clientX + 14) + "px," + (e.clientY + 12) + "px)";
  }

  document.addEventListener("pointerdown", (e) => {
    const handle = e.target.closest("[data-modhandle]");
    const svc = e.target.closest(".svc[data-draggable]");
    if (handle && !e.target.closest(".mx") && !e.target.closest(".mexp")) {
      const mod = handle.closest(".mod");
      startDrag("move", mod.dataset.id, e);
      mod.classList.add("dragging");
      e.preventDefault();
    } else if (svc) {
      startDrag("new", svc.dataset.id, e);
      svc.classList.add("dragging");
      e.preventDefault();
    }
  });

  document.addEventListener("pointermove", (e) => {
    if (!drag) return;
    if (!drag.moved) { drag.moved = true; ghost.style.opacity = "1"; }
    moveGhost(e);
    const overWs = ws.getBoundingClientRect();
    const inside = e.clientX >= overWs.left && e.clientX <= overWs.right && e.clientY >= overWs.top && e.clientY <= overWs.bottom;
    ws.classList.toggle("drop-active", inside);
    if (inside) computeDropIndex(e.clientX, e.clientY, drag.type === "move" ? drag.id : null);
    else clearIndicators();
    if (window.NEV_MON) window.NEV_MON.highlight(inside ? -1 : window.NEV_MON.screenAt(e.clientX, e.clientY));
  });

  document.addEventListener("pointerup", (e) => {
    if (!drag) return;
    const overWs = ws.getBoundingClientRect();
    const inside = e.clientX >= overWs.left && e.clientX <= overWs.right && e.clientY >= overWs.top && e.clientY <= overWs.bottom;
    const d = computeDropIndex(e.clientX, e.clientY, drag.type === "move" ? drag.id : null);
    if (inside) {
      if (drag.type === "new") addModule(drag.id, d.index);
      else moveModule(drag.id, d.index);
    } else if (window.NEV_MON) {
      const sc = window.NEV_MON.screenAt(e.clientX, e.clientY);
      if (sc >= 0) window.NEV_MON.assign(sc, drag.id);
    }
    ws.classList.remove("drop-active");
    clearIndicators();
    if (window.NEV_MON) window.NEV_MON.clearHighlight();
    ghost.style.opacity = "0";
    document.body.style.userSelect = "";
    document.querySelectorAll(".dragging").forEach((x) => x.classList.remove("dragging"));
    drag = null;
  });

  // ---------- upsell dialog ----------
  function openUpsell(id) {
    const s = byId(id);
    const scrim = document.createElement("div");
    scrim.className = "scrim";
    scrim.innerHTML =
      '<div class="dialog">' +
        '<div class="dhead"><div style="display:flex;align-items:center;gap:13px"><span style="width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:' + s.soft + ';color:' + s.accent + '">' + s.icon + '</span><div><div style="font-size:18px;font-weight:700;letter-spacing:-0.02em;color:var(--ink-100)">' + t(s) + '</div><div class="upper" style="margin-top:3px">' + t({ es: "Servicio del marketplace", en: "Marketplace service" }) + '</div></div></div></div>' +
        '<div class="dbody"><p style="margin:0 0 14px;font-size:14px;line-height:1.55;color:var(--ink-300)">' + t({ es: "Actívalo y se integra a tu estación al instante — protocolos, dispositivos y tableros listos. Sin instalación técnica.", en: "Activate it and it plugs into your station instantly — protocols, devices and dashboards ready. No technical install." }) + '</p>' +
          '<div class="statline"><div class="c"><div class="k">' + t({ es: "Dispositivos", en: "Devices" }) + '</div><div class="v">' + (s.devices || "—") + '</div></div><div class="c"><div class="k">SLA</div><div class="v" style="font-size:15px">' + s.sla + '</div></div><div class="c"><div class="k">' + t({ es: "Precio", en: "Price" }) + '</div><div class="v" style="font-size:15px">' + (s.price || "—") + '</div></div></div></div>' +
        '<div class="dfoot"><button class="btn btn-ghost" data-close data-es="Cancelar" data-en="Cancel">Cancelar</button><button class="btn btn-signal" data-activate><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="m13 2-9 12h7l-2 8 9-12h-7z"/></svg><span data-es="Activar servicio" data-en="Activate service">Activar servicio</span></button></div>' +
      '</div>';
    document.body.appendChild(scrim);
    requestAnimationFrame(() => scrim.classList.add("open"));
    window.NEV.setLang(window.NEV.getLang());
    const close = () => { scrim.classList.remove("open"); setTimeout(() => scrim.remove(), 250); };
    scrim.addEventListener("click", (ev) => { if (ev.target === scrim || ev.target.closest("[data-close]")) close(); });
    scrim.querySelector("[data-activate]").addEventListener("click", () => {
      s.cat = "subscribed";
      renderPalette(); recompute();
      close();
      window.NEV.toast(t({ es: "Servicio activado", en: "Service activated" }) + " · " + t(s), null, { mono: t({ es: "arrástralo →", en: "drag it →" }) });
    });
  }

  // ---------- live ticking ----------
  setInterval(() => {
    Object.keys(ticks).forEach((id) => { try { ticks[id].fn(ticks[id].body); } catch (e) {} });
    // nudge event KPI occasionally
    if (Math.random() > 0.6) {
      const el = document.querySelector("#kpi-evt [data-val]");
      if (el) el.textContent = parseInt(el.textContent || "0", 10) + 1;
    }
  }, 2600);

  // re-render text on language change
  document.querySelectorAll("[data-lang-btn]").forEach((b) => b.addEventListener("click", () => {
    setTimeout(() => { renderPalette(); renderWorkspace(); recompute(); }, 10);
  }));

  // init
  for (let i = 0; i < 8; i++) { const b = document.createElement("i"); stackBars.appendChild(b); }
  renderPalette();
  renderWorkspace();
  recompute();
})();
