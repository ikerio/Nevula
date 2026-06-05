/* Nevula demo — Marketplace logic */
(function () {
  NEV.mountChrome({
    active: "market", crumbEs: "Marketplace IoT", crumbEn: "IoT Marketplace",
    railFootTitle: "Plug & play", railFootEs: "Todo dispositivo del marketplace está certificado y listo para tu stack.", railFootEn: "Every marketplace device is certified and ready for your stack."
  });

  const lang = () => NEV.getLang();
  const t = (es, en) => (lang() === "en" ? en : es);

  const IC = {
    panic: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="M12 8v4M12 16h.01"/></svg>',
    sensor: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><rect x="7" y="7" width="10" height="10" rx="1"/><path d="M10 2v3M14 2v3M10 19v3M14 19v3M2 10h3M2 14h3M19 10h3M19 14h3"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    gps: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><circle cx="12" cy="11" r="2.5"/><path d="M12 21c4-4.5 7-8 7-11a7 7 0 0 0-14 0c0 3 3 6.5 7 11"/></svg>',
    hub: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><circle cx="12" cy="12" r="2.5"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="m7 7 3 3M17 7l-3 3M7 17l3-3M17 17l-3-3"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><path d="M3 7h13v10H3z"/><path d="m16 10 5-3v10l-5-3z"/><circle cx="8" cy="12" r="2"/></svg>',
    leak: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><path d="M12 3c3 5 6 8 6 12a6 6 0 0 1-12 0c0-2 1-4 2-5"/></svg>',
    fire: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><path d="M12 3c1 3 4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 11 9 9 12 3"/></svg>',
  };

  const CATS = [
    { id: "all", es: "Todos", en: "All" },
    { id: "panico", es: "Pánico", en: "Panic" },
    { id: "sensor", es: "Sensores", en: "Sensors" },
    { id: "acceso", es: "Acceso", en: "Access" },
    { id: "rastreo", es: "Rastreo", en: "Tracking" },
    { id: "hub", es: "Hubs", en: "Hubs" },
  ];

  const DEVICES = [
    { id: "btn", icon: "panic", cat: "panico", n: { es: "Botón de Pánico Inalámbrico", en: "Wireless Panic Button" }, model: "SMPLPCK4P", tele: { es: "Pulsación SOS", en: "SOS press" }, protos: ["BLE", "LTE"], price: 740 },
    { id: "rosa", icon: "panic", cat: "panico", n: { es: "Botón Rosa · Pendiente Personal", en: "Pink Button · Personal Pendant" }, model: "BTNROSA-V2", tele: { es: "Geolocalización", en: "Geolocation" }, protos: ["LTE", "GPS"], price: 890 },
    { id: "pack", icon: "sensor", cat: "sensor", n: { es: "Simple Pack V4.0", en: "Simple Pack V4.0" }, model: "SMPLPCK4-MS", tele: { es: "Temp · Geoloc WiFi", en: "Temp · WiFi geoloc" }, protos: ["WiFi", "Zigbee"], price: 1250 },
    { id: "leak", icon: "leak", cat: "sensor", n: { es: "Sensor de Fuga · Simple Leak", en: "Leak Sensor · Simple Leak" }, model: "SMPLEAK-01", tele: { es: "Estado húmedo/seco", en: "Wet/dry status" }, protos: ["Zigbee"], price: 520 },
    { id: "con", icon: "lock", cat: "acceso", n: { es: "Contacto Seco · Apertura", en: "Dry Contact · Opening" }, model: "RBS101-CON", tele: { es: "Estado puerta", en: "Door state" }, protos: ["Zigbee"], price: 410 },
    { id: "smartlock", icon: "lock", cat: "acceso", n: { es: "Cerradura Inteligente Gen 2", en: "Smart Lock Gen 2" }, model: "SMARTLOCK-G2", tele: { es: "Acceso remoto", en: "Remote access" }, protos: ["WiFi", "BLE"], price: 2150 },
    { id: "geo", icon: "gps", cat: "rastreo", n: { es: "Rastreador GPS de Activos", en: "Asset GPS Tracker" }, model: "GEOTRACK-LTE", tele: { es: "Ubicación en movimiento", en: "In-motion location" }, protos: ["LTE", "GLONASS"], price: 1180 },
    { id: "fire", icon: "fire", cat: "sensor", n: { es: "Sensor de Humo / Térmico", en: "Smoke / Thermal Sensor" }, model: "FIRESENSE-01", tele: { es: "Humo + temperatura", en: "Smoke + temperature" }, protos: ["Zigbee"], price: 680 },
    { id: "hub", icon: "hub", cat: "hub", n: { es: "Nevula Smart Hub Gen 2", en: "Nevula Smart Hub Gen 2" }, model: "NVHUB-G2", tele: { es: "Gateway multiprotocolo", en: "Multi-protocol gateway" }, protos: ["WiFi", "Zigbee", "LTE"], price: 1990 },
    { id: "cam", icon: "camera", cat: "acceso", n: { es: "Cámara de Verificación IA", en: "AI Verification Camera" }, model: "VCAM-PRO", tele: { es: "Video + detección IA", en: "Video + AI detection" }, protos: ["WiFi", "RTSP"], price: 1690 },
  ];

  const fmt = (n) => "$" + n.toLocaleString("en-US");
  let activeCat = "all", query = "", cart = [], integratedToday = 0;

  const grid = document.getElementById("devgrid");
  const chips = document.getElementById("chips");

  function renderChips() {
    chips.innerHTML = "";
    CATS.forEach((c) => {
      const b = document.createElement("button");
      b.className = "chip" + (c.id === activeCat ? " on" : "");
      b.textContent = t(c.es, c.en);
      b.onclick = () => { activeCat = c.id; renderChips(); renderGrid(); };
      chips.appendChild(b);
    });
  }

  function renderGrid() {
    grid.innerHTML = "";
    const q = query.toLowerCase();
    DEVICES.filter((d) => (activeCat === "all" || d.cat === activeCat) &&
      (!q || t(d.n.es, d.n.en).toLowerCase().includes(q) || d.model.toLowerCase().includes(q)))
      .forEach((d) => {
        const el = document.createElement("div");
        el.className = "dev";
        el.innerHTML =
          '<div class="thumb"><span class="approved"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4"><path d="M20 6 9 17l-5-5"/></svg>' + t("Aprobado Nevula", "Nevula approved") + '</span>' +
          '<img class="dphoto" src="assets/devices/' + ({btn:"panic",rosa:"pinkbutton",pack:"simplepack",leak:"leak",con:"drycontact",smartlock:"smartlock",geo:"tracker",fire:"smoke",hub:"smarthub",cam:"camera"}[d.id]||"panic") + '.png" alt="" onerror="this.remove()">' + '<span class="dic">' + IC[d.icon].replace('stroke-width="1.6"', 'stroke-width="1.4"') + '</span><span class="ph">' + t("FOTO DISPOSITIVO", "DEVICE PHOTO") + '</span></div>' +
          '<div class="db"><div class="n">' + t(d.n.es, d.n.en) + '</div><div class="m">' + d.model + '</div>' +
          '<div class="protos">' + d.protos.map((p) => '<span class="proto">' + p + '</span>').join("") + '</div>' +
          '<div class="tele">' + t(d.tele.es, d.tele.en) + '</div></div>' +
          '<div class="df"><div class="price">' + fmt(d.price) + '<small> /' + t("u", "ea") + '</small></div>' +
          '<button class="btn btn-cobalt btn-sm" data-add="' + d.id + '"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.9"><path d="M12 5v14M5 12h14"/></svg>' + t("Agregar", "Add") + '</button></div>';
        el.querySelector("[data-add]").onclick = () => addToCart(d.id);
        grid.appendChild(el);
      });
  }

  // ---- cart ----
  const fab = document.getElementById("cartFab");
  const drawer = document.getElementById("drawer");
  function addToCart(id) {
    cart.push(id);
    renderCart();
    fab.classList.add("show");
    const d = DEVICES.find((x) => x.id === id);
    NEV.toast(t("Agregado al carrito", "Added to cart") + " · " + t(d.n.es, d.n.en), null, {});
    fab.animate([{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }], { duration: 300 });
  }
  function renderCart() {
    document.getElementById("cartCount").textContent = cart.length;
    if (cart.length === 0) fab.classList.remove("show");
    const items = document.getElementById("cartItems");
    if (cart.length === 0) { items.innerHTML = '<div class="empty">' + t("Tu carrito está vacío.", "Your cart is empty.") + '</div>'; }
    else {
      items.innerHTML = cart.map((id, i) => {
        const d = DEVICES.find((x) => x.id === id);
        return '<div class="ci"><span class="cic">' + IC[d.icon] + '</span><span class="cinfo"><span class="n">' + t(d.n.es, d.n.en) + '</span><span class="p">' + d.model + ' · ' + fmt(d.price) + '</span></span><button class="rm" data-rm="' + i + '"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>';
      }).join("");
      items.querySelectorAll("[data-rm]").forEach((b) => b.onclick = () => { cart.splice(+b.dataset.rm, 1); renderCart(); });
    }
    const tot = cart.reduce((s, id) => s + DEVICES.find((x) => x.id === id).price, 0);
    document.getElementById("cartTotal").textContent = fmt(tot);
    document.getElementById("checkoutBtn").disabled = cart.length === 0;
  }
  fab.onclick = () => drawer.classList.add("open");
  drawer.querySelectorAll("[data-close]").forEach((e) => e.onclick = () => drawer.classList.remove("open"));

  // ---- checkout / provisioning ----
  const scrim = document.getElementById("checkoutScrim");
  const dialog = document.getElementById("checkoutDialog");
  document.getElementById("checkoutBtn").onclick = startCheckout;

  function startCheckout() {
    if (cart.length === 0) return;
    drawer.classList.remove("open");
    const steps = [
      { es: "Pago confirmado", en: "Payment confirmed" },
      { es: "Aprovisionando dispositivos", en: "Provisioning devices" },
      { es: "Vinculando a tu cuenta", en: "Linking to your account" },
      { es: "Activando en monitoreo", en: "Activating in monitoring" },
    ];
    dialog.innerHTML =
      '<div class="dhead"><div style="font-size:18px;font-weight:700;letter-spacing:-0.02em;color:var(--ink-100)">' + t("Integrando tu compra", "Integrating your purchase") + '</div><div class="upper" style="margin-top:4px">' + cart.length + ' ' + t("dispositivos · plug-and-play", "devices · plug-and-play") + '</div></div>' +
      '<div class="dbody"><div class="prov" id="prov">' +
      steps.map((s, i) => (i ? '<div class="prov-line"></div>' : '') + '<div class="pstep" data-step="' + i + '"><span class="pn">' + (i + 1) + '</span><span class="pt">' + t(s.es, s.en) + '</span></div>').join("") +
      '</div></div>';
    scrim.classList.add("open");
    runStep(0, steps);
  }
  function runStep(i, steps) {
    const els = dialog.querySelectorAll(".pstep");
    if (i >= steps.length) { setTimeout(() => finishCheckout(), 500); return; }
    const el = els[i];
    el.classList.add("active");
    el.querySelector(".pn").innerHTML = '<span class="spin"></span>';
    setTimeout(() => {
      el.classList.remove("active"); el.classList.add("done");
      el.querySelector(".pn").innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.6"><path d="M20 6 9 17l-5-5"/></svg>';
      runStep(i + 1, steps);
    }, 850);
  }
  function finishCheckout() {
    const bought = cart.slice();
    dialog.innerHTML =
      '<div class="dbody" style="text-align:center;padding-top:28px">' +
      '<div class="success-check"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4"><path d="M20 6 9 17l-5-5"/></svg></div>' +
      '<div style="font-size:20px;font-weight:700;letter-spacing:-0.02em;color:var(--ink-100)">' + t("¡Listo! Ya están en vivo", "Done! They're live") + '</div>' +
      '<p style="margin:10px auto 0;max-width:360px;font-size:14px;line-height:1.55;color:var(--ink-300)">' + t("Tus dispositivos aparecen ya en tu monitoreo y en el inventario de tu estación. Sin pasos técnicos.", "Your devices already appear in your monitoring and your station inventory. No technical steps.") + '</p></div>' +
      '<div class="dfoot"><button class="btn btn-ghost" data-close2 data-es="Seguir comprando" data-en="Keep shopping">Seguir comprando</button><a class="btn btn-cobalt" href="../console/index.html"><span data-es="Ver en monitoreo" data-en="View in monitoring">Ver en monitoreo</span><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></div>';
    NEV.setLang(NEV.getLang());
    dialog.querySelector("[data-close2]").onclick = () => scrim.classList.remove("open");
    // populate recent + KPIs
    integratedToday += bought.length;
    document.getElementById("kToday").textContent = integratedToday;
    const inv = document.getElementById("kInv"); inv.textContent = (1284 + integratedToday).toLocaleString("en-US");
    addRecent(bought);
    cart = []; renderCart();
    NEV.toast(t("Dispositivos integrados", "Devices integrated"), null, { mono: "+" + bought.length });
  }
  function addRecent(ids) {
    const rec = document.getElementById("recent");
    const list = document.getElementById("recentList");
    rec.classList.add("show");
    const storeRecs = [];
    ids.forEach((id) => {
      const d = DEVICES.find((x) => x.id === id);
      const hex = (window.NEV_STORE ? NEV_STORE.newId() : (Math.random().toString(16).slice(2, 8))).toUpperCase();
      const el = document.createElement("div");
      el.className = "ritem";
      el.innerHTML = '<span class="ic">' + IC[d.icon] + '</span><span class="ri"><span class="n">' + t(d.n.es, d.n.en) + '</span><span class="m">' + d.model + ' · ID ' + hex + '</span><span class="tele"><i></i></span></span><span class="badge badge-ok" style="flex:0 0 auto"><span class="pip"></span>' + t("EN VIVO", "LIVE") + '</span>';
      list.insertBefore(el, list.firstChild);
      const caps = window.NEV_STORE ? NEV_STORE.capsOf(d.model) : { services: ["iot"] };
      storeRecs.push({ id: hex, model: d.model, name: t(d.n.es, d.n.en), kind: "signal", acc: "—", client: "—", zone: "—", service: caps.services[0], teleEs: d.tele.es, teleEn: d.tele.en, proto: d.protos.join(" / "), pct: 100, st: "online", seen: t("ahora", "now"), provisioned: false });
    });
    if (window.NEV_STORE) NEV_STORE.addDevices(storeRecs);
    while (list.children.length > 8) list.removeChild(list.lastChild);
  }

  // search + lang
  document.getElementById("searchInput").addEventListener("input", (e) => { query = e.target.value; renderGrid(); });
  document.addEventListener("nev:lang", () => { renderChips(); renderGrid(); renderCart(); });

  // init
  renderChips(); renderGrid(); renderCart();
})();
