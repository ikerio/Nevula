/* Nevula demo — Monitor wall: send a live widget to a dedicated screen / full-screen monitoring center */
(function () {
  const t = window.NEV_HELP.t;
  const SERVICES = window.NEV_SERVICES;
  const byId = (id) => SERVICES.find((s) => s.id === id);
  const lang = () => window.NEV.getLang();
  const T = (es, en) => (lang() === "en" ? en : es);
  const rnd = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  const pick = (a) => a[rnd(0, a.length - 1)];
  const clock = (off) => new Date(Date.now() - (off || 0) * 1000).toTimeString().slice(0, 8);

  const CLIENTS = ["María L. Quintana", "Oficina Corporativa CDMX", "Residencial Polanco", "Farmacia del Valle", "Bodega Vallejo", "Depto. Condesa 4B"];
  const N_SCREENS = 5;
  let screens = ["monitoreo", "senior", "panico", "ambulancia", null]; // pre-wired control wall

  // ---- compact per-screen metric ----
  function metric(id) {
    const h = window.NEV_FLEET && window.NEV_FLEET.headline(id);
    if (h) return h;
    switch (id) {
      case "panico": return { big: "38", lbl: T("señales atendidas", "signals handled") };
      case "senior": return { big: rnd(70, 80) + "", lbl: "bpm · " + T("estable", "stable") };
      case "ambulancia": return { big: "3:40", lbl: "ETA · unidad A-07" };
      case "acceso": return { big: "22", lbl: T("aperturas hoy", "openings today") };
      case "video": return { big: "6", lbl: T("cámaras activas", "active cameras") };
      case "iot": return { big: "94%", lbl: T("flota online", "fleet online") };
      case "incendio": return { big: "8", lbl: T("zonas vigiladas", "zones watched") };
      case "geocerca": return { big: "4", lbl: T("activos en zona", "assets in zone") };
      default: return { big: "—", lbl: "" };
    }
  }
  function spark(color) {
    let pts = [], n = 16;
    for (let i = 0; i < n; i++) pts.push((i / (n - 1) * 100).toFixed(1) + "," + (16 + Math.random() * 8 - (i === n - 1 ? rnd(0, 6) : 0)).toFixed(1));
    return '<svg class="scr-spark" viewBox="0 0 100 26" preserveAspectRatio="none"><polyline points="' + pts.join(" ") + '" fill="none" stroke="' + color + '" stroke-width="1.4" opacity="0.8"/></svg>';
  }

  // ---- dock ----
  const dock = document.getElementById("monitorDock");
  function render() {
    const active = screens.filter(Boolean).length;
    dock.innerHTML =
      '<div class="mwall-head"><div class="l"><span class="ttl">' + T("Muro de monitores", "Monitor wall") + '</span>' +
      '<span class="badge badge-quiet"><span class="pip"></span>' + active + "/" + N_SCREENS + " " + T("pantallas", "screens") + '</span></div>' +
      '<button class="btn btn-ghost btn-sm" id="wallBtn"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.7" style="width:15px;height:15px;stroke:currentColor"><rect x="2" y="4" width="9" height="7" rx="1"/><rect x="13" y="4" width="9" height="7" rx="1"/><rect x="2" y="13" width="9" height="7" rx="1"/><rect x="13" y="13" width="9" height="7" rx="1"/></svg>' + T("Entrar a Modo Muro", "Enter Wall Mode") + '</button></div>' +
      '<div class="mwall-screens">' + screens.map((id, i) => screenCard(id, i)).join("") + '</div>';
    document.getElementById("wallBtn").onclick = enterWall;
    dock.querySelectorAll("[data-screen]").forEach((el) => {
      const i = +el.dataset.screen;
      if (screens[i]) el.onclick = () => openMonitor(screens[i], i);
    });
  }
  function screenCard(id, i) {
    if (!id) return '<div class="mscreen empty" data-screen="' + i + '"><span class="eh">' + T("Arrastra un widget aquí", "Drag a widget here") + '<br>' + T("Pantalla", "Screen") + " " + (i + 1) + '</span></div>';
    const s = byId(id), m = metric(id);
    return '<div class="mscreen" data-screen="' + i + '" style="--accent:' + s.accent + '">' +
      '<div class="scr-top"><span class="sd"></span><span class="sn">' + t(s) + '</span></div>' +
      '<div class="scr-body"><div class="big">' + m.big + '</div><div class="lbl">' + m.lbl + '</div></div>' +
      spark(s.accent) +
      '<span class="scr-exp"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.9"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg></span>' +
      '<span class="scr-num">PANTALLA ' + (i + 1) + '</span></div>';
  }

  // ---- big monitoring-center renderers ----
  function bigView(s) {
    const id = s.id;
    const kpiOf = (k, v, u) => '<div class="mon-kpi"><div class="k">' + k + '</div><div class="v" data-mk="' + (u || "") + '">' + v + (u ? '<small>' + u + '</small>' : '') + '</div></div>';
    let kpis = "", stage = "", feed = "", tick = function () {};

    function feedHTML(rows) { return rows.map((r) => '<div class="fr"><span class="fd" style="background:' + r.c + '"></span><span class="ftx"><span class="fp">' + r.p + '</span><span class="fm">' + r.m + '</span></span><span class="ft">' + r.t + '</span></div>').join(""); }

    if (id === "ambulancia" || id === "geocerca") {
      kpis = kpiOf("ETA", "3", ":40") + kpiOf(T("Unidad", "Unit"), "A-07") + kpiOf(T("En ruta", "En route"), "2") + kpiOf("SLA", "< 4", "min");
      stage = '<div class="mon-map"><div class="road" style="left:0;top:44%;width:100%;height:7px"></div><div class="road" style="left:36%;top:0;width:7px;height:100%"></div><div class="road" style="left:0;top:74%;width:100%;height:5px"></div><div class="route" style="left:20%;top:50%;width:46%"></div><div class="pin unit" style="left:18%;top:46%"></div><div class="pin unit" style="left:58%;top:70%"></div><div class="pin target" style="left:64%;top:28%"></div></div>';
      feed = feedHTML([{ c: "var(--crit)", p: T("Despacho · Emergencia médica", "Dispatch · Medical emergency"), m: "Polanco", t: clock(220) }, { c: "var(--ice-500)", p: T("Unidad A-07 en ruta", "Unit A-07 en route"), m: "4.2 km", t: clock(90) }, { c: "var(--ok)", p: T("Coordinación con 911", "911 coordination"), m: "CDMX", t: clock(40) }]);
      tick = (root) => { const eta = root.querySelector('[data-mk=":40"]'); if (eta) eta.innerHTML = rnd(1, 4) + '<small>:' + String(rnd(10, 59)).padStart(2, "0") + '</small>'; };
    } else if (id === "video") {
      kpis = kpiOf(T("Cámaras", "Cameras"), "6") + kpiOf(T("Detecciones IA", "AI detections"), "19") + kpiOf(T("Grabando", "Recording"), "2") + kpiOf("Uptime", "99.9", "%");
      const labs = ["LOBBY", "ESTAC.", "PERÍM. N", "PERÍM. S", "BODEGA", "AZOTEA"];
      stage = '<div class="mon-cams">' + labs.map((l, i) => '<div class="mon-cam">' + (i % 3 === 0 ? '<span class="rec"></span>' : '') + '<span class="cl">CAM-0' + (i + 1) + ' · ' + l + '</span></div>').join("") + '</div>';
      feed = feedHTML([{ c: "var(--orange-500)", p: T("Movimiento detectado · CAM-04", "Motion detected · CAM-04"), m: T("Validación IA", "AI validation"), t: clock(60) }, { c: "var(--ok)", p: T("Verificación completada", "Verification complete"), m: "CAM-01", t: clock(180) }]);
    } else if (id === "senior") {
      const ring = (pct, color, val, lbl) => { const r = 56, c = 2 * Math.PI * r, off = c * (1 - pct / 100); return '<div class="mon-ring"><svg viewBox="0 0 130 130"><circle cx="65" cy="65" r="' + r + '" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="9"/><circle cx="65" cy="65" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + off + '" transform="rotate(-90 65 65)"/></svg><div><div class="rv" data-mk="bpm">' + val + '</div><div class="rl">' + lbl + '</div></div></div>'; };
      kpis = kpiOf(T("Ritmo cardíaco", "Heart rate"), "74", "bpm") + kpiOf(T("Actividad", "Activity"), "68", "%") + kpiOf(T("Adherencia", "Adherence"), "91", "%") + kpiOf(T("Caídas", "Falls"), "0");
      stage = ring(78, "var(--cobalt-500)", "74", T("Ritmo cardíaco · BPM", "Heart rate · BPM")) +
        '<div class="mon-bar2" style="margin-top:22px">' +
        barLine(T("Actividad diaria", "Daily activity"), "68%", 68, "var(--cobalt-500)") +
        barLine(T("Adherencia a rutina", "Routine adherence"), "91%", 91, "var(--ok)") +
        barLine(T("Sueño nocturno", "Night sleep"), "7.2h", 80, "var(--ice-500)") + '</div>';
      feed = feedHTML([{ c: "var(--ok)", p: T("Sensor cocina · activo", "Kitchen sensor · active"), m: "Depto. Condesa 4B", t: clock(120) }, { c: "var(--ice-500)", p: T("Rutina matutina confirmada", "Morning routine confirmed"), m: "08:14", t: clock(300) }]);
      tick = (root) => { const v = root.querySelector('[data-mk="bpm"]'); if (v) v.textContent = rnd(68, 82); };
    } else if (id === "iot") {
      kpis = kpiOf("Online", "94", "%") + kpiOf(T("Dispositivos", "Devices"), "1,284") + kpiOf(T("Batería baja", "Low battery"), "3") + kpiOf("Offline", "2");
      stage = '<div class="mon-bar2">' +
        barLine("Simple Pack V4.0 · 12CA918", T("Señal 86%", "Signal 86%"), 86, "var(--ok)") +
        barLine("Simple Leak · 12C844C", T("Batería 41%", "Battery 41%"), 41, "var(--warn)") +
        barLine("Contacto Seco · 1F25089", T("Señal 92%", "Signal 92%"), 92, "var(--ok)") +
        barLine("Botón Rosa · 12CA918", T("Señal 78%", "Signal 78%"), 78, "var(--ice-500)") +
        barLine("GeoTrack · 1F0ED20", T("Señal 88%", "Signal 88%"), 88, "var(--ok)") + '</div>';
      feed = feedHTML([{ c: "var(--warn)", p: T("Batería baja · Simple Leak", "Low battery · Simple Leak"), m: "12C844C", t: clock(140) }, { c: "var(--ok)", p: T("Dispositivo reconectado", "Device reconnected"), m: "12CA918", t: clock(420) }]);
      tick = (root) => { const f = root.querySelectorAll(".mon-barline .bf")[0]; if (f) f.style.width = rnd(80, 96) + "%"; };
    } else {
      // panico / incendio / acceso — alert ticker monitor
      const counters = id === "incendio"
        ? kpiOf(T("Zonas OK", "Zones OK"), "8") + kpiOf(T("Alertas", "Alerts"), "0") + kpiOf("Temp.", "23", "°C") + kpiOf("SLA", "< 1", "min")
        : id === "acceso"
          ? kpiOf(T("Aperturas", "Openings"), "22") + kpiOf(T("Denegadas", "Denied"), "3") + kpiOf(T("Puertas", "Doors"), "7") + kpiOf("SLA", "< 30", "s")
          : kpiOf(T("Atendidas", "Handled"), "38") + kpiOf(T("En espera", "Pending"), "0") + kpiOf(T("Activas", "Active"), "1") + kpiOf("SLA", "52", "s");
      kpis = counters;
      const ev = id === "incendio"
        ? [{ c: "var(--ok)", p: T("Zona cocina · normal", "Kitchen zone · normal"), m: "23 °C" }, { c: "var(--ok)", p: T("Sensor térmico bodega · OK", "Warehouse thermal · OK"), m: "21 °C" }]
        : id === "acceso"
          ? [{ c: "var(--ok)", p: T("Acceso autorizado · Lobby", "Access granted · Lobby"), m: "Oficina Corporativa" }, { c: "var(--crit)", p: T("Acceso denegado · Estac.", "Access denied · Parking"), m: T("Tarjeta inválida", "Invalid card") }]
          : [{ c: "var(--crit)", p: T("Pánico Móvil · Asalto", "Mobile Panic · Assault"), m: pick(CLIENTS) }, { c: "var(--orange-500)", p: T("Botón Asistencia", "Assistance Button"), m: pick(CLIENTS) }];
      stage = '<div style="height:100%;display:flex;flex-direction:column"><div class="sh" style="font-family:var(--font-mono);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:14px">' + T("Flujo de señales en vivo", "Live signal stream") + '</div><div class="mon-feed" data-mainfeed style="flex:1">' + feedHTML(ev.map((e) => ({ c: e.c, p: e.p, m: e.m, t: clock(rnd(20, 300)) }))) + '</div></div>';
      feed = feedHTML([{ c: "var(--ink-500)", p: T("Evento clasificado", "Event classified"), m: T("Prioridad alta", "High priority"), t: clock(20) }, { c: "var(--ink-500)", p: T("Asignado a operador", "Assigned to operator"), m: "Diego Aranda", t: clock(30) }]);
      tick = (root) => {
        const mf = root.querySelector("[data-mainfeed]");
        if (mf && Math.random() > 0.5) {
          const types = id === "incendio" ? [{ c: "var(--ok)", p: T("Lectura normal", "Normal reading") }] : id === "acceso" ? [{ c: "var(--ok)", p: T("Acceso autorizado", "Access granted") }] : [{ c: "var(--crit)", p: T("Pánico Móvil · Asalto", "Mobile Panic · Assault") }, { c: "var(--orange-500)", p: T("Botón Asistencia", "Assistance Button") }];
          const ty = pick(types);
          const row = document.createElement("div"); row.className = "fr fresh";
          row.innerHTML = '<span class="fd" style="background:' + ty.c + '"></span><span class="ftx"><span class="fp">' + ty.p + '</span><span class="fm">' + pick(CLIENTS) + '</span></span><span class="ft">' + clock(0) + '</span>';
          mf.insertBefore(row, mf.firstChild);
          while (mf.children.length > 7) mf.removeChild(mf.lastChild);
        }
      };
    }
    return { kpis, stage, feed, tick };
  }
  function barLine(l, v, pct, color) { return '<div class="mon-barline"><div class="bl"><span>' + l + '</span><b>' + v + '</b></div><div class="bt"><div class="bf" style="width:' + pct + '%;background:' + color + '"></div></div></div>'; }

  // ---- overlay (single monitor) ----
  let overlay = null, ovTick = null, ovClock = null, curIdx = -1;
  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.getElementById("monOverlay");
    return overlay;
  }
  function monBar(s, idx) {
    return '<div class="mon-bar"><div class="mb-l"><span class="mb-ic">' + s.icon + '</span><div class="mb-t"><div class="mn">' + t(s) + '</div><div class="ms">' + T("Monitor de flota", "Fleet monitor") + ' · Central Horizonte 24/7 · ' + T("Pantalla", "Screen") + ' ' + (idx + 1) + '</div></div></div>' +
      '<div class="mb-r"><span class="live" style="color:#6fe3bf">' + T("En vivo", "Live") + '</span><span class="mon-clock" data-clock>' + clock(0) + '</span>' +
      '<button class="mon-btn" data-prev><svg viewBox="0 0 24 24" fill="none" stroke-width="1.9"><path d="M15 18l-6-6 6-6"/></svg></button>' +
      '<button class="mon-btn" data-next><svg viewBox="0 0 24 24" fill="none" stroke-width="1.9"><path d="M9 18l6-6-6-6"/></svg></button>' +
      '<button class="mon-btn" data-wall><svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><rect x="2" y="4" width="9" height="7" rx="1"/><rect x="13" y="4" width="9" height="7" rx="1"/><rect x="2" y="13" width="9" height="7" rx="1"/><rect x="13" y="13" width="9" height="7" rx="1"/></svg>' + T("Modo Muro", "Wall Mode") + '</button>' +
      '<button class="mon-btn" data-close><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>' + T("Cerrar", "Close") + '</button></div></div>';
  }
  function openMonitor(id, idx) {
    curIdx = idx;
    const s = byId(id);
    const spec = window.NEV_FLEET && window.NEV_FLEET.view(id);
    const ov = ensureOverlay();
    ov.classList.remove("wall");
    ov.style.setProperty("--accent", s.accent);
    if (!spec) { ov.innerHTML = monBar(s, idx) + '<div class="mon-body"></div>'; ov.classList.add("open"); ov.querySelector("[data-close]").onclick = closeOverlay; return; }
    let selId = spec.firstId;
    ov.innerHTML = monBar(s, idx) +
      '<div class="mon-body"><div class="mon-main">' +
        '<div class="mon-kpis">' + spec.kpis.map((k) => '<div class="mon-kpi"><div class="k">' + k.k + '</div><div class="v">' + k.v + (k.u ? '<small>' + k.u + '</small>' : '') + '</div></div>').join("") + '</div>' +
        '<div class="mon-stage list"><div class="mon-roster-head"><span>' + spec.title + '</span><span class="upper" style="color:rgba(255,255,255,0.4)">' + spec.roster.length + ' ' + T("registros", "records") + '</span></div>' +
        '<div class="mon-roster" data-roster>' + spec.roster.map((r) => '<div class="rost' + (r.id === selId ? " sel" : "") + '" data-ent="' + r.id + '">' + r.html + '</div>').join("") + '</div></div>' +
      '</div>' +
      '<div class="mon-side" data-detail>' + spec.detail(selId) + '</div></div>';
    ov.classList.add("open");
    ov.querySelector("[data-close]").onclick = closeOverlay;
    ov.querySelector("[data-wall]").onclick = enterWall;
    const assigned = screens.map((x, i) => x ? i : -1).filter((i) => i >= 0);
    ov.querySelector("[data-prev]").onclick = () => cycle(-1, assigned);
    ov.querySelector("[data-next]").onclick = () => cycle(1, assigned);
    ov.querySelectorAll(".rost").forEach((el) => el.onclick = () => {
      selId = el.dataset.ent;
      ov.querySelectorAll(".rost").forEach((x) => x.classList.toggle("sel", x === el));
      ov.querySelector("[data-detail]").innerHTML = spec.detail(selId);
    });
    startTick(ov, spec);
  }
  function cycle(dir, assigned) {
    if (assigned.length < 2) return;
    let p = assigned.indexOf(curIdx);
    p = (p + dir + assigned.length) % assigned.length;
    openMonitor(screens[assigned[p]], assigned[p]);
  }
  function startTick(ov, v) {
    stopTick();
    ovClock = setInterval(() => { const c = ov.querySelector("[data-clock]"); if (c) c.textContent = clock(0); }, 1000);
    ovTick = setInterval(() => { try { v.tick(ov); } catch (e) {} }, 2400);
  }
  function stopTick() { clearInterval(ovTick); clearInterval(ovClock); ovTick = ovClock = null; }
  function closeOverlay() { if (overlay) { overlay.classList.remove("open"); stopTick(); } }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && overlay && overlay.classList.contains("open")) closeOverlay(); });

  // ---- wall mode ----
  function enterWall() {
    const ov = ensureOverlay();
    stopTick();
    ov.classList.add("open", "wall");
    ov.innerHTML =
      '<div class="mon-bar"><div class="mb-l"><span class="mb-ic" style="color:#6fe3bf"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><rect x="2" y="4" width="9" height="7" rx="1"/><rect x="13" y="4" width="9" height="7" rx="1"/><rect x="2" y="13" width="9" height="7" rx="1"/><rect x="13" y="13" width="9" height="7" rx="1"/></svg></span><div class="mb-t"><div class="mn">' + T("Modo Muro · Centro de Control", "Wall Mode · Control Center") + '</div><div class="ms">Central Horizonte 24/7 · ' + screens.filter(Boolean).length + " " + T("pantallas activas", "active screens") + '</div></div></div>' +
      '<div class="mb-r"><span class="live" style="color:#6fe3bf">' + T("En vivo", "Live") + '</span><span class="mon-clock" data-clock>' + clock(0) + '</span><button class="mon-btn" data-close><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>' + T("Salir", "Exit") + '</button></div></div>' +
      '<div class="mon-body"><div class="mwall-grid">' + screens.map((id, i) => wallPanel(id, i)).join("") + '</div></div>';
    ov.querySelector("[data-close]").onclick = closeOverlay;
    ov.querySelectorAll("[data-wp]").forEach((el) => { const i = +el.dataset.wp; if (screens[i]) el.onclick = () => openMonitor(screens[i], i); });
    ovClock = setInterval(() => { const c = ov.querySelector("[data-clock]"); if (c) c.textContent = clock(0); }, 1000);
  }
  function wallPanel(id, i) {
    if (!id) return '<div class="wpanel empty" data-wp="' + i + '"><span class="eh">' + T("Pantalla", "Screen") + " " + (i + 1) + " · " + T("libre", "free") + '</span></div>';
    const s = byId(id), m = metric(id);
    return '<div class="wpanel" data-wp="' + i + '" style="--accent:' + s.accent + '"><div class="wt"><span class="sd"></span><span class="wn">' + t(s) + '</span></div>' +
      '<div class="wb"><div class="big">' + m.big + '</div><div class="lbl">' + m.lbl + '</div></div>' + spark(s.accent).replace("scr-spark", "scr-spark") + '<span class="wnum">P' + (i + 1) + '</span></div>';
  }

  // ---- public API for station.js drag engine ----
  window.NEV_MON = {
    screenAt(x, y) {
      const els = dock.querySelectorAll(".mscreen");
      for (let i = 0; i < els.length; i++) {
        const r = els[i].getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return +els[i].dataset.screen;
      }
      return -1;
    },
    highlight(idx) {
      dock.querySelectorAll(".mscreen").forEach((el) => el.classList.toggle("drop-target", +el.dataset.screen === idx && idx >= 0));
    },
    clearHighlight() { dock.querySelectorAll(".drop-target").forEach((el) => el.classList.remove("drop-target")); },
    assign(idx, id) {
      if (idx < 0 || idx >= N_SCREENS) return;
      screens[idx] = id;
      render();
      window.NEV.toast(T("Enviado a Pantalla", "Sent to Screen") + " " + (idx + 1) + " · " + t(byId(id)), null, { mono: T("monitor", "monitor") });
    },
    openService(id) {
      let idx = screens.indexOf(id);
      if (idx < 0) { idx = screens.indexOf(null); if (idx < 0) idx = 0; screens[idx] = id; render(); }
      openMonitor(id, idx);
    },
    relang() { render(); },
  };

  document.addEventListener("nev:lang", () => render());
  document.querySelectorAll("[data-lang-btn]").forEach((b) => b.addEventListener("click", () => setTimeout(render, 12)));

  render();
})();
