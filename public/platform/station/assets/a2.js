/* Nevula demo — Fleet views: each dedicated monitor is a roster of all entities (people / units / devices) with live status, and a detail panel for the selected one. */
(function () {
  const T = (es, en) => (window.NEV.getLang() === "en" ? en : es);
  const rnd = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  const pick = (a) => a[rnd(0, a.length - 1)];
  const clock = (off) => new Date(Date.now() - (off || 0) * 1000).toTimeString().slice(0, 8);
  const initials = (n) => n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const STATUS = {
    ok: { es: "Normal", en: "Normal", c: "#3fd6a0", bg: "rgba(43,185,138,0.18)" },
    attn: { es: "Atención", en: "Watch", c: "#f0bd55", bg: "rgba(224,169,59,0.2)" },
    alert: { es: "Alerta", en: "Alert", c: "#ff6a5d", bg: "rgba(224,72,59,0.22)" },
    disp: { es: "Disponible", en: "Available", c: "#3fd6a0", bg: "rgba(43,185,138,0.18)" },
    ruta: { es: "En ruta", en: "En route", c: "#5fb0ff", bg: "rgba(59,134,212,0.2)" },
    sitio: { es: "En sitio", en: "On site", c: "#f0bd55", bg: "rgba(224,169,59,0.2)" },
    fuera: { es: "Fuera de servicio", en: "Out of service", c: "#9aa6c0", bg: "rgba(150,160,180,0.18)" },
    online: { es: "Online", en: "Online", c: "#3fd6a0", bg: "rgba(43,185,138,0.18)" },
    low: { es: "Batería baja", en: "Low battery", c: "#f0bd55", bg: "rgba(224,169,59,0.2)" },
    offline: { es: "Offline", en: "Offline", c: "#ff6a5d", bg: "rgba(224,72,59,0.22)" },
  };
  function badge(st) { const s = STATUS[st]; return '<span class="rbadge" style="color:' + s.c + ';background:' + s.bg + '">' + T(s.es, s.en) + '</span>'; }
  function dot(st) { return '<span style="width:8px;height:8px;border-radius:50%;background:' + STATUS[st].c + ';box-shadow:0 0 7px ' + STATUS[st].c + '"></span>'; }

  // shared render helpers (dark theme)
  function ring(pct, color, val, lbl) {
    const r = 56, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
    return '<div class="mon-ring"><svg viewBox="0 0 130 130"><circle cx="65" cy="65" r="' + r + '" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="9"/><circle cx="65" cy="65" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + off + '" transform="rotate(-90 65 65)"/></svg><div><div class="rv" data-hr>' + val + '</div><div class="rl">' + lbl + '</div></div></div>';
  }
  function bar(l, v, pct, color) { return '<div class="mon-barline"><div class="bl"><span>' + l + '</span><b>' + v + '</b></div><div class="bt"><div class="bf" style="width:' + pct + '%;background:' + color + '"></div></div></div>'; }
  function rows(arr) { return '<div class="det-rows">' + arr.map((r) => '<div class="det-row"><span class="dk">' + r[0] + '</span><span class="dv">' + r[1] + '</span></div>').join("") + '</div>'; }
  function feed(arr) { return '<div class="mon-feed">' + arr.map((r) => '<div class="fr"><span class="fd" style="background:' + r.c + '"></span><span class="ftx"><span class="fp">' + r.p + '</span><span class="fm">' + r.m + '</span></span><span class="ft">' + r.t + '</span></div>').join("") + '</div>'; }
  function dhead(av, color, nm, sub, st) { return '<div class="det-head"><span class="da" style="background:' + (color || "rgba(255,255,255,0.1)") + '">' + av + '</span><div style="flex:1"><div class="dn">' + nm + '</div><div class="ds">' + sub + '</div></div>' + (st ? badge(st) : "") + '</div>'; }
  function sec(title) { return '<div class="det-sec">' + title + '</div>'; }

  // ===================== DATASETS =====================
  const SENIORS = [
    { id: "s1", n: "María Quintana", age: 82, zone: "Hipódromo Condesa", hr: 74, act: 68, adh: 91, sleep: "7.2h", st: "ok", dev: "Botón Rosa · 12CA918", addr: "Salvador Alvarado 8", ct: "Hija · 55 1022 3344", last: "Sensor cocina · 08:14" },
    { id: "s2", n: "Jorge Salazar", age: 78, zone: "Del Valle", hr: 88, act: 52, adh: 84, sleep: "6.1h", st: "attn", dev: "Simple Pack · 12C99BB", addr: "Av. Coyoacán 230", ct: "Hijo · 55 8841 1290", last: "Sin movimiento · 2h" },
    { id: "s3", n: "Carmen Robles", age: 85, zone: "Polanco", hr: 112, act: 20, adh: 70, sleep: "4.8h", st: "alert", dev: "Botón Rosa · 1F0AA8", addr: "Masaryk 400", ct: "Sobrina · 55 5544 1122", last: "Caída detectada · ahora" },
    { id: "s4", n: "Alberto Núñez", age: 74, zone: "Roma Norte", hr: 70, act: 81, adh: 95, sleep: "7.8h", st: "ok", dev: "Simple Pack · 1F0ED20", addr: "Orizaba 100", ct: "Esposa · 55 9087 6655", last: "Rutina matutina · 08:02" },
    { id: "s5", n: "Lucía Fuentes", age: 80, zone: "Coyoacán", hr: 76, act: 63, adh: 88, sleep: "6.9h", st: "ok", dev: "Botón Rosa · 12CA9F1", addr: "Centenario 24", ct: "Hija · 55 3322 8899", last: "Sensor sala · 09:21" },
    { id: "s6", n: "Roberto Mena", age: 88, zone: "Santa Fe", hr: 92, act: 44, adh: 79, sleep: "5.5h", st: "attn", dev: "Simple Pack · 1F25089", addr: "Vasco de Quiroga 3800", ct: "Hijo · 55 7711 0044", last: "Medicación omitida" },
    { id: "s7", n: "Esther Vidal", age: 76, zone: "Nápoles", hr: 72, act: 74, adh: 92, sleep: "7.4h", st: "ok", dev: "Botón Rosa · 12C844C", addr: "Dakota 95", ct: "Nieto · 55 6655 2200", last: "Sensor cocina · 08:40" },
    { id: "s8", n: "Tomás Aguirre", age: 83, zone: "Narvarte", hr: 80, act: 58, adh: 86, sleep: "6.5h", st: "ok", dev: "Simple Pack · 12CA77A", addr: "Eje 4 Sur 200", ct: "Hija · 55 1199 8877", last: "Rutina vespertina · 18:10" },
    { id: "s9", n: "Pilar Cano", age: 79, zone: "Escandón", hr: 75, act: 70, adh: 90, sleep: "7.0h", st: "ok", dev: "Botón Rosa · 1F0BB2", addr: "José Martí 45", ct: "Hijo · 55 4433 6611", last: "Sensor recámara · 07:55" },
    { id: "s10", n: "Rafael Ortiz", age: 81, zone: "Mixcoac", hr: 84, act: 49, adh: 82, sleep: "6.0h", st: "attn", dev: "Simple Pack · 12CB019", addr: "Augusto Rodín 12", ct: "Sobrino · 55 2200 5566", last: "Inactividad prolongada" },
  ];

  const AMBULANCES = [
    { id: "A-07", st: "ruta", crew: "Dr. Pérez · Paramédico Luna", veh: "Tipo II · BLS", asg: "Polanco · Emergencia médica", eta: "3:40", zone: "Polanco" },
    { id: "A-03", st: "sitio", crew: "Dra. Ríos · Paramédico Soto", veh: "Tipo III · ALS", asg: "Del Valle · Traslado", eta: "—", zone: "Del Valle" },
    { id: "A-05", st: "ruta", crew: "Dr. Vega · Paramédico Mora", veh: "Tipo II · BLS", asg: "Roma · Caída adulto mayor", eta: "6:10", zone: "Roma Norte" },
    { id: "A-01", st: "disp", crew: "Dr. Lara · Paramédico Cruz", veh: "Tipo III · ALS", asg: "—", eta: "—", zone: "Base Condesa" },
    { id: "A-02", st: "disp", crew: "Dra. Nava · Paramédico Gil", veh: "Tipo II · BLS", asg: "—", eta: "—", zone: "Base Polanco" },
    { id: "A-04", st: "disp", crew: "Dr. Ueda · Paramédico Paz", veh: "Tipo II · BLS", asg: "—", eta: "—", zone: "Base Sur" },
    { id: "A-06", st: "sitio", crew: "Dra. Lomelí · Paramédico Bru", veh: "Tipo III · ALS", asg: "Santa Fe · Estabilización", eta: "—", zone: "Santa Fe" },
    { id: "A-08", st: "fuera", crew: "—", veh: "Tipo II · BLS", asg: "Mantenimiento preventivo", eta: "—", zone: "Taller" },
  ];

  const PANIC = [
    { id: "2000-0001", client: "María L. Quintana", dev: "Botón Rosa · 12CA918", st: "alert", type: { es: "Pánico · Asalto", en: "Panic · Assault" }, addr: "Hipódromo Condesa", kw: "MARIA", time: "ahora" },
    { id: "0002", client: "Bodega Vallejo", dev: "FireSense · 1F0AA8", st: "alert", type: { es: "Pánico · Incendio", en: "Panic · Fire" }, addr: "Industrial Vallejo", kw: "FUEGO", time: "1 min" },
    { id: "7788", client: "Farmacia del Valle", dev: "Botón · 1F25089", st: "attn", type: { es: "Asistencia · sin respuesta", en: "Assistance · no answer" }, addr: "Del Valle", kw: "AYUDA", time: "4 min" },
    { id: "4000-9999", client: "Activo Valioso", dev: "GeoTrack · 1F0FAA8", st: "ok", type: { es: "Sin eventos", en: "No events" }, addr: "Cuauhtémoc", kw: "—", time: "—" },
    { id: "5010-9821", client: "Depto. Condesa 4B", dev: "Botón Móvil · 12CA9F1", st: "ok", type: { es: "Sin eventos", en: "No events" }, addr: "Av. Michoacán 50", kw: "—", time: "—" },
    { id: "9988", client: "Oficina Corporativa", dev: "Simple Pack · 12C844C", st: "ok", type: { es: "Sin eventos", en: "No events" }, addr: "Reforma 222", kw: "—", time: "—" },
    { id: "1463-0001", client: "Residencial Polanco", dev: "Contacto · 1F0ED20", st: "ok", type: { es: "Sin eventos", en: "No events" }, addr: "Masaryk 400", kw: "—", time: "—" },
  ];

  const DEVICES = [
    { id: "12CA918", model: "Botón Rosa V2", acc: "2000-0001", tele: "Geoloc WiFi", pct: 86, kind: "signal", st: "online", seen: "12 s" },
    { id: "12C99BB", model: "Simple Pack V4.0", acc: "2000-0001", tele: "Temperatura", pct: 41, kind: "batt", st: "low", seen: "1 min" },
    { id: "1F25089", model: "Contacto Seco", acc: "7788", tele: "Estado", pct: 92, kind: "signal", st: "online", seen: "8 s" },
    { id: "12C844C", model: "Simple Leak", acc: "9988", tele: "Húmedo/seco", pct: 18, kind: "batt", st: "low", seen: "3 min" },
    { id: "1F0AA8", model: "FireSense-01", acc: "0002", tele: "Humo + temp", pct: 0, kind: "signal", st: "offline", seen: "22 min" },
    { id: "1F0ED20", model: "GeoTrack-LTE", acc: "1463-0001", tele: "Ubicación", pct: 88, kind: "signal", st: "online", seen: "5 s" },
    { id: "12CA9F1", model: "Botón Móvil", acc: "5010-9821", tele: "Geoloc WiFi", pct: 78, kind: "signal", st: "online", seen: "18 s" },
    { id: "1F0FAA8", model: "GeoTrack-LTE", acc: "4000-9999", tele: "Ubicación", pct: 64, kind: "batt", st: "online", seen: "30 s" },
    { id: "12CB019", model: "Simple Pack V4.0", acc: "—", tele: "Inventario", pct: 100, kind: "signal", st: "online", seen: "—" },
    { id: "1F0BB2", model: "Botón Rosa V2", acc: "—", tele: "Inventario", pct: 100, kind: "signal", st: "online", seen: "—" },
  ];

  const ALARMS = [
    { id: "#8485", sev: "alert", ev: { es: "Ataque / Agresión · Botón Rosa", en: "Attack / Assault · Pink Button" }, acc: "2000-0001", client: "María L. Quintana", time: "11:04", state: { es: "En atención", en: "On attention" }, dev: "SMPLPCK4P · 12CA918", note: { es: "Mujer 25–35 años, cabello negro, 1.59 m, complexión delgada.", en: "Woman 25–35, black hair, 1.59 m, slim build." } },
    { id: "#9559", sev: "alert", ev: { es: "Pánico Móvil · Incendio", en: "Mobile Panic · Fire" }, acc: "0002", client: "Bodega Vallejo", time: "11:02", state: { es: "En atención", en: "On attention" }, dev: "FIRESENSE-01 · 1F0AA8", note: { es: "Humo confirmado por sensor térmico adyacente.", en: "Smoke confirmed by adjacent thermal sensor." } },
    { id: "#9550", sev: "attn", ev: { es: "Asistencia · sin respuesta", en: "Assistance · no answer" }, acc: "7788", client: "Farmacia del Valle", time: "10:58", state: { es: "Espera por tiempo", en: "Time hold" }, dev: "SMPLPCK4P · 1F25089", note: { es: "Pulsación sostenida en mostrador.", en: "Sustained press at counter." } },
    { id: "#8520", sev: "attn", ev: { es: "Temperatura sobre umbral", en: "Temperature over threshold" }, acc: "2000-0001", client: "María L. Quintana", time: "10:51", state: { es: "Espera por tiempo", en: "Time hold" }, dev: "Simple Pack · 12C99BB", note: { es: "Lectura 41 °C, umbral 38 °C.", en: "Reading 41 °C, threshold 38 °C." } },
    { id: "#8678", sev: "attn", ev: { es: "Activo en movimiento · Geocerca", en: "Asset in motion · Geofence" }, acc: "1463-0001", client: "Residencial Polanco", time: "10:44", state: { es: "Espera por tiempo", en: "Time hold" }, dev: "GeoTrack · 1F0ED20", note: { es: "Salió de geocerca a 42 km/h.", en: "Left geofence at 42 km/h." } },
    { id: "#8519", sev: "info", ev: { es: "Temperatura bajo umbral", en: "Temperature under threshold" }, acc: "2000-0001", client: "María L. Quintana", time: "10:39", state: { es: "En atención", en: "On attention" }, dev: "Simple Pack · 12C99BB", note: { es: "Lectura 4 °C, posible apertura de refrigerador.", en: "Reading 4 °C, possible fridge opening." } },
  ];

  const SEVC = { alert: "var(--crit)", attn: "var(--orange-500)", info: "var(--ice-500)", ok: "var(--ok)" };

  // ===================== VIEW SPECS =====================
  function kpi(k, v, u) { return { k, v, u }; }

  const VIEWS = {
    senior() {
      const alerts = SENIORS.filter((s) => s.st === "alert").length;
      const watch = SENIORS.filter((s) => s.st === "attn").length;
      return {
        title: T("Personas monitoreadas", "Monitored people"),
        kpis: [kpi(T("Monitoreados", "Monitored"), SENIORS.length), kpi(T("Normales", "Normal"), SENIORS.length - alerts - watch), kpi(T("En atención", "Watch"), watch), kpi(T("Alertas", "Alerts"), alerts)],
        roster: SENIORS.map((s) => ({ id: s.id, html: rostCard(initials(s.n), s.n, s.age + " " + T("años", "yrs") + " · " + s.zone, s.hr + " bpm", s.st) })),
        firstId: "s3",
        detail(id) {
          const s = SENIORS.find((x) => x.id === id) || SENIORS[0];
          const col = s.st === "alert" ? "var(--crit)" : s.st === "attn" ? "var(--orange-500)" : "var(--cobalt-500)";
          return dhead(initials(s.n), "linear-gradient(135deg,var(--cobalt-500),var(--cobalt-700))", s.n, s.age + " " + T("años", "yrs") + " · " + s.zone, s.st) +
            ring(Math.min(100, s.hr), col, s.hr, T("Ritmo cardíaco · BPM", "Heart rate · BPM")) +
            '<div class="mon-bar2" style="margin:16px 0">' + bar(T("Actividad diaria", "Daily activity"), s.act + "%", s.act, "var(--cobalt-500)") + bar(T("Adherencia", "Adherence"), s.adh + "%", s.adh, "var(--ok)") + bar(T("Sueño", "Sleep"), s.sleep, 80, "var(--ice-500)") + '</div>' +
            rows([[T("Dispositivo", "Device"), s.dev], [T("Dirección", "Address"), s.addr], [T("Contacto", "Contact"), s.ct], [T("Último movimiento", "Last movement"), s.last]]);
        },
        tick(root) { root.querySelectorAll("[data-hr]").forEach((e) => {}); const v = root.querySelector(".mon-side [data-hr]"); if (v) { const base = parseInt(v.textContent) || 74; v.textContent = Math.max(58, Math.min(120, base + rnd(-3, 3))); } },
      };
    },
    ambulancia() {
      const disp = AMBULANCES.filter((a) => a.st === "disp").length;
      const ruta = AMBULANCES.filter((a) => a.st === "ruta").length;
      const sitio = AMBULANCES.filter((a) => a.st === "sitio").length;
      return {
        title: T("Flota de ambulancias", "Ambulance fleet"),
        kpis: [kpi(T("Disponibles", "Available"), disp), kpi(T("En ruta", "En route"), ruta), kpi(T("En sitio", "On site"), sitio), kpi(T("Prom. respuesta", "Avg. response"), "8", "min")],
        roster: AMBULANCES.map((a) => ({ id: a.id, html: rostCard("🚑".length ? unitMark() : "", a.id, a.zone + " · " + a.veh, a.eta !== "—" ? "ETA " + a.eta : "—", a.st) })),
        firstId: "A-07",
        detail(id) {
          const a = AMBULANCES.find((x) => x.id === id) || AMBULANCES[0];
          return dhead(unitMark(), "rgba(224,72,59,0.2)", a.id, a.veh, a.st) +
            (a.st === "ruta" || a.st === "sitio" ? '<div class="det-map"><div class="mon-map" style="position:absolute;inset:0;border-radius:10px"><div class="road" style="left:0;top:48%;width:100%;height:5px"></div><div class="road" style="left:40%;top:0;width:5px;height:100%"></div><div class="route" style="left:22%;top:52%;width:40%"></div><div class="pin unit" style="left:20%;top:48%"></div><div class="pin target" style="left:60%;top:30%"></div></div></div>' : "") +
            rows([[T("Estado", "Status"), badge(a.st)], [T("Tripulación", "Crew"), a.crew], [T("Vehículo", "Vehicle"), a.veh], [T("Asignación", "Assignment"), a.asg], [T("ETA", "ETA"), a.eta], [T("Zona", "Zone"), a.zone]]) +
            sec(T("Bitácora de la unidad", "Unit log")) +
            feed(a.st === "ruta" ? [{ c: "var(--crit)", p: T("Despacho asignado", "Dispatch assigned"), m: a.asg, t: clock(220) }, { c: "var(--ice-500)", p: T("En ruta al sitio", "En route to site"), m: "4.2 km", t: clock(90) }] : a.st === "sitio" ? [{ c: "var(--orange-500)", p: T("Arribo al sitio", "Arrived on site"), m: a.zone, t: clock(300) }, { c: "var(--ok)", p: T("Paciente estabilizado", "Patient stabilized"), m: "—", t: clock(60) }] : [{ c: "var(--ok)", p: T("Unidad disponible en base", "Unit available at base"), m: a.zone, t: clock(600) }]);
        },
        tick(root) { const e = root.querySelectorAll(".rost"); },
      };
    },
    panico() {
      const active = PANIC.filter((p) => p.st === "alert").length;
      return {
        title: T("Suscriptores y señales", "Subscribers & signals"),
        kpis: [kpi(T("Suscriptores", "Subscribers"), PANIC.length), kpi(T("Eventos activos", "Active events"), active), kpi(T("Atendidos hoy", "Handled today"), 38), kpi("SLA", "52", "s")],
        roster: PANIC.map((p) => ({ id: p.id, html: rostCard(panicMark(), p.id + " · " + p.client, p.dev, p.st === "ok" ? "OK" : T(p.type.es, p.type.en), p.st) })),
        firstId: "2000-0001",
        detail(id) {
          const p = PANIC.find((x) => x.id === id) || PANIC[0];
          return dhead(panicMark(), p.st === "alert" ? "rgba(224,72,59,0.22)" : "rgba(255,255,255,0.1)", p.id, p.client, p.st) +
            rows([[T("Dispositivo", "Device"), p.dev], [T("Evento", "Event"), T(p.type.es, p.type.en)], [T("Dirección", "Address"), p.addr], [T("Palabra clave", "Keyword"), p.kw], [T("Hace", "Ago"), p.time]]) +
            sec(T("Señales recientes", "Recent signals")) +
            feed(p.st === "alert" ? [{ c: "var(--crit)", p: T(p.type.es, p.type.en), m: p.client, t: clock(20) }, { c: "var(--orange-500)", p: T("Llamada de verificación", "Verification call"), m: p.kw, t: clock(8) }] : [{ c: "var(--ok)", p: T("Prueba periódica · OK", "Routine test · OK"), m: p.client, t: clock(900) }]);
        },
        tick(root) {},
      };
    },
    iot() {
      const on = DEVICES.filter((d) => d.st === "online").length, low = DEVICES.filter((d) => d.st === "low").length, off = DEVICES.filter((d) => d.st === "offline").length;
      return {
        title: T("Flota de dispositivos IoT", "IoT device fleet"),
        kpis: [kpi(T("Online", "Online"), Math.round(on / DEVICES.length * 100), "%"), kpi(T("Total", "Total"), "1,284"), kpi(T("Batería baja", "Low battery"), low), kpi("Offline", off)],
        roster: DEVICES.map((d) => ({ id: d.id, html: rostBar(d.model, d.id + " · " + (d.acc === "—" ? T("inventario", "inventory") : "Cta " + d.acc), d.pct, d.kind, d.st) })),
        firstId: "12C99BB",
        detail(id) {
          const d = DEVICES.find((x) => x.id === id) || DEVICES[0];
          const col = d.st === "online" ? "var(--ok)" : d.st === "low" ? "var(--warn)" : "var(--crit)";
          return dhead(chipMark(), "rgba(43,185,138,0.18)", d.model, "ID " + d.id, d.st) +
            ring(d.pct, col, d.pct + "%", d.kind === "batt" ? T("Batería", "Battery") : T("Señal", "Signal")) +
            rows([[T("Modelo", "Model"), d.model], [T("Cuenta", "Account"), d.acc], [T("Telemetría", "Telemetry"), d.tele], [T("Estado", "Status"), badge(d.st)], [T("Última señal", "Last seen"), d.seen]]) +
            sec(T("Telemetría reciente", "Recent telemetry")) +
            feed([{ c: col, p: d.kind === "batt" ? T("Nivel de batería", "Battery level") + " " + d.pct + "%" : T("Intensidad de señal", "Signal strength") + " " + d.pct + "%", m: d.model, t: clock(12) }, { c: "var(--ice-500)", p: T("Heartbeat recibido", "Heartbeat received"), m: "MQTT", t: clock(60) }]);
        },
        tick(root) {},
      };
    },
    monitoreo() {
      const pend = ALARMS.filter((a) => a.state.es.indexOf("atención") < 0).length;
      return {
        title: T("Cola de monitoreo en vivo", "Live monitoring queue"),
        kpis: [kpi(T("Por atender", "To handle"), ALARMS.length), kpi(T("En espera", "On hold"), pend), kpi(T("Atendidas hoy", "Handled today"), 124), kpi("SLA", "< 90", "s")],
        roster: ALARMS.map((a) => ({ id: a.id, html: rostSev(a.id, T(a.ev.es, a.ev.en), "Cta " + a.acc + " · " + a.client, a.time, a.sev) })),
        firstId: "#8485",
        detail(id) {
          const a = ALARMS.find((x) => x.id === id) || ALARMS[0];
          return dhead(alarmMark(), "rgba(224,72,59,0.18)", a.id, T(a.ev.es, a.ev.en), null) +
            rows([[T("Cuenta", "Account"), a.acc + " · " + a.client], [T("Dispositivo", "Device"), a.dev], [T("Estado", "State"), '<span style="color:' + SEVC[a.sev] + '">' + T(a.state.es, a.state.en) + '</span>'], [T("Hora", "Time"), a.time]]) +
            sec(T("Nota activa", "Active note")) +
            '<div class="det-note">' + T(a.note.es, a.note.en) + '</div>' +
            '<a class="mon-btn" style="margin-top:14px;justify-content:center" href="../console/index.html"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' + T("Abrir en consola de operador", "Open in operator console") + '</a>';
        },
        tick(root) {},
      };
    },
  };
  // simpler fleet aliases
  VIEWS.geocerca = VIEWS.ambulancia;
  VIEWS.acceso = VIEWS.iot;
  VIEWS.incendio = VIEWS.panico;
  VIEWS.video = VIEWS.iot;

  // small inline marks for avatars
  function unitMark() { return '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7" style="width:18px;height:18px;stroke:#ff8a7d"><path d="M3 8h11v9H3z"/><path d="M14 11h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M7 10v4M5 12h4"/></svg>'; }
  function panicMark() { return '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7" style="width:18px;height:18px;stroke:#ffb199"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="M12 8v4M12 16h.01"/></svg>'; }
  function chipMark() { return '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7" style="width:18px;height:18px;stroke:#7fe3bf"><rect x="7" y="7" width="10" height="10" rx="1"/><path d="M10 2v3M14 2v3M10 19v3M14 19v3M2 10h3M2 14h3M19 10h3M19 14h3"/></svg>'; }
  function alarmMark() { return '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7" style="width:18px;height:18px;stroke:#ff8a7d"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>'; }

  // roster card variants
  function rostCard(av, nm, sub, val, st) {
    const isText = av && av.indexOf("<svg") < 0;
    return '<div class="ravatar">' + (isText ? av : av) + '</div><div class="rinfo"><div class="rn">' + nm + '</div><div class="rm">' + sub + '</div></div><div class="rstat"><div class="rval">' + val + '</div>' + badge(st) + '</div>';
  }
  function rostBar(nm, sub, pct, kind, st) {
    const col = st === "online" ? "var(--ok)" : st === "low" ? "var(--warn)" : "var(--crit)";
    return '<div class="rinfo" style="flex:1"><div class="rn">' + nm + '</div><div class="rm">' + sub + '</div><div class="mon-barline" style="margin-top:7px"><div class="bt"><div class="bf" style="width:' + pct + '%;background:' + col + '"></div></div></div></div><div class="rstat"><div class="rval" style="font-size:13px">' + (kind === "batt" ? "🔋" : "") + pct + '%</div>' + badge(st) + '</div>';
  }
  function rostSev(id, ev, sub, time, sev) {
    return '<span style="width:4px;align-self:stretch;border-radius:3px;background:' + SEVC[sev] + '"></span><div class="rinfo"><div class="rn">' + id + ' · ' + ev + '</div><div class="rm">' + sub + '</div></div><div class="rstat"><div class="rm">' + time + '</div></div>';
  }

  window.NEV_FLEET = {
    has: (id) => !!VIEWS[id],
    view: (id) => (VIEWS[id] ? VIEWS[id]() : null),
    summary(id) {
      const scol = (st) => (STATUS[st] ? STATUS[st].c : "var(--ink-400)");
      const dcol = (st) => st === "online" ? "var(--ok)" : st === "low" ? "var(--warn)" : "var(--crit)";
      const alarmByAcct = (acc) => { const a = ALARMS.find((x) => x.acc === acc); return a ? a.id : null; };
      const OPEN = T("Abrir en Monitoreo en Vivo", "Open in Live Monitoring");
      const VIEWDEV = T("Ver dispositivo en vivo", "View device live");
      switch (id) {
        case "senior": {
          const al = SENIORS.filter((s) => s.st === "alert").length, at = SENIORS.filter((s) => s.st === "attn").length;
          return { title: T("Personas en seguimiento", "People tracked"),
            stats: [{ k: T("Monitoreados", "Monitored"), v: SENIORS.length }, { k: T("En alerta", "Alert"), v: al + at, c: al ? "var(--crit)" : "var(--orange-600)" }, { k: "SLA", v: "<2m" }],
            rows: SENIORS.filter((s) => s.st !== "ok").concat(SENIORS.filter((s) => s.st === "ok")).slice(0, 3).map((s) => { const did = (s.dev.split("·")[1] || "").trim(); return { c: scol(s.st), p: s.n, m: s.zone, v: s.hr + " bpm", kind: "person",
              det: [[T("Estado", "Status"), T(STATUS[s.st].es, STATUS[s.st].en)], [T("Zona", "Zone"), s.zone], [T("Dispositivo", "Device"), s.dev], [T("Último", "Last"), s.last], [T("Contacto", "Contact"), s.ct]],
              link: { mode: "devices", target: did, label: VIEWDEV } }; }) };
        }
        case "ambulancia": case "geocerca": {
          const d = AMBULANCES.filter((a) => a.st === "disp").length, r = AMBULANCES.filter((a) => a.st === "ruta").length, si = AMBULANCES.filter((a) => a.st === "sitio").length;
          return { title: T("Unidades en operación", "Units in operation"),
            stats: [{ k: T("Disponibles", "Available"), v: d, c: "var(--ok)" }, { k: T("En ruta", "En route"), v: r, c: "var(--ice-500)" }, { k: T("En sitio", "On site"), v: si, c: "var(--orange-600)" }],
            rows: AMBULANCES.filter((a) => a.st !== "disp").slice(0, 3).map((a) => ({ c: STATUS[a.st].c, p: a.id + " · " + a.zone, m: a.crew.split("·")[0].trim(), v: a.eta !== "—" ? "ETA " + a.eta : T(STATUS[a.st].es, STATUS[a.st].en), kind: "unit",
              det: [[T("Estado", "Status"), T(STATUS[a.st].es, STATUS[a.st].en)], [T("Tripulación", "Crew"), a.crew], [T("Vehículo", "Vehicle"), a.veh], [T("Asignación", "Assignment"), a.asg], [T("ETA", "ETA"), a.eta]],
              link: { mode: "alarms", target: null, label: OPEN } })) };
        }
        case "panico": case "incendio": {
          const act = PANIC.filter((p) => p.st !== "ok").length;
          return { title: T("Señales recientes", "Recent signals"),
            stats: [{ k: T("Suscriptores", "Subs"), v: PANIC.length }, { k: T("Activos", "Active"), v: act, c: act ? "var(--crit)" : "var(--ok)" }, { k: T("Atendidas", "Handled"), v: 38 }],
            rows: PANIC.filter((p) => p.st !== "ok").concat(PANIC.filter((p) => p.st === "ok")).slice(0, 3).map((p) => ({ c: STATUS[p.st].c, p: p.client, m: p.id, v: p.st === "ok" ? "OK" : T(p.type.es, p.type.en), kind: "signal",
              det: [[T("Evento", "Event"), T(p.type.es, p.type.en)], [T("Cuenta", "Account"), p.id], [T("Dirección", "Address"), p.addr], [T("Palabra clave", "Keyword"), p.kw], [T("Hace", "Ago"), p.time]],
              link: { mode: "alarms", target: alarmByAcct(p.id), label: OPEN } })) };
        }
        case "iot": case "acceso": case "video": {
          const on = DEVICES.filter((d) => d.st === "online").length, low = DEVICES.filter((d) => d.st === "low").length, off = DEVICES.filter((d) => d.st === "offline").length;
          return { title: T("Salud de la flota", "Fleet health"),
            stats: [{ k: "Online", v: Math.round(on / DEVICES.length * 100) + "%", c: "var(--ok)" }, { k: T("Batería", "Battery"), v: low, c: "var(--warn)" }, { k: "Offline", v: off, c: off ? "var(--crit)" : "" }],
            rows: DEVICES.filter((d) => d.st !== "online").concat(DEVICES.filter((d) => d.st === "online")).slice(0, 3).map((d) => ({ c: dcol(d.st), p: d.model, m: d.id + " · Cta " + d.acc, v: d.st === "offline" ? "—" : d.pct + "%", kind: "device",
              det: [[T("Estado", "Status"), d.st], [T("Telemetría", "Telemetry"), d.tele], [T("Cuenta", "Account"), d.acc], [T("Última señal", "Last seen"), d.seen]],
              link: { mode: "devices", target: d.id, label: VIEWDEV } })) };
        }
        case "monitoreo": {
          return { title: T("Cola de alarmas", "Alarm queue"),
            stats: [{ k: T("Por atender", "To handle"), v: ALARMS.length, c: "var(--crit)" }, { k: T("En espera", "On hold"), v: ALARMS.filter((a) => a.sev === "attn").length }, { k: "SLA", v: "<90s" }],
            rows: ALARMS.slice(0, 3).map((a) => ({ c: SEVC[a.sev], p: a.id + " · " + T(a.ev.es, a.ev.en), m: "Cta " + a.acc, v: a.time, kind: "alarm",
              det: [[T("Cuenta", "Account"), a.acc + " · " + a.client], [T("Dispositivo", "Device"), a.dev], [T("Estado", "State"), T(a.state.es, a.state.en)], [T("Hora", "Time"), a.time]],
              link: { mode: "alarms", target: a.id, label: OPEN } })) };
        }
        default: return { title: "", stats: [], rows: [] };
      }
    },
    headline(id) {
      switch (id) {
        case "senior": return { big: String(SENIORS.length), lbl: T("monitoreados", "monitored") };
        case "ambulancia": case "geocerca": return { big: String(AMBULANCES.filter((a) => a.st === "disp").length), lbl: T("unidades libres", "units free") };
        case "panico": case "incendio": return { big: String(PANIC.filter((p) => p.st === "alert").length), lbl: T("eventos activos", "active events") };
        case "iot": case "acceso": case "video": return { big: "94%", lbl: T("flota online", "fleet online") };
        case "monitoreo": return { big: String(ALARMS.length), lbl: T("por atender", "to handle") };
        default: return { big: "—", lbl: "" };
      }
    },
  };
})();
