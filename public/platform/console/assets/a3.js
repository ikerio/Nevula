/* Nevula demo — Operator console */
(function () {
  NEV.mountChrome({
    active: "monitor", crumbEs: "Monitoreo en Vivo", crumbEn: "Live Monitoring",
    user: "Diego Aranda", avatar: "DA", roleEs: "Operador · Turno A", roleEn: "Operator · Shift A",
    railFootTitle: "SLA crítico", railFootEs: "Reacción objetivo < 90 s en eventos de prioridad alta.", railFootEn: "Target reaction < 90 s on high-priority events."
  });
  const lang = () => NEV.getLang();
  const t = (es, en) => (lang() === "en" ? en : es);
  const clock = (off) => new Date(Date.now() - (off || 0) * 1000).toTimeString().slice(0, 8);

  const IC = {
    panic: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="M12 8v4M12 16h.01"/></svg>',
    temp: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><path d="M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0"/></svg>',
    fire: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><path d="M12 3c1 3 4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 11 9 9 12 3"/></svg>',
    motion: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><circle cx="12" cy="11" r="2.5"/><path d="M12 21c4-4.5 7-8 7-11a7 7 0 0 0-14 0c0 3 3 6.5 7 11"/></svg>',
    assist: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><path d="M9 11V6a1.5 1.5 0 0 1 3 0v4m0-1a1.5 1.5 0 0 1 3 0v1m0 0a1.5 1.5 0 0 1 3 0v3a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-3a1.6 1.6 0 0 1 2.6-1.8L9 13"/></svg>',
  };
  const SEV = {
    crit: { c: "var(--crit)", s: "var(--crit-soft)" },
    warn: { c: "var(--orange-600)", s: "var(--warn-soft)" },
    info: { c: "var(--ice-500)", s: "var(--info-soft)" },
  };

  // ---- IoT device fleet (integrated devices) ----
  const DSTAT = {
    online: { es: "Online", en: "Online", c: "#1c8d68", bg: "var(--ok-soft)" },
    low: { es: "Batería baja", en: "Low battery", c: "#9a6f17", bg: "var(--warn-soft)" },
    offline: { es: "Offline", en: "Offline", c: "#b32e22", bg: "var(--crit-soft)" },
  };
  const CHIP = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><rect x="7" y="7" width="10" height="10" rx="1"/><path d="M10 2v3M14 2v3M10 19v3M14 19v3M2 10h3M2 14h3M19 10h3M19 14h3"/></svg>';
  const DEVICES = [
    { id: "12CA918", model: "Botón Rosa V2", acc: "2000-0001", client: "María L. Quintana", tele: { es: "Geolocalización WiFi", en: "WiFi geolocation" }, proto: "BLE / LTE", pct: 86, kind: "signal", st: "online", seen: "12 s", zone: "Hipódromo Condesa", fw: "v2.3.1" },
    { id: "12C99BB", model: "Simple Pack V4.0", acc: "2000-0001", client: "María L. Quintana", tele: { es: "Temperatura", en: "Temperature" }, proto: "WiFi / Zigbee", pct: 41, kind: "batt", st: "low", seen: "1 min", zone: "Hipódromo Condesa", fw: "v4.0.7" },
    { id: "1F25089", model: "Contacto Seco RBS101", acc: "7788", client: "Farmacia del Valle", tele: { es: "Estado de puerta", en: "Door state" }, proto: "Zigbee", pct: 92, kind: "signal", st: "online", seen: "8 s", zone: "Del Valle", fw: "v1.2.0" },
    { id: "1F0AA8", model: "FireSense-01", acc: "0002", client: "Bodega Vallejo", tele: { es: "Humo + temperatura", en: "Smoke + temperature" }, proto: "Zigbee", pct: 0, kind: "signal", st: "offline", seen: "22 min", zone: "Industrial Vallejo", fw: "v1.1.4" },
    { id: "1F0ED20", model: "GeoTrack-LTE", acc: "1463-0001", client: "Residencial Polanco", tele: { es: "Ubicación en movimiento", en: "In-motion location" }, proto: "LTE / GLONASS", pct: 88, kind: "signal", st: "online", seen: "5 s", zone: "Polanco", fw: "v3.0.2" },
    { id: "12CA9F1", model: "Botón Móvil", acc: "5010-9821", client: "Depto. Condesa 4B", tele: { es: "Geolocalización WiFi", en: "WiFi geolocation" }, proto: "LTE / GPS", pct: 78, kind: "signal", st: "online", seen: "18 s", zone: "Condesa", fw: "v2.1.0" },
    { id: "12C844C", model: "Simple Leak", acc: "9988", client: "Oficina Corporativa", tele: { es: "Húmedo / seco", en: "Wet / dry" }, proto: "Zigbee", pct: 18, kind: "batt", st: "low", seen: "3 min", zone: "Reforma", fw: "v1.0.9" },
    { id: "1F0FAA8", model: "GeoTrack-LTE", acc: "4000-9999", client: "Activo Valioso", tele: { es: "Ubicación", en: "Location" }, proto: "LTE / GLONASS", pct: 64, kind: "batt", st: "online", seen: "30 s", zone: "Cuauhtémoc", fw: "v3.0.2" },
  ];
  let selectedDev = DEVICES[0].id;
  let leftMode = "alarms";

  // services come from the shared registry; a device's TYPE constrains which apply
  const SVC_OPTS = (window.NEV_STORE && NEV_STORE.services) || [
    { v: "panico", es: "Botón de Pánico", en: "Panic Button" },
    { v: "iot", es: "Salud de Dispositivos", en: "Device Health" },
  ];
  const capsOf = (model) => (window.NEV_STORE ? NEV_STORE.capsOf(model) : { fn: { es: "Sensor IoT", en: "IoT sensor" }, services: ["iot"] });
  const svcOf = (d) => d.service || capsOf(d.model).services[0];
  // pull marketplace-purchased devices into the live fleet
  function normStoreDev(s) {
    return { id: s.id, model: s.model, acc: s.acc || "—", client: s.client || "—",
      tele: { es: s.teleEs || "Telemetría", en: s.teleEn || "Telemetry" }, proto: s.proto || "—",
      pct: s.pct == null ? 100 : s.pct, kind: s.kind || "signal", st: s.st || "online",
      seen: s.seen || "ahora", zone: s.zone || "—", fw: s.fw || "v1.0.0", service: s.service,
      provisioned: !!s.provisioned, isNew: !s.provisioned };
  }
  function mergeStoreDevices() {
    if (!window.NEV_STORE) return;
    NEV_STORE.getDevices().forEach((s) => {
      const ex = DEVICES.find((x) => x.id === s.id);
      if (ex) Object.assign(ex, normStoreDev(s));
      else DEVICES.unshift(normStoreDev(s));
    });
  }
  function devColor(st) { return st === "online" ? "var(--ok)" : st === "low" ? "var(--warn)" : "var(--crit)"; }
  function dbadge(st) { const s = DSTAT[st]; return '<span class="dpill" style="color:' + s.c + ';background:' + s.bg + '">' + t(s.es, s.en) + '</span>'; }
  function devRing(pct, color, val, lbl) { const r = 34, c = 2 * Math.PI * r, off = c * (1 - pct / 100); return '<div class="dev-ring"><svg viewBox="0 0 84 84"><circle cx="42" cy="42" r="' + r + '" fill="none" stroke="rgba(10,15,31,0.1)" stroke-width="7"/><circle cx="42" cy="42" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + off + '" transform="rotate(-90 42 42)"/></svg><div><div class="rv">' + val + '</div><div class="rl">' + lbl + '</div></div></div>'; }
  function devBar(l, v, pct, color) { return '<div class="dbar"><div class="dbl"><span>' + l + '</span><b>' + v + '</b></div><div class="dbt"><div class="dbf" style="width:' + pct + '%;background:' + color + '"></div></div></div>'; }

  const NOTE = { es: "Mujer entre 25–35 años. Cabello negro largo al hombro. 1.59 m de estatura. Complexión delgada. Cara redondeada. Ojos negros. Tez apiñonada.", en: "Woman 25–35 years old. Long black hair to the shoulder. 1.59 m tall. Slim build. Round face. Black eyes. Tan complexion." };

  let ALARMS = [
    { id: "#8485", sev: "crit", icon: "panic", account: "2000-0001", client: "María L. Quintana Pérez", clientType: "Cliente IoT", event: { es: "Ataque / Agresión · Botón Rosa", en: "Attack / Assault · Pink Button" }, dtype: "SMPLPCK4P", did: "12CA918", dname: "BOTÓN ROSA", keyword: "MARIA", origin: { es: "Dispositivo IoT", en: "IoT device" }, prio: { es: "Alta", en: "High" }, note: NOTE, addr: "Salvador Alvarado 8, Hipódromo Condesa", state: { es: "En atención", en: "On attention" } },
    { id: "#8520", sev: "warn", icon: "temp", account: "2000-0001", client: "María L. Quintana Pérez", clientType: "Cliente IoT", event: { es: "Temperatura por encima del umbral A", en: "Temperature above threshold A" }, dtype: "Simple Pack V4.0", did: "12C99BB", dname: "SENSOR COCINA", keyword: "—", origin: { es: "Sensor IoT", en: "IoT sensor" }, prio: { es: "Media", en: "Medium" }, note: { es: "Lectura 41 °C. Umbral configurado 38 °C. Verificar con cliente.", en: "Reading 41 °C. Configured threshold 38 °C. Verify with client." }, addr: "Salvador Alvarado 8, Hipódromo Condesa", state: { es: "Desde espera por tiempo", en: "From time hold" } },
    { id: "#9559", sev: "crit", icon: "fire", account: "0002", client: "Bodega Vallejo", clientType: "Cliente IoT", event: { es: "Pánico Móvil · Incendio", en: "Mobile Panic · Fire" }, dtype: "FIRESENSE-01", did: "1F0AA8", dname: "SENSOR HUMO", keyword: "FUEGO", origin: { es: "Dispositivo IoT", en: "IoT device" }, prio: { es: "Alta", en: "High" }, note: { es: "Activación de pánico con código de incendio. Humo confirmado por sensor térmico adyacente.", en: "Panic activation with fire code. Smoke confirmed by adjacent thermal sensor." }, addr: "Av. Vallejo 1200, Industrial Vallejo", state: { es: "En atención", en: "On attention" } },
    { id: "#9550", sev: "crit", icon: "assist", account: "7788", client: "Farmacia del Valle", clientType: "Cliente IoT", event: { es: "Ataque / Agresión · Botón de Asistencia", en: "Attack / Assault · Assistance Button" }, dtype: "SMPLPCK4P", did: "1F25089", dname: "BOTÓN MOSTRADOR", keyword: "AYUDA", origin: { es: "Dispositivo IoT", en: "IoT device" }, prio: { es: "Alta", en: "High" }, note: { es: "Pulsación sostenida en mostrador. Sin respuesta a llamada de verificación.", en: "Sustained press at counter. No answer to verification call." }, addr: "Av. Coyoacán 230, Del Valle", state: { es: "Desde espera por tiempo", en: "From time hold" } },
    { id: "#8519", sev: "info", icon: "temp", account: "2000-0001", client: "María L. Quintana Pérez", clientType: "Cliente IoT", event: { es: "Temperatura por debajo del umbral A", en: "Temperature below threshold A" }, dtype: "Simple Pack V4.0", did: "12C99BB", dname: "SENSOR COCINA", keyword: "—", origin: { es: "Sensor IoT", en: "IoT sensor" }, prio: { es: "Baja", en: "Low" }, note: { es: "Lectura 4 °C. Posible apertura prolongada de refrigerador.", en: "Reading 4 °C. Possible prolonged fridge opening." }, addr: "Salvador Alvarado 8, Hipódromo Condesa", state: { es: "En atención", en: "On attention" } },
    { id: "#8678", sev: "warn", icon: "motion", account: "1463-0001", client: "Residencial Polanco", clientType: "Cliente IoT", event: { es: "Activo en movimiento · Geocerca", en: "Asset in motion · Geofence" }, dtype: "GEOTRACK-LTE", did: "1F0ED20", dname: "RASTREADOR A-12", keyword: "—", origin: { es: "Dispositivo IoT", en: "IoT device" }, prio: { es: "Media", en: "Medium" }, note: { es: "Activo salió de la geocerca autorizada a las 03:38. Velocidad 42 km/h.", en: "Asset left the authorized geofence at 03:38. Speed 42 km/h." }, addr: "Av. Presidente Masaryk 400, Polanco", state: { es: "Desde espera por tiempo", en: "From time hold" } },
  ];

  const CONTACTS = [
    { n: "Cliente IoT · titular", phone: "5510223344" },
    { n: "CONT1 · familiar", phone: "9876456323" },
    { n: "Vigilancia · caseta", phone: "5544112299" },
  ];
  const PLAN_STEPS = [
    { es: "Llamada telefónica", en: "Phone call", det: { es: "Llamar al cliente para verificar la señal antes de escalar.", en: "Call the client to verify the signal before escalating." } },
    { es: "Verificar con contacto", en: "Verify with contact", det: { es: "Si no responde el titular, contactar al familiar registrado.", en: "If the holder doesn't answer, contact the registered relative." } },
    { es: "Despacho de autoridades", en: "Authority dispatch", det: { es: "Coordinar con seguridad pública / privada según protocolo.", en: "Coordinate with public / private security per protocol." } },
    { es: "Registro y cierre", en: "Register & close", det: { es: "Documentar causa y actuación en bitácora para cerrar el evento.", en: "Document cause and action in the log to close the event." } },
  ];
  const CAUSAS = [
    { es: "Seleccionar…", en: "Select…" }, { es: "Asalto / Amago sin detenidos", en: "Robbery / Threat, no arrests" }, { es: "Ataque / Agresión", en: "Attack / Assault" }, { es: "Alarma Real con detenidos", en: "Real alarm with arrests" }, { es: "Robo / Intrusión sin detenidos", en: "Theft / Intrusion, no arrests" }, { es: "Incendio", en: "Fire" }, { es: "Médica", en: "Medical" }, { es: "Falsa Alarma · Usuario", en: "False alarm · User" }, { es: "Falsa Alarma · Técnico", en: "False alarm · Technical" }, { es: "Cliente activa por error", en: "Client triggered by mistake" }, { es: "Protección Civil", en: "Civil Protection" }, { es: "Otros", en: "Other" },
  ];
  const ACTS = [
    { es: "Seleccionar…", en: "Select…" }, { es: "Se contactó a las autoridades", en: "Authorities contacted" }, { es: "Con apoyo de seguridad pública", en: "With public security support" }, { es: "Con apoyo de seguridad privada", en: "With private security support" }, { es: "Con apoyo de ambulancia", en: "With ambulance support" }, { es: "Con apoyo de bomberos", en: "With fire dept. support" }, { es: "Activa por error", en: "Triggered by mistake" }, { es: "No requirió apoyo", en: "No support required" }, { es: "Prueba", en: "Test" },
  ];

  let selectedId = ALARMS[0].id, planIdx = 0;

  const queue = document.getElementById("queue");
  function updateCounts() {
    const a = document.getElementById("qbAlarms"); if (a) a.textContent = ALARMS.length;
    const d = document.getElementById("qbDevices"); if (d) d.textContent = DEVICES.length;
  }
  function renderQueue() {
    updateCounts();
    if (leftMode === "devices") return renderDeviceQueue();
    queue.innerHTML = "";
    ALARMS.forEach((a) => {
      const sv = SEV[a.sev];
      const el = document.createElement("div");
      el.className = "qrow" + (a.id === selectedId ? " sel" : "");
      el.style.setProperty("--sev", sv.c); el.style.setProperty("--sevsoft", sv.s);
      el.innerHTML = '<span class="qic">' + IC[a.icon] + '</span><span class="qm"><span class="qe">' + a.id + ' · ' + t(a.event.es, a.event.en) + '</span><span class="qa">' + t("Cuenta", "Account") + ' ' + a.account + ' · ' + a.client + '</span><span class="qs">' + t(a.state.es, a.state.en) + '</span></span><span class="qt">' + clock(Math.floor(Math.random() * 600)) + '</span>';
      el.onclick = () => { selectedId = a.id; planIdx = 0; renderQueue(); renderDetail(); };
      queue.appendChild(el);
    });
  }
  function renderDeviceQueue() {
    queue.innerHTML = "";
    DEVICES.forEach((d) => {
      const el = document.createElement("div");
      el.className = "drow" + (d.id === selectedDev ? " sel" : "");
      const sub = d.isNew ? t("Nuevo · sin configurar", "New · unconfigured") : (d.acc === "—" ? t("inventario", "inventory") : "Cta " + d.acc);
      const right = d.isNew
        ? '<span class="dpill" style="color:#9a6f17;background:var(--warn-soft)">' + t("Configurar", "Set up") + '</span>'
        : '<span class="dv2">' + (d.st === "offline" ? "—" : d.pct + "%") + '</span>' + dbadge(d.st);
      el.innerHTML = '<span class="dic2"' + (d.isNew ? ' style="background:var(--warn-soft);color:#9a6f17"' : '') + '>' + CHIP + '</span><span class="dm2"><span class="dn2">' + d.model + '</span><span class="di2">' + d.id + ' · ' + sub + '</span></span><span class="dstat2">' + right + '</span>';
      el.onclick = () => selectDevice(d.id);
      queue.appendChild(el);
    });
  }

  function cur() { return ALARMS.find((a) => a.id === selectedId) || ALARMS[0]; }
  function renderDetail() {
    const a = cur();
    if (!a) return;
    document.getElementById("evId").textContent = a.id;
    document.getElementById("evTitle").textContent = t("Cuenta", "Account") + " " + a.account + " · " + t(a.event.es, a.event.en);
    const prioCls = a.prio.es === "Alta" ? "badge-crit" : a.prio.es === "Media" ? "badge-warn" : "badge-info";
    const pb = document.getElementById("detPrio");
    pb.style.cssText = "";
    pb.className = "badge " + prioCls;
    pb.innerHTML = '<span class="pip"></span>' + t("Prioridad", "Priority") + " " + t(a.prio.es, a.prio.en).toLowerCase();
    const di = (k, kE, v, mono) => '<div class="dc"><div class="k">' + t(k, kE) + '</div><div class="v' + (mono ? " mono" : "") + '">' + v + '</div></div>';
    document.getElementById("detGrid").innerHTML =
      di("Cuenta", "Account", a.account + " · " + a.client) +
      di("Cliente", "Client", a.clientType) +
      di("Evento", "Event", t(a.event.es, a.event.en)) +
      di("Origen", "Origin", t(a.origin.es, a.origin.en)) +
      di("Tipo de dispositivo", "Device type", a.dtype, true) +
      '<div class="dc"><div class="k">' + t("ID dispositivo", "Device ID") + '</div><div class="v mono"><span class="devid-link" data-devlink="' + a.did + '">' + a.did + '</span></div></div>' +
      di("Nombre dispositivo", "Device name", a.dname, true) +
      di("Palabra clave", "Keyword", a.keyword, true) +
      '<div class="dc" style="grid-column:1/-1"><div class="k">' + t("Dirección", "Address") + '</div><div class="v">' + a.addr + '</div></div>';
    document.getElementById("noteBox").innerHTML = t(a.note.es, a.note.en) + '<span class="nf">' + clock(120) + '</span>';
    const dl = document.querySelector("#detGrid [data-devlink]");
    if (dl) dl.onclick = () => { const id = dl.dataset.devlink; if (DEVICES.find((x) => x.id === id)) { selectedDev = id; setMode("devices"); } };
    renderPlan(); renderTrace();
  }

  // ---- plan ----
  function renderPlan() {
    const s = PLAN_STEPS[planIdx];
    document.getElementById("planStepTitle").textContent = t(s.es, s.en);
    document.getElementById("planDet").innerHTML = t(s.det.es, s.det.en);
    document.getElementById("planStep").textContent = t("Paso", "Step") + " " + (planIdx + 1) + " " + t("de", "of") + " 4";
    document.getElementById("planPrev").disabled = planIdx === 0;
    document.getElementById("planNext").disabled = planIdx === 3;
    const c = document.getElementById("contacts");
    c.innerHTML = CONTACTS.map((ct, i) => '<div class="cp' + (i === 0 ? " sel" : "") + '" data-phone="' + ct.phone + '"><span class="cn">' + ct.n + '</span><span class="cph">' + ct.phone + '</span><span class="callb"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg></span></div>').join("");
    c.querySelectorAll(".cp").forEach((cp) => cp.onclick = () => { c.querySelectorAll(".cp").forEach((x) => x.classList.remove("sel")); cp.classList.add("sel"); openDialer(cp.dataset.phone); });
  }
  document.getElementById("planNext").onclick = () => { if (planIdx < 3) { planIdx++; renderPlan(); if (planIdx === 3) switchTab("log"); } };
  document.getElementById("planPrev").onclick = () => { if (planIdx > 0) { planIdx--; renderPlan(); } };

  // ---- trace ----
  function renderTrace() {
    const a = cur();
    const items = [
      { crit: true, tt: { es: a.id + " · " + t(a.event.es, a.event.en), en: a.id + " · " + t(a.event.es, a.event.en) }, tm: clock(0) },
      { crit: false, tt: { es: "Señal recibida del dispositivo " + a.did, en: "Signal received from device " + a.did }, tm: clock(8) },
      { crit: false, tt: { es: "Evento clasificado · prioridad " + t(a.prio.es, a.prio.en).toLowerCase(), en: "Event classified · " + t(a.prio.es, a.prio.en).toLowerCase() + " priority" }, tm: clock(10) },
      { crit: false, tt: { es: "Asignado a operador Diego Aranda", en: "Assigned to operator Diego Aranda" }, tm: clock(14) },
      { crit: false, tt: { es: "Nota activa cargada en pantalla", en: "Active note loaded on screen" }, tm: clock(16) },
    ];
    document.getElementById("trace").innerHTML = items.map((i) => '<div class="tr' + (i.crit ? " crit" : "") + '"><span class="td"></span><span class="ti"><span class="tt">' + t(i.tt.es, i.tt.en) + '</span><span class="tm">' + i.tm + '</span></span></div>').join("");
  }

  // ---- tabs ----
  function switchTab(name) {
    document.querySelectorAll("#alarmTabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === name));
    document.querySelectorAll("#alarmActionBody .tabpane").forEach((p) => p.classList.toggle("on", p.dataset.pane === name));
  }
  document.querySelectorAll("#alarmTabs button").forEach((b) => b.onclick = () => switchTab(b.dataset.tab));

  // ---- selects ----
  function fillSelect(el, opts) { el.innerHTML = opts.map((o, i) => '<option value="' + i + '">' + t(o.es, o.en) + '</option>').join(""); }
  function renderSelects() { fillSelect(document.getElementById("selCausa"), CAUSAS); fillSelect(document.getElementById("selActuacion"), ACTS); }

  // ---- close ----
  document.getElementById("closeBtn").onclick = () => switchTab("log");
  document.getElementById("logClose").onclick = () => {
    const causa = document.getElementById("selCausa");
    const act = document.getElementById("selActuacion");
    if (causa.value === "0" || act.value === "0") {
      NEV.toast(t("Selecciona causa y actuación", "Select cause and action"), null, {});
      return;
    }
    const closed = cur();
    ALARMS = ALARMS.filter((a) => a.id !== closed.id);
    NEV.toast(t("Evento cerrado", "Event closed") + " · " + closed.id, null, { mono: "✓" });
    causa.value = "0"; act.value = "0"; document.getElementById("logComments").value = "";
    if (ALARMS.length) { selectedId = ALARMS[0].id; planIdx = 0; switchTab("plan"); renderQueue(); renderDetail(); }
    else { queue.innerHTML = '<div style="padding:40px 20px;text-align:center;color:var(--ink-400);font-size:13px">' + t("Cola vacía · sin alarmas por atender", "Queue empty · no alarms to handle") + '</div>'; updateCounts(); }
  };

  // ---- dialer ----
  const dialer = document.getElementById("dialer");
  const dnum = document.getElementById("dnum");
  document.querySelector(".dialer .keys").innerHTML = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((k) => '<button>' + k + '</button>').join("");
  document.querySelectorAll(".dialer .keys button").forEach((b) => b.onclick = () => { dnum.textContent += b.textContent; });
  function openDialer(num) { dnum.textContent = num || ""; dialer.classList.add("open"); dialer.classList.remove("calling"); }
  document.getElementById("callBtn").onclick = () => {
    if (dialer.classList.contains("calling")) { dialer.classList.remove("calling", "open"); NEV.toast(t("Llamada finalizada", "Call ended"), null, {}); return; }
    dialer.classList.add("calling");
    NEV.toast(t("Llamando", "Calling") + " " + dnum.textContent + "…", null, {});
  };

  // ---- device inspector ----
  function selectDevice(id) {
    selectedDev = id; leftMode = "devices";
    document.querySelectorAll("[data-qmode]").forEach((b) => b.classList.toggle("on", b.dataset.qmode === "devices"));
    renderQueue();
    document.getElementById("alarmCenter").style.display = "none";
    document.getElementById("deviceCenter").style.display = "";
    document.getElementById("alarmTabs").style.display = "none";
    document.getElementById("alarmActionBody").style.display = "none";
    document.getElementById("deviceTabs").style.display = "";
    document.getElementById("deviceActionBody").style.display = "";
    document.getElementById("ebtns").style.display = "none";
    const d = DEVICES.find((x) => x.id === id) || DEVICES[0];
    document.getElementById("evId").textContent = d.id;
    document.getElementById("evTitle").textContent = d.model + " · " + (d.acc === "—" ? t("Inventario", "Inventory") : "Cta " + d.acc);
    const pb = document.getElementById("detPrio");
    pb.className = "badge"; pb.style.cssText = "color:" + DSTAT[d.st].c + ";background:" + DSTAT[d.st].bg + ";border-color:transparent";
    pb.innerHTML = '<span class="pip" style="background:' + DSTAT[d.st].c + '"></span>' + t(DSTAT[d.st].es, DSTAT[d.st].en);
    document.getElementById("detTitle").textContent = t("Detalle del dispositivo", "Device detail");
    renderDeviceCenter(d); renderDeviceAction(d);
  }
  function renderDeviceCenter(d) {
    const di = (k, kE, v, mono) => '<div class="dc"><div class="k">' + t(k, kE) + '</div><div class="v' + (mono ? " mono" : "") + '">' + v + '</div></div>';
    const col = devColor(d.st);
    const svcLabel = (() => { const o = SVC_OPTS.find((x) => x.v === svcOf(d)); return o ? t(o.es, o.en) : "—"; })();
    const caps = capsOf(d.model);
    const banner = d.isNew
      ? '<div class="setup-banner"><div><div class="sbt">' + t("Dispositivo recién comprado", "Newly purchased device") + '</div><div class="sbd">' + t("Vincúlalo a una cuenta y ubicación para activarlo en monitoreo.", "Link it to an account and location to activate it in monitoring.") + '</div></div><button class="btn btn-signal btn-sm" data-setup><svg viewBox="0 0 24 24" fill="none" stroke-width="1.9"><path d="M12 5v14M5 12h14"/></svg>' + t("Configurar ahora", "Set up now") + '</button></div>'
      : '<div class="dev-toolbar"><button class="btn btn-ghost btn-sm" data-setup><svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0 1.6 1.6 0 0 0-2.4-1.4 1.6 1.6 0 0 0-1.8.3 2 2 0 1 1-2.8-2.8A1.6 1.6 0 0 0 .8 14H1a2 2 0 1 1 0-4 1.6 1.6 0 0 0 1.6-2.6"/></svg>' + t("Configurar dispositivo", "Configure device") + '</button></div>';
    document.getElementById("deviceCenter").innerHTML =
      banner +
      '<div class="dgrid">' +
        di("Modelo", "Model", d.model) +
        '<div class="dc"><div class="k">' + t("ID dispositivo", "Device ID") + '</div><div class="v mono">' + d.id + '</div></div>' +
        '<div class="dc" style="grid-column:1/-1"><div class="k">' + t("Función del dispositivo", "Device function") + '</div><div class="v">' + t(caps.fn.es, caps.fn.en) + '</div></div>' +
        di("Cuenta", "Account", d.isNew ? '<span style="color:var(--orange-600)">' + t("Por configurar", "To configure") + '</span>' : (d.acc === "—" ? t("Inventario", "Inventory") : d.acc + " · " + d.client)) +
        di("Servicio asignado", "Assigned service", svcLabel) +
        di("Telemetría", "Telemetry", t(d.tele.es, d.tele.en)) +
        di("Protocolo", "Protocol", d.proto, true) +
        di("Firmware", "Firmware", d.fw, true) +
        '<div class="dc"><div class="k">' + t("Estado", "Status") + '</div><div class="v">' + dbadge(d.st) + '</div></div>' +
        '<div class="dc" style="grid-column:1/-1"><div class="k">' + t("Ubicación", "Location") + '</div><div class="v">' + (d.isNew && d.zone === "—" ? '<span style="color:var(--orange-600)">' + t("Por configurar", "To configure") + '</span>' : d.zone) + '</div></div>' +
      '</div>' +
      '<div style="margin:0 15px 15px"><div class="dsec">' + t("Salud del dispositivo", "Device health") + '</div>' +
        devRing(d.st === "offline" ? 0 : d.pct, col, d.st === "offline" ? "—" : d.pct + "%", d.kind === "batt" ? t("Batería", "Battery") : t("Señal", "Signal")) +
        devBar(d.kind === "batt" ? t("Batería", "Battery") : t("Intensidad de señal", "Signal strength"), d.st === "offline" ? "0%" : d.pct + "%", d.st === "offline" ? 0 : d.pct, col) +
        devBar("Uptime (30d)", "99.2%", 99, "var(--ok)") +
      '</div>';
    const sb = document.querySelector("#deviceCenter [data-setup]");
    if (sb) sb.onclick = () => openSetup(d);
  }
  function cmdBtn(id, path, label, danger) { return '<button class="cmd' + (danger ? " danger" : "") + '" data-cmd="' + id + '"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.7">' + path + '</svg><span>' + label + '</span></button>'; }
  function renderDeviceAction(d) {
    const col = devColor(d.st);
    const tel = '<div class="tabpane on" data-dpane="tel" style="padding:16px">' +
      devRing(d.st === "offline" ? 0 : d.pct, col, d.st === "offline" ? "—" : d.pct + "%", d.kind === "batt" ? t("Batería", "Battery") : t("Señal", "Signal")) +
      devBar(t("Latencia", "Latency"), "82 ms", 28, "var(--cobalt-500)") +
      devBar(t("Paquetes OK", "Packets OK"), "99.7%", 99, "var(--ok)") +
      devBar(d.kind === "batt" ? t("Batería", "Battery") : t("Señal", "Signal"), d.st === "offline" ? "0%" : d.pct + "%", d.st === "offline" ? 0 : d.pct, col) + '</div>';
    const sigs = [
      { crit: false, tt: { es: "Heartbeat recibido", en: "Heartbeat received" }, tm: clock(8) },
      { crit: false, tt: { es: "Telemetría · " + t(d.tele.es, d.tele.en), en: "Telemetry · " + t(d.tele.es, d.tele.en) }, tm: clock(40) },
      { crit: d.st !== "online", tt: { es: d.st === "low" ? "Alerta de batería baja" : d.st === "offline" ? "Pérdida de conexión" : "Estado nominal", en: d.st === "low" ? "Low battery alert" : d.st === "offline" ? "Connection lost" : "Nominal status" }, tm: clock(120) },
      { crit: false, tt: { es: "Vinculado a cuenta " + d.acc, en: "Linked to account " + d.acc }, tm: clock(900) },
    ];
    const sig = '<div class="tabpane" data-dpane="sig" style="padding:16px"><div class="trace">' + sigs.map((i) => '<div class="tr' + (i.crit ? " crit" : "") + '"><span class="td"></span><span class="ti"><span class="tt">' + t(i.tt.es, i.tt.en) + '</span><span class="tm">' + i.tm + '</span></span></div>').join("") + '</div></div>';
    const cmd = '<div class="tabpane" data-dpane="cmd" style="padding:16px"><div class="cmd-grid">' +
      cmdBtn("ping", '<path d="M2 12h4l3 8 4-16 3 8h4"/>', t("Ping / Probar", "Ping / Test")) +
      cmdBtn("loc", '<circle cx="12" cy="11" r="2.5"/><path d="M12 21c4-4.5 7-8 7-11a7 7 0 0 0-14 0c0 3 3 6.5 7 11"/>', t("Localizar", "Locate")) +
      cmdBtn("rst", '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>', t("Reiniciar", "Restart")) +
      cmdBtn("dis", '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', t("Deshabilitar", "Disable"), true) +
      '</div></div>';
    const body = document.getElementById("deviceActionBody");
    body.innerHTML = tel + sig + cmd;
    document.querySelectorAll("#deviceTabs button").forEach((b, i) => { b.classList.toggle("on", i === 0); b.onclick = () => { document.querySelectorAll("#deviceTabs button").forEach((x) => x.classList.toggle("on", x === b)); body.querySelectorAll(".tabpane").forEach((p) => p.classList.toggle("on", p.dataset.dpane === b.dataset.dtab)); }; });
    body.querySelectorAll("[data-cmd]").forEach((b) => b.onclick = () => doCommand(b.dataset.cmd, d));
  }
  function doCommand(cmd, d) {
    const msgs = { ping: { es: "Ping enviado a " + d.id, en: "Ping sent to " + d.id }, loc: { es: "Solicitando ubicación de " + d.id, en: "Requesting location of " + d.id }, rst: { es: "Reinicio remoto enviado", en: "Remote restart sent" }, dis: { es: "Dispositivo deshabilitado", en: "Device disabled" } };
    const m = msgs[cmd]; NEV.toast(t(m.es, m.en), null, { mono: d.id });
  }

  // ---- device setup / provisioning ----
  const ZONES = ["Hipódromo Condesa", "Polanco", "Del Valle", "Roma Norte", "Santa Fe", "Coyoacán", "Nápoles", "Narvarte", "Escandón", "Mixcoac", "Industrial Vallejo", "Reforma / Juárez"];
  function openSetup(d) {
    const scrim = document.createElement("div");
    scrim.className = "scrim";
    const caps = capsOf(d.model);
    const allowed = caps.services;
    const cur = svcOf(d);
    const opt = (sel) => allowed.map((v) => { const o = SVC_OPTS.find((x) => x.v === v) || { v, es: v, en: v }; return '<option value="' + v + '"' + (v === sel ? " selected" : "") + '>' + t(o.es, o.en) + '</option>'; }).join("");
    const svcName = (v) => { const o = SVC_OPTS.find((x) => x.v === v); return o ? t(o.es, o.en) : v; };
    const svcField = allowed.length === 1
      ? '<div class="field"><label>' + t("Servicio asignado", "Assigned service") + '</label><div class="locked-field">' + svcName(allowed[0]) + '<span class="lockchip"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>' + t("auto · por tipo", "auto · by type") + '</span></div><input type="hidden" id="suSvc" value="' + allowed[0] + '"></div>'
      : '<div class="field"><label>' + t("Servicio asignado", "Assigned service") + '</label><select class="input" id="suSvc">' + opt(cur) + '</select><span class="field-hint">' + t("Compatible con este tipo de dispositivo", "Compatible with this device type") + '</span></div>';
    const zopt = (sel) => '<option value="">' + t("Selecciona zona…", "Select zone…") + '</option>' + ZONES.map((z) => '<option' + (z === sel ? " selected" : "") + '>' + z + '</option>').join("");
    scrim.innerHTML =
      '<div class="dialog" style="max-width:560px">' +
        '<div class="dhead"><div style="display:flex;align-items:center;gap:12px"><span style="width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:var(--cobalt-50);color:var(--cobalt-500)">' + CHIP + '</span><div><div style="font-size:18px;font-weight:700;letter-spacing:-0.02em;color:var(--ink-100)">' + t("Configurar dispositivo", "Configure device") + '</div><div class="upper" style="margin-top:3px">' + d.model + ' · ID ' + d.id + '</div></div></div></div>' +
        '<div class="dbody"><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">' +
          '<div class="field" style="grid-column:1/-1"><label>' + t("Función del dispositivo", "Device function") + '</label><div class="fn-field">' + CHIP + '<span>' + t(caps.fn.es, caps.fn.en) + '</span></div></div>' +
          '<div class="field"><label>' + t("Cuenta / Nº de cliente", "Account / Client #") + '</label><input class="input" id="suAcc" value="' + (d.acc === "—" ? "" : d.acc) + '" placeholder="2000-0001"></div>' +
          '<div class="field"><label>' + t("Nombre del cliente", "Client name") + '</label><input class="input" id="suClient" value="' + (d.client === "—" ? "" : d.client) + '" placeholder="' + t("Nombre o razón social", "Name or company") + '"></div>' +
          svcField +
          '<div class="field"><label>' + t("Zona", "Zone") + '</label><select class="input" id="suZone">' + zopt(d.zone === "—" ? "" : d.zone) + '</select></div>' +
          '<div class="field" style="grid-column:1/-1"><label>' + t("Dirección / ubicación", "Address / location") + '</label><input class="input" id="suAddr" placeholder="' + t("Calle, número, colonia", "Street, number, neighborhood") + '"></div>' +
        '</div>' +
        '<div style="margin-top:14px;padding:12px 14px;background:var(--info-soft);border-radius:var(--r-sm);font-size:12.5px;color:var(--ink-300);line-height:1.5">' + t("El servicio se asigna automáticamente según el tipo de dispositivo. Al guardar, queda vinculado y activo en monitoreo en vivo.", "The service is assigned automatically by device type. On save it's linked and active in live monitoring.") + '</div></div>' +
        '<div class="dfoot"><button class="btn btn-ghost" data-suclose>' + t("Cancelar", "Cancel") + '</button><button class="btn btn-cobalt" data-susave><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2"><path d="M20 6 9 17l-5-5"/></svg>' + t("Guardar y activar", "Save & activate") + '</button></div>' +
      '</div>';
    document.body.appendChild(scrim);
    requestAnimationFrame(() => scrim.classList.add("open"));
    const close = () => { scrim.classList.remove("open"); setTimeout(() => scrim.remove(), 250); };
    scrim.addEventListener("click", (e) => { if (e.target === scrim || e.target.closest("[data-suclose]")) close(); });
    scrim.querySelector("[data-susave]").onclick = () => {
      const acc = scrim.querySelector("#suAcc").value.trim();
      const client = scrim.querySelector("#suClient").value.trim();
      const svc = scrim.querySelector("#suSvc").value;
      const zone = scrim.querySelector("#suZone").value || scrim.querySelector("#suAddr").value.trim();
      Object.assign(d, { acc: acc || "—", client: client || "—", service: svc, zone: zone || "—", provisioned: true, isNew: false });
      if (window.NEV_STORE) NEV_STORE.updateDevice(d.id, { acc: d.acc, client: d.client, service: svc, zone: d.zone, provisioned: true });
      close();
      renderQueue(); selectDevice(d.id);
      NEV.toast(t("Dispositivo configurado y activo", "Device configured & active"), null, { mono: d.id });
    };
  }

  function setMode(mode) {
    leftMode = mode;
    document.querySelectorAll("[data-qmode]").forEach((b) => b.classList.toggle("on", b.dataset.qmode === mode));
    if (mode === "devices") { selectDevice(selectedDev); return; }
    document.getElementById("alarmCenter").style.display = "";
    document.getElementById("deviceCenter").style.display = "none";
    document.getElementById("alarmTabs").style.display = "";
    document.getElementById("alarmActionBody").style.display = "";
    document.getElementById("deviceTabs").style.display = "none";
    document.getElementById("deviceActionBody").style.display = "none";
    document.getElementById("ebtns").style.display = "";
    document.getElementById("detTitle").textContent = t("Detalle del evento", "Event detail");
    renderQueue(); renderDetail();
  }
  document.querySelectorAll("[data-qmode]").forEach((b) => b.onclick = () => setMode(b.dataset.qmode));

  // ---- live arrivals ----
  const INCOMING = [
    { id: "#9601", sev: "crit", icon: "panic", account: "5010-9821", client: "Depto. Condesa 4B", clientType: "Cliente IoT", event: { es: "Pánico Móvil · Asalto", en: "Mobile Panic · Assault" }, dtype: "SMPLPCK4P", did: "12CA9F1", dname: "BOTÓN MÓVIL", keyword: "ROBO", origin: { es: "Dispositivo IoT", en: "IoT device" }, prio: { es: "Alta", en: "High" }, note: { es: "Activación de pánico en vía pública. Ubicación GPS en movimiento.", en: "Panic activation on public road. GPS location in motion." }, addr: "Av. Michoacán 50, Hipódromo Condesa", state: { es: "Nueva · sin asignar", en: "New · unassigned" } },
    { id: "#9602", sev: "warn", icon: "temp", account: "9988", client: "Oficina Corporativa CDMX", clientType: "Cliente IoT", event: { es: "Temperatura por encima del umbral", en: "Temperature above threshold" }, dtype: "Simple Pack V4.0", did: "12C844C", dname: "SENSOR SERVER", keyword: "—", origin: { es: "Sensor IoT", en: "IoT sensor" }, prio: { es: "Media", en: "Medium" }, note: { es: "Sala de servidores 39 °C. Umbral 35 °C.", en: "Server room 39 °C. Threshold 35 °C." }, addr: "Reforma 222, Juárez", state: { es: "Nueva · sin asignar", en: "New · unassigned" } },
  ];
  let inIdx = 0;
  setInterval(() => {
    if (inIdx >= INCOMING.length) return;
    if (ALARMS.length > 9) return;
    const a = INCOMING[inIdx++];
    ALARMS.unshift(a);
    renderQueue();
    queue.firstChild && queue.firstChild.classList.add("fresh");
    NEV.toast(t("Nueva alarma", "New alarm") + " · " + a.id, null, { icon: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/></svg>' });
  }, 9000);

  document.addEventListener("nev:lang", () => { renderSelects(); if (leftMode === "devices") selectDevice(selectedDev); else { renderQueue(); renderDetail(); } });

  // init
  mergeStoreDevices();
  renderQueue(); renderDetail(); renderSelects();

  // deep-link focus from another page (station signal → live monitoring, marketplace → device)
  (function applyFocus() {
    const f = window.NEV_STORE && NEV_STORE.takeFocus();
    if (!f) return;
    if (f.mode === "devices") {
      if (f.target && DEVICES.find((x) => x.id === f.target)) selectedDev = f.target;
      setMode("devices");
    } else {
      if (f.target && ALARMS.find((a) => a.id === f.target)) { selectedId = f.target; planIdx = 0; }
      setMode("alarms");
    }
  })();
})();
