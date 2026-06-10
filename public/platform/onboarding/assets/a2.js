/* Nevula demo — Partner onboarding wizard (v2 · profile-contextual) */
(function () {
  const lang = () => (window.NEV && NEV.getLang()) || "es";
  const t = (es, en) => (lang() === "en" ? en : es);
  const sIcon = (p) => '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7">' + p + '</svg>';
  const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.6"><path d="M20 6 9 17l-5-5"/></svg>';

  // reusable icon paths
  const P = {
    target: '<path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="4"/>',
    chip: '<path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4"/><rect x="7" y="7" width="10" height="10" rx="1"/>',
    factory: '<path d="M3 21h18M5 21V8l5 4V8l5 4V8l4 3v10"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="M12 8v4M12 16h.01"/>',
    wave: '<path d="M3 12h3l2-5 4 10 2-5h7"/>',
    ambulance: '<path d="M3 8h11v9H3z"/><path d="M14 11h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    call: '<path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    wa: '<path d="M3 21l1.6-4A8.5 8.5 0 1 1 8 19.4z"/>',
    push: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    sms: '<path d="M3 5h18v12H8l-5 4z"/>',
    radio: '<circle cx="12" cy="12" r="2"/><path d="M7 7a7 7 0 0 0 0 10M17 7a7 7 0 0 1 0 10M4 4a11 11 0 0 0 0 16M20 4a11 11 0 0 1 0 16"/>',
    home: '<path d="M3 11l9-7 9 7M5 10v10h14V10"/>',
    building: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
    industry: '<path d="M3 21V9l5 3V9l5 3V9l5 3v9z"/><path d="M8 21v-4M13 21v-4"/>',
    gov: '<path d="M3 21h18M5 21V10M19 21V10M3 10l9-6 9 6M9 21v-6h6v6"/>',
    cam: '<path d="M3 7h13v10H3z"/><path d="m16 10 5-3v10l-5-3z"/><circle cx="8" cy="12" r="2"/>',
    sensor: '<rect x="7" y="7" width="10" height="10" rx="1"/><path d="M10 2v3M14 2v3M10 19v3M14 19v3M2 10h3M2 14h3M19 10h3M19 14h3"/>',
    gateway: '<circle cx="12" cy="12" r="2.5"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>',
    leak: '<path d="M12 3c3 5 6 8 6 12a6 6 0 0 1-12 0c0-2 1-4 2-5"/>',
    wrench: '<path d="M14 7a4 4 0 0 1-5 5L4 17l3 3 5-5a4 4 0 0 1 5-5z"/>',
    badge: '<circle cx="12" cy="8" r="4"/><path d="M8 12l-1 9 5-3 5 3-1-9"/>',
    person: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1"/>',
    truck: '<path d="M2 7h11v9H2z"/><path d="M13 10h4l4 4v2h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    code: '<path d="m8 9-4 3 4 3M16 9l4 3-4 3M13 6l-2 12"/>',
    cloud: '<path d="M6 16a4 4 0 1 1 1-7.9A5 5 0 0 1 17 8a4 4 0 0 1 1 8z"/>',
    cert: '<circle cx="12" cy="9" r="5"/><path d="M9 13l-1 8 4-2 4 2-1-8"/>',
    bolt: '<path d="m13 2-9 12h7l-2 8 9-12h-7z"/>',
    pin: '<circle cx="12" cy="11" r="2.5"/><path d="M12 21c4-4.5 7-8 7-11a7 7 0 0 0-14 0c0 3 3 6.5 7 11"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/>',
  };

  const PARTNERS = [
    { id: "central", icon: P.target, es: "Central de Monitoreo", en: "Monitoring Central", des: { es: "Orquestación de eventos, validación de alertas y despacho de respuesta.", en: "Event orchestration, alert validation and response dispatch." } },
    { id: "integ", icon: P.chip, es: "Integrador Tecnológico", en: "Tech Integrator", des: { es: "Diseño e instalación de infraestructura de seguridad certificada.", en: "Design and install of certified security infrastructure." } },
    { id: "emer", icon: P.shield, es: "Prestador de Asistencia", en: "Assistance Provider", des: { es: "Unidades de respuesta física, servicios médicos y asistencia en sitio.", en: "Physical response units, medical services and on-site assistance." } },
  ];

  // ============================ PROFILE CONFIGS ============================
  const PRIO = [
    { c: "var(--crit)", l: { es: "Crítica", en: "Critical" }, e: { es: "Caídas, paro cardíaco, SOS manual", en: "Falls, cardiac arrest, manual SOS" }, ti: "90 seg" },
    { c: "var(--orange-500)", l: { es: "Alta", en: "High" }, e: { es: "Falla de sensor, desvío de ruta", en: "Sensor failure, route deviation" }, ti: "5 min" },
    { c: "var(--warn)", l: { es: "Media", en: "Medium" }, e: { es: "Batería < 10%, offline > 1h", en: "Battery < 10%, offline > 1h" }, ti: "15 min" },
    { c: "var(--ok)", l: { es: "Baja", en: "Low" }, e: { es: "Test diario, log informativo", en: "Daily test, info log" }, ti: "60 min" },
  ];

  const PROFILES = {
    // ---------------- CENTRAL DE MONITOREO ----------------
    central: {
      steps: [["Registro", "Registration"], ["Organización", "Organization"], ["Revisión", "Review"]],
      defaults: { sel: { channels: ["call", "wa", "push"], services: ["home", "industrial", "monsol"], conn: ["lte", "wifi", "api"], resil: ["redund", "energy"] }, single: { volume: "medium" }, sliders: { val: 45, notif: 30, coord: 150 } },
      org: { crumb: { es: "Configuración · Organización", en: "Setup · Organization" }, title: { es: "Configura tu central de monitoreo", en: "Configure your monitoring central" }, sub: { es: "Define tu alcance, canales y los servicios que orquestarás en la red.", en: "Define your reach, channels and the services you'll orchestrate in the network." }, secs: [
        { kind: "label", n: "A", es: "Cobertura operativa", en: "Operational coverage" },
        { kind: "badges", items: ["CDMX", "Edo. de México", "Querétaro", "Puebla"] },
        { kind: "label", n: "B", es: "Canales de contacto", en: "Contact channels" },
        { kind: "ch", group: "channels", items: [{ id: "call", icon: P.call, es: "Llamada", en: "Call" }, { id: "wa", icon: P.wa, es: "WhatsApp", en: "WhatsApp" }, { id: "push", icon: P.push, es: "Push móvil", en: "Mobile push" }, { id: "sms", icon: P.sms, es: "SMS", en: "SMS" }] },
        { kind: "label", n: "C", es: "Servicios que orquestarás", en: "Services you'll orchestrate" },
        { kind: "pick", group: "services", multi: true, cols: 2, items: [
          { id: "home", icon: P.home, es: "Monitoreo de hogar y retail", en: "Home and retail monitoring", des: { es: "Hogares, comercios y locales.", en: "Homes, shops and storefronts." } },
          { id: "transport", icon: P.truck, es: "Transporte y Logística", en: "Transportation & Logistics", des: { es: "Flotas, carga y rutas.", en: "Fleet, cargo and routes." } },
          { id: "energy", icon: P.bolt, es: "Energía y Servicios", en: "Energy & Utilities", des: { es: "Red, agua y medición.", en: "Grid, water and metering." } },
          { id: "industrial", icon: P.industry, es: "Industrial", en: "Industrial", des: { es: "Plantas, maquinaria y seguridad.", en: "Plants, machinery and safety." } },
          { id: "agri", icon: P.leaf, es: "Agricultura y Ganadería", en: "Agriculture & Livestock", des: { es: "Campos, ganado y activos.", en: "Fields, herds and assets." } },
          { id: "health", icon: P.wave, es: "Salud", en: "Healthcare", des: { es: "Pacientes, signos vitales e instalaciones.", en: "Patients, vitals and facilities." } },
          { id: "weather", icon: P.cloud, es: "Clima", en: "Weather", des: { es: "Sensado ambiental y climático.", en: "Environmental and climate sensing." } },
          { id: "monsol", icon: P.target, es: "Solución de Monitoreo", en: "Monitoring Solution", des: { es: "Monitoreo integral de Nevula.", en: "End-to-end Nevula monitoring." } },
        ] },
      ] },
      ops: { crumb: { es: "Configuración · Operación", en: "Setup · Operations" }, title: { es: "Configura tu modelo operativo", en: "Configure your operating model" }, sub: { es: "Define tiempos objetivo, prioridades, actores y reglas de escalamiento.", en: "Define target times, priorities, actors and escalation rules." }, secs: [
        { kind: "label", n: "A", es: "Tiempos objetivo (SLA)", en: "Target times (SLA)" },
        { kind: "sla", items: [{ id: "val", es: "Validación de alerta", en: "Alert validation", min: 10, max: 120, unit: "s" }, { id: "notif", es: "Notificación a red", en: "Network notification", min: 5, max: 60, unit: "s" }, { id: "coord", es: "Coordinación total", en: "Full coordination", min: 30, max: 300, unit: "s" }] },
        { kind: "label", n: "B", es: "Matriz de prioridades", en: "Priority matrix" },
        { kind: "matrix", rows: PRIO },
        { kind: "label", n: "C", es: "Actores responsables", en: "Responsible actors" },
        { kind: "actors", items: [
          { icon: P.call, n: { es: "Operador Central", en: "Central Operator" }, d: { es: "Reacción primaria · monitoreo en vivo", en: "Primary reaction · live monitoring" }, ch: ["Dashboard", "Voz IP"] },
          { icon: P.person, n: { es: "Familiar / Contacto 1", en: "Relative / Contact 1" }, d: { es: "Confirmación de bienestar", en: "Wellbeing confirmation" }, ch: ["App Push", "WhatsApp"] },
          { icon: P.ambulance, n: { es: "Cuerpos de Emergencia", en: "Emergency Services" }, d: { es: "Atención médica, traslados, rescate", en: "Medical care, transfers, rescue" }, ch: ["911", "Radio"] },
        ] },
        { kind: "label", n: "D", es: "Lógica de escalamiento", en: "Escalation logic" },
        { kind: "esc", items: [
          { t: { es: "Regla de Desatención Primaria", en: "Primary Non-Response Rule" }, d: { es: "Si el usuario no responde en 30 s → llamar a <b>Contacto 1</b> y notificar a <b>Guardia de Turno</b>.", en: "If the user doesn't respond in 30 s → call <b>Contact 1</b> and notify <b>Shift Guard</b>." } },
          { t: { es: "Regla de Emergencia Médica", en: "Medical Emergency Rule" }, d: { es: "Si la alerta es por impacto fuerte (G-Force > 4.5) → despacho de <b>Ambulancia</b> sin esperar validación.", en: "If the alert is a hard impact (G-Force > 4.5) → dispatch <b>Ambulance</b> without waiting for validation." } },
        ] },
      ] },
      tech: { crumb: { es: "Configuración · Tecnología", en: "Setup · Technology" }, title: { es: "Configura tu capacidad tecnológica", en: "Configure your technology capacity" }, sub: { es: "Define volumen, conectividad, resiliencia y valida tus módulos en la red.", en: "Define volume, connectivity, resilience and validate your modules." }, secs: [
        { kind: "label", n: "A", es: "Volumen de operación", en: "Operation volume" },
        { kind: "pick", group: "volume", multi: false, cols: 4, items: [{ id: "startup", es: "Startup", en: "Startup", des: { es: "Hasta 1k dispositivos", en: "Up to 1k devices" } }, { id: "medium", es: "Medium", en: "Medium", des: { es: "1k – 10k · cloud", en: "1k – 10k · cloud" } }, { id: "enterprise", es: "Enterprise", en: "Enterprise", des: { es: "10k – 50k · multi-nodo", en: "10k – 50k · multi-node" } }, { id: "scale", es: "Scale", en: "Scale", des: { es: "50k+ · redundancia local", en: "50k+ · local redundancy" } }] },
        { kind: "label", n: "B", es: "Capas de conectividad", en: "Connectivity layers" },
        { kind: "ch", group: "conn", items: [{ id: "lte", icon: P.radio, es: "4G / LTE / 5G", en: "4G / LTE / 5G", tag: { es: "VPN dinámicos", en: "dynamic VPN" } }, { id: "wifi", icon: P.cloud, es: "Wi-Fi Empresarial", en: "Enterprise Wi-Fi", tag: { es: "WPA3 · aislamiento AP", en: "WPA3 · AP isolation" } }, { id: "api", icon: P.code, es: "API REST Full Stack", en: "API REST Full Stack", tag: { es: "Nativo Nevula · JSON", en: "Nevula native · JSON" } }, { id: "lora", icon: P.gateway, es: "Sigfox / LoRaWAN", en: "Sigfox / LoRaWAN", tag: { es: "Requiere gateway", en: "Requires gateway" } }] },
        { kind: "label", n: "C", es: "Resiliencia y disponibilidad", en: "Resilience & availability" },
        { kind: "ch", group: "resil", cols: 3, items: [{ id: "redund", icon: P.cloud, es: "Redundancia multicapa", en: "Multi-layer redundancy", tag: { es: "Failover < 50ms", en: "Failover < 50ms" } }, { id: "energy", icon: P.bolt, es: "Respaldo Cloud Edge", en: "Cloud Edge backup", tag: { es: "Energía ininterrumpida", en: "Uninterrupted power" } }, { id: "latency", icon: P.clock, es: "Latencia avanzada", en: "Advanced latency", tag: { es: "Análisis predictivo", en: "Predictive analysis" } }] },
        { kind: "label", n: "D", es: "Validación de módulos · Readiness", en: "Module validation · Readiness" },
        { kind: "rtable", rows: [{ n: { es: "Cuidado Senior", en: "Senior Care" }, m: "Bluetooth / MQTT", ok: true }, { n: { es: "Botón de Pánico", en: "Panic Button" }, m: "GPS / GLONASS", ok: true }, { n: { es: "Video Verificación Pro", en: "Pro Video Verification" }, m: "Encrypted H.265", ok: false }, { n: { es: "Consola de Monitoreo", en: "Monitoring Console" }, m: "WebSocket Sec.", ok: true }] },
      ] },
      insights: [
        { es: "Las Centrales de Monitoreo desbloquean orquestación de eventos y despacho táctico desde el día uno.", en: "Monitoring Centrals unlock event orchestration and tactical dispatch from day one." },
        { es: "Completar tu organización habilita el <b>Dashboard de Cobertura Regional</b> centralizado.", en: "Completing your organization enables the centralized <b>Regional Coverage Dashboard</b>." },
        { es: "Reducir el SLA de validación a <b>< 40 s</b> evita desenlaces críticos en caídas de adulto mayor.", en: "Cutting validation SLA to <b>< 40 s</b> prevents critical outcomes in senior falls." },
        { es: "Volumen <b>Medium</b> reduce la latencia media 22% vía arquitectura multi-región.", en: "<b>Medium</b> volume cuts average latency 22% via multi-region architecture." },
        { es: "La activación publica tu central en el marketplace de Nevula para clientes corporativos.", en: "Activation publishes your central in the Nevula marketplace for corporate clients." },
      ],
      nexts: [["Revisión operativa", "Operational review"], ["Validación tecnológica", "Tech validation"], ["Configuración de consola", "Console setup"], ["Activación piloto", "Pilot activation"]],
      review: { note: { es: "La integración con el servicio externo de ambulancias requiere validación física en campo. Se recomienda activar en modo <b>Supervisado</b> durante las primeras 48 horas.", en: "External ambulance integration requires field validation. Activate in <b>Supervised</b> mode for the first 48 hours." },
        cards: [
          { ic: P.person, t: { es: "Organización", en: "Organization" }, rows: (s) => [t("Cobertura", "Coverage") + ": 4 " + t("estados", "states"), t("Servicios", "Services") + ": " + cnt(s, "services"), t("Canales", "Channels") + ": " + cnt(s, "channels")] },
        ],
        checks: [[["Documentación legal", "Legal documentation"], "ok"], [["Infraestructura de red", "Network infrastructure"], "ok"], [["Zonas de cobertura", "Coverage zones"], "ok"], [["Pruebas de latencia", "Latency tests"], "warn"], [["Protocolos de emergencia", "Emergency protocols"], "ok"], [["Integración API terceros", "3rd-party API"], "warn"]] },
    },

    // ---------------- INTEGRADOR TECNOLÓGICO ----------------
    integ: {
      steps: [["Registro", "Registration"], ["Capacidades", "Capabilities"], ["Equipo y Campo", "Team & Field"], ["Integración", "Integration"], ["Revisión", "Review"]],
      defaults: { sel: { segments: ["resi", "comm"], certs: ["nom", "net"], brands: ["panic", "access"], protocols: ["zigbee", "api"], dispatch: [] }, single: { volume: "mid" }, sliders: { crews: 12, inst: 3, sup: 4 } },
      org: { crumb: { es: "Perfil · Integrador", en: "Profile · Integrator" }, title: { es: "Define tus capacidades de instalación", en: "Define your installation capabilities" }, sub: { es: "Dónde instalas, qué segmentos atiendes y las certificaciones de tu equipo.", en: "Where you install, which segments you serve and your team's certifications." }, secs: [
        { kind: "label", n: "A", es: "Regiones de instalación", en: "Installation regions" },
        { kind: "badges", items: ["CDMX", "Bajío", "Monterrey", "Occidente"] },
        { kind: "label", n: "B", es: "Segmentos que atiendes", en: "Segments you serve" },
        { kind: "pick", group: "segments", multi: true, cols: 4, items: [{ id: "resi", icon: P.home, es: "Residencial", en: "Residential" }, { id: "comm", icon: P.building, es: "Comercial", en: "Commercial" }, { id: "ind", icon: P.industry, es: "Industrial", en: "Industrial" }, { id: "gov", icon: P.gov, es: "Gobierno", en: "Government" }] },
        { kind: "label", n: "C", es: "Certificaciones del equipo", en: "Team certifications" },
        { kind: "ch", group: "certs", items: [{ id: "nom", icon: P.cert, es: "NOM-DGSP", en: "NOM-DGSP", tag: { es: "Seguridad privada", en: "Private security" } }, { id: "iso", icon: P.cert, es: "ISO 9001", en: "ISO 9001", tag: { es: "Calidad", en: "Quality" } }, { id: "cable", icon: P.wrench, es: "Cableado estructurado", en: "Structured cabling", tag: { es: "Certif. obra", en: "Site cert." } }, { id: "net", icon: P.code, es: "Redes IP / CCTV", en: "IP / CCTV networks", tag: { es: "Nivel técnico", en: "Technician" } }] },
      ] },
      ops: { crumb: { es: "Operación · Campo", en: "Operations · Field" }, title: { es: "Capacidad de campo y soporte", en: "Field & support capacity" }, sub: { es: "Tu fuerza de instalación, las marcas que integras y tu estructura de soporte.", en: "Your installation force, the brands you integrate and your support structure." }, secs: [
        { kind: "label", n: "A", es: "Capacidad de campo", en: "Field capacity" },
        { kind: "sla", items: [{ id: "crews", es: "Cuadrillas técnicas", en: "Technician crews", min: 1, max: 60, unit: "" }, { id: "inst", es: "Tiempo prom. de instalación", en: "Avg. install time", min: 1, max: 8, unit: "h" }, { id: "sup", es: "SLA de soporte en sitio", en: "On-site support SLA", min: 1, max: 24, unit: "h" }] },
        { kind: "label", n: "B", es: "Marcas y dispositivos que integras", en: "Brands & devices you integrate" },
        { kind: "pick", group: "brands", multi: true, cols: 2, items: [{ id: "panic", icon: P.shield, es: "Botones y pánico", en: "Buttons & panic", des: { es: "Pendientes, fijos y móviles.", en: "Pendants, fixed and mobile." } }, { id: "env", icon: P.leak, es: "Sensores ambientales", en: "Environmental sensors", des: { es: "Humo, fuga, temperatura.", en: "Smoke, leak, temperature." } }, { id: "access", icon: P.lock, es: "Control de acceso", en: "Access control", des: { es: "Cerraduras y contactos.", en: "Locks and contacts." } }, { id: "cctv", icon: P.cam, es: "CCTV / Video", en: "CCTV / Video", des: { es: "Cámaras con verificación IA.", en: "Cameras with AI verification." } }] },
        { kind: "label", n: "C", es: "Estructura de soporte", en: "Support structure" },
        { kind: "actors", items: [{ icon: P.wrench, n: { es: "Técnico de campo", en: "Field technician" }, d: { es: "Instalación y puesta en marcha en sitio", en: "On-site install and commissioning" }, ch: ["App de campo", "GPS"] }, { icon: P.call, n: { es: "Soporte N1 remoto", en: "Remote L1 support" }, d: { es: "Diagnóstico y primer contacto", en: "Diagnostics and first contact" }, ch: ["Ticket", "Voz IP"] }, { icon: P.badge, n: { es: "Ingeniero de proyecto", en: "Project engineer" }, d: { es: "Diseño, certificación de obra y escalamiento", en: "Design, site cert. and escalation" }, ch: ["Panel", "Email"] }] },
      ] },
      tech: { crumb: { es: "Integración · Técnica", en: "Integration · Technical" }, title: { es: "Capacidad técnica de integración", en: "Technical integration capacity" }, sub: { es: "Volumen, protocolos que dominas y herramientas de integrador habilitadas.", en: "Volume, protocols you master and the integrator tools you enable." }, secs: [
        { kind: "label", n: "A", es: "Volumen de instalaciones", en: "Installation volume" },
        { kind: "pick", group: "volume", multi: false, cols: 4, items: [{ id: "boutique", es: "Boutique", en: "Boutique", des: { es: "< 50 / mes", en: "< 50 / mo" } }, { id: "mid", es: "Medio", en: "Mid", des: { es: "50 – 200 / mes", en: "50 – 200 / mo" } }, { id: "high", es: "Alto", en: "High", des: { es: "200 – 500 / mes", en: "200 – 500 / mo" } }, { id: "mass", es: "Masivo", en: "Mass", des: { es: "500+ / mes", en: "500+ / mo" } }] },
        { kind: "label", n: "B", es: "Protocolos que manejas", en: "Protocols you handle" },
        { kind: "ch", group: "protocols", items: [{ id: "zigbee", icon: P.gateway, es: "Zigbee", en: "Zigbee", tag: { es: "Mesh", en: "Mesh" } }, { id: "zwave", icon: P.gateway, es: "Z-Wave", en: "Z-Wave", tag: { es: "Sub-GHz", en: "Sub-GHz" } }, { id: "bus", icon: P.code, es: "BACnet / Modbus", en: "BACnet / Modbus", tag: { es: "Edificios", en: "Buildings" } }, { id: "api", icon: P.code, es: "API REST Nevula", en: "Nevula REST API", tag: { es: "Nativo", en: "Native" } }] },
        { kind: "label", n: "C", es: "Herramientas de integrador", en: "Integrator tools" },
        { kind: "rtable", rows: [{ n: { es: "App de campo", en: "Field app" }, m: "iOS / Android", ok: true }, { n: { es: "Panel de instalador", en: "Installer panel" }, m: "Web", ok: true }, { n: { es: "Certificación de obra digital", en: "Digital site certification" }, m: "PDF / firma", ok: false }, { n: { es: "Inventario sincronizado", en: "Synced inventory" }, m: "Marketplace", ok: true }] },
      ] },
      insights: [
        { es: "Los Integradores certificados aparecen en el directorio de instaladores recomendados de Nevula.", en: "Certified Integrators appear in Nevula's recommended installer directory." },
        { es: "Atender <b>3+ segmentos</b> multiplica los proyectos referidos por las centrales de la red.", en: "Serving <b>3+ segments</b> multiplies projects referred by network centrals." },
        { es: "Una cuadrilla con app de campo reduce el tiempo de puesta en marcha hasta <b>40%</b>.", en: "A crew with the field app cuts commissioning time by up to <b>40%</b>." },
        { es: "Manejar la <b>API REST nativa</b> habilita instalación con auto-aprovisionamiento de dispositivos.", en: "Mastering the <b>native REST API</b> enables install with device auto-provisioning." },
        { es: "La activación publica tu empresa como integrador verificado para toda la red.", en: "Activation publishes you as a verified integrator for the whole network." },
      ],
      nexts: [["Auditoría de capacidades", "Capability audit"], ["Certificación de cuadrillas", "Crew certification"], ["Acceso a panel de instalador", "Installer panel access"], ["Primer proyecto referido", "First referred project"]],
      review: { note: { es: "La <b>certificación de obra digital</b> está en validación. Mientras tanto, los proyectos se cierran con acta física firmada.", en: "<b>Digital site certification</b> is under validation. Meanwhile projects close with a signed physical record." },
        cards: [
          { ic: P.chip, t: { es: "Capacidades", en: "Capabilities" }, rows: (s) => [t("Regiones", "Regions") + ": 4", t("Segmentos", "Segments") + ": " + cnt(s, "segments"), t("Certificaciones", "Certifications") + ": " + cnt(s, "certs")] },
          { ic: P.wrench, t: { es: "Equipo y Campo", en: "Team & Field" }, rows: (s) => [t("Cuadrillas", "Crews") + ": " + s.sliders.crews, t("Instalación", "Install") + ": " + s.sliders.inst + "h", t("Marcas", "Brands") + ": " + cnt(s, "brands")] },
          { ic: P.code, t: { es: "Integración", en: "Integration" }, rows: (s) => [t("Volumen", "Volume") + ": " + cap(s.single.volume), t("Protocolos", "Protocols") + ": " + cnt(s, "protocols"), t("Soporte SLA", "Support SLA") + ": " + s.sliders.sup + "h"] },
        ],
        checks: [[["Documentación legal", "Legal documentation"], "ok"], [["Certificación de cuadrillas", "Crew certification"], "ok"], [["Cobertura de regiones", "Region coverage"], "ok"], [["Certificación de obra digital", "Digital site cert."], "warn"], [["Catálogo de marcas", "Brand catalog"], "ok"], [["Sincronización de inventario", "Inventory sync"], "ok"]] },
    },

    // ---------------- FABRICANTE ----------------
    fab: {
      steps: [["Registro", "Registration"], ["Catálogo", "Catalog"], ["Certificación", "Certification"], ["Integración", "Integration"], ["Revisión", "Review"]],
      defaults: { sel: { prodcats: ["sensor", "panic"], markets: ["resi", "ent"], certs: ["fcc", "nom"], protocols: ["mqtt", "api"] }, single: { volume: "serie" }, sliders: {} },
      org: { crumb: { es: "Perfil · Fabricante", en: "Profile · Manufacturer" }, title: { es: "Define tu catálogo de producto", en: "Define your product catalog" }, sub: { es: "Qué fabricas, tus líneas activas y el mercado objetivo de tus dispositivos.", en: "What you make, your active lines and your devices' target market." }, secs: [
        { kind: "label", n: "A", es: "Categorías de producto", en: "Product categories" },
        { kind: "pick", group: "prodcats", multi: true, cols: 4, items: [{ id: "sensor", icon: P.sensor, es: "Sensores", en: "Sensors" }, { id: "panic", icon: P.shield, es: "Botones / Wearables", en: "Buttons / Wearables" }, { id: "gateway", icon: P.gateway, es: "Gateways", en: "Gateways" }, { id: "cam", icon: P.cam, es: "Cámaras", en: "Cameras" }] },
        { kind: "label", n: "B", es: "Líneas de producto activas", en: "Active product lines" },
        { kind: "badges", items: ["Línea Simple", "Línea Pro", "Línea Edge"] },
        { kind: "label", n: "C", es: "Mercado objetivo", en: "Target market" },
        { kind: "ch", group: "markets", items: [{ id: "resi", icon: P.home, es: "Residencial", en: "Residential" }, { id: "ent", icon: P.building, es: "Empresarial", en: "Enterprise" }, { id: "gov", icon: P.gov, es: "Gobierno", en: "Government" }, { id: "oem", icon: P.factory, es: "OEM / Marca blanca", en: "OEM / White-label" }] },
      ] },
      ops: { crumb: { es: "Certificación · Cumplimiento", en: "Certification · Compliance" }, title: { es: "Certificación y homologación", en: "Certification & compliance" }, sub: { es: "Certificaciones de tus productos y el estado de pruebas de homologación Nevula.", en: "Your products' certifications and the status of Nevula compliance tests." }, secs: [
        { kind: "label", n: "A", es: "Certificaciones de producto", en: "Product certifications" },
        { kind: "ch", group: "certs", items: [{ id: "fcc", icon: P.cert, es: "FCC", en: "FCC", tag: { es: "EE.UU.", en: "USA" } }, { id: "ce", icon: P.cert, es: "CE", en: "CE", tag: { es: "Europa", en: "Europe" } }, { id: "nom", icon: P.cert, es: "NOM / IFT", en: "NOM / IFT", tag: { es: "México", en: "Mexico" } }, { id: "ul", icon: P.cert, es: "UL", en: "UL", tag: { es: "Seguridad", en: "Safety" } }] },
        { kind: "label", n: "B", es: "Pruebas de homologación Nevula", en: "Nevula compliance tests" },
        { kind: "rtable", rows: [{ n: { es: "Interoperabilidad", en: "Interoperability" }, m: "Hub Gen 2", ok: true }, { n: { es: "Seguridad de firmware", en: "Firmware security" }, m: "Cifrado AES-256", ok: true }, { n: { es: "Actualización OTA segura", en: "Secure OTA update" }, m: "Firmado", ok: false }, { n: { es: "Consumo energético", en: "Power consumption" }, m: "Batería 18m+", ok: true }] },
        { kind: "label", n: "C", es: "Equipo de producto", en: "Product team" },
        { kind: "actors", items: [{ icon: P.cert, n: { es: "Laboratorio de pruebas", en: "Test lab" }, d: { es: "Homologación e interoperabilidad", en: "Compliance and interoperability" }, ch: ["Reportes", "Lab"] }, { icon: P.code, n: { es: "Equipo de firmware", en: "Firmware team" }, d: { es: "OTA, seguridad y telemetría", en: "OTA, security and telemetry" }, ch: ["Git", "CI/CD"] }, { icon: P.badge, n: { es: "Soporte de integración", en: "Integration support" }, d: { es: "Acompañamiento técnico a partners", en: "Technical guidance to partners" }, ch: ["SDK", "Slack"] }] },
      ] },
      tech: { crumb: { es: "Integración · Nevula", en: "Integration · Nevula" }, title: { es: "Integración nativa con Nevula", en: "Native integration with Nevula" }, sub: { es: "Protocolos soportados, herramientas de fabricante y volumen de producción.", en: "Supported protocols, manufacturer tools and production volume." }, secs: [
        { kind: "label", n: "A", es: "Volumen de producción", en: "Production volume" },
        { kind: "pick", group: "volume", multi: false, cols: 4, items: [{ id: "proto", es: "Prototipo", en: "Prototype", des: { es: "Pre-serie", en: "Pre-series" } }, { id: "pilot", es: "Piloto", en: "Pilot", des: { es: "1 – 5k uds", en: "1 – 5k units" } }, { id: "serie", es: "Serie", en: "Series", des: { es: "5 – 50k uds", en: "5 – 50k units" } }, { id: "mass", es: "Masa", en: "Mass", des: { es: "50k+ uds", en: "50k+ units" } }] },
        { kind: "label", n: "B", es: "Protocolos nativos soportados", en: "Native protocols supported" },
        { kind: "ch", group: "protocols", items: [{ id: "mqtt", icon: P.code, es: "MQTT", en: "MQTT", tag: { es: "Telemetría", en: "Telemetry" } }, { id: "coap", icon: P.code, es: "CoAP", en: "CoAP", tag: { es: "Bajo consumo", en: "Low power" } }, { id: "api", icon: P.code, es: "API REST", en: "REST API", tag: { es: "Nativo", en: "Native" } }, { id: "hook", icon: P.code, es: "Webhooks", en: "Webhooks", tag: { es: "Eventos", en: "Events" } }] },
        { kind: "label", n: "C", es: "Herramientas de fabricante", en: "Manufacturer tools" },
        { kind: "rtable", rows: [{ n: { es: "SDK Nevula", en: "Nevula SDK" }, m: "C / Python / JS", ok: true }, { n: { es: "Sandbox de pruebas", en: "Test sandbox" }, m: "Cloud", ok: true }, { n: { es: "Firmware OTA gestionado", en: "Managed OTA firmware" }, m: "Flota", ok: false }, { n: { es: "Publicación en Marketplace", en: "Marketplace publishing" }, m: "Catálogo aprobado", ok: false }] },
      ] },
      insights: [
        { es: "Los Fabricantes homologados entran al <b>Marketplace IoT</b> con sello “Aprobado Nevula”.", en: "Approved Manufacturers enter the <b>IoT Marketplace</b> with the “Nevula Approved” seal." },
        { es: "Cubrir <b>3+ categorías</b> de producto te posiciona como proveedor integral de la red.", en: "Covering <b>3+ product categories</b> positions you as an end-to-end network supplier." },
        { es: "La homologación de <b>OTA segura</b> es requisito para vender dispositivos actualizables.", en: "<b>Secure OTA</b> compliance is required to sell updatable devices." },
        { es: "Integrar <b>MQTT + API REST</b> permite que tus dispositivos sean plug-and-play en cualquier estación.", en: "Integrating <b>MQTT + REST API</b> makes your devices plug-and-play in any station." },
        { es: "La activación lista tus productos para que cualquier partner los compre e integre en segundos.", en: "Activation lists your products so any partner can buy and integrate them in seconds." },
      ],
      nexts: [["Homologación de catálogo", "Catalog compliance"], ["Acceso al SDK y sandbox", "SDK & sandbox access"], ["Publicación en Marketplace", "Marketplace publishing"], ["Primer pedido de la red", "First network order"]],
      review: { note: { es: "La <b>actualización OTA segura</b> y la <b>publicación en Marketplace</b> están en homologación. Tus productos entran como “En validación” hasta aprobarse.", en: "<b>Secure OTA</b> and <b>Marketplace publishing</b> are under compliance. Your products enter as “Validating” until approved." },
        cards: [
          { ic: P.factory, t: { es: "Catálogo", en: "Catalog" }, rows: (s) => [t("Categorías", "Categories") + ": " + cnt(s, "prodcats"), t("Líneas", "Lines") + ": 3", t("Mercados", "Markets") + ": " + cnt(s, "markets")] },
          { ic: P.cert, t: { es: "Certificación", en: "Certification" }, rows: (s) => [t("Certificaciones", "Certifications") + ": " + cnt(s, "certs"), t("Homologación", "Compliance") + ": 3/4", t("Seguridad", "Security") + ": AES-256"] },
          { ic: P.code, t: { es: "Integración", en: "Integration" }, rows: (s) => [t("Producción", "Production") + ": " + cap(s.single.volume), t("Protocolos", "Protocols") + ": " + cnt(s, "protocols"), "SDK: " + t("activo", "active")] },
        ],
        checks: [[["Razón social y fiscal", "Legal & tax"], "ok"], [["Certificaciones de producto", "Product certifications"], "ok"], [["Interoperabilidad Hub", "Hub interoperability"], "ok"], [["OTA segura", "Secure OTA"], "warn"], [["SDK integrado", "SDK integrated"], "ok"], [["Publicación en Marketplace", "Marketplace publishing"], "warn"]] },
    },

    // ---------------- PRESTADOR DE EMERGENCIA ----------------
    emer: {
      steps: [["Registro", "Registration"], ["Cobertura", "Coverage"], ["Unidades", "Units"], ["Protocolos", "Protocols"], ["Revisión", "Review"]],
      defaults: { sel: { svctypes: ["med", "sec"], dispatch: ["911", "app"], unittypes: ["bls", "als"], coord: ["911", "cruzroja"] }, single: { volume: "regional" }, sliders: { units: 18, resp: 8, radius: 12 } },
      org: { crumb: { es: "Perfil · Emergencia", en: "Profile · Emergency" }, title: { es: "Define tu cobertura de respuesta", en: "Define your response coverage" }, sub: { es: "Tus zonas, los tipos de servicio que ofreces y tus canales de despacho.", en: "Your zones, the service types you offer and your dispatch channels." }, secs: [
        { kind: "label", n: "A", es: "Zonas de respuesta", en: "Response zones" },
        { kind: "badges", items: ["Centro CDMX", "Poniente", "Norte", "Sur"] },
        { kind: "label", n: "B", es: "Tipos de servicio", en: "Service types" },
        { kind: "pick", group: "svctypes", multi: true, cols: 4, items: [{ id: "med", icon: P.ambulance, es: "Médica / Ambulancia", en: "Medical / Ambulance" }, { id: "sec", icon: P.shield, es: "Seguridad privada", en: "Private security" }, { id: "fire", icon: P.bolt, es: "Bomberos", en: "Firefighters" }, { id: "rescue", icon: P.person, es: "Rescate", en: "Rescue" }] },
        { kind: "label", n: "C", es: "Canales de despacho", en: "Dispatch channels" },
        { kind: "ch", group: "dispatch", items: [{ id: "911", icon: P.bell, es: "911 / C5", en: "911 / C5", tag: { es: "Oficial", en: "Official" } }, { id: "radio", icon: P.radio, es: "Radio troncalizado", en: "Trunked radio", tag: { es: "Flota", en: "Fleet" } }, { id: "app", icon: P.push, es: "App de unidad", en: "Unit app", tag: { es: "Nevula", en: "Nevula" } }, { id: "wa", icon: P.wa, es: "WhatsApp", en: "WhatsApp", tag: { es: "Coordinación", en: "Coordination" } }] },
      ] },
      ops: { crumb: { es: "Operación · Unidades", en: "Operations · Units" }, title: { es: "Flota, tiempos y tripulaciones", en: "Fleet, times & crews" }, sub: { es: "Tu capacidad de flota, los tipos de unidad y los roles que despliegas.", en: "Your fleet capacity, unit types and the roles you deploy." }, secs: [
        { kind: "label", n: "A", es: "Capacidad de flota", en: "Fleet capacity" },
        { kind: "sla", items: [{ id: "units", es: "Unidades activas", en: "Active units", min: 1, max: 100, unit: "" }, { id: "resp", es: "Tiempo de respuesta", en: "Response time", min: 3, max: 30, unit: "min" }, { id: "radius", es: "Radio de cobertura", en: "Coverage radius", min: 1, max: 50, unit: "km" }] },
        { kind: "label", n: "B", es: "Tipos de unidad", en: "Unit types" },
        { kind: "pick", group: "unittypes", multi: true, cols: 2, items: [{ id: "bls", icon: P.ambulance, es: "Ambulancia BLS", en: "BLS ambulance", des: { es: "Soporte vital básico.", en: "Basic life support." } }, { id: "als", icon: P.ambulance, es: "Ambulancia ALS", en: "ALS ambulance", des: { es: "Soporte vital avanzado.", en: "Advanced life support." } }, { id: "moto", icon: P.shield, es: "Unidad motorizada", en: "Motorized unit", des: { es: "Primer respondiente ágil.", en: "Agile first responder." } }, { id: "patrol", icon: P.truck, es: "Patrulla de seguridad", en: "Security patrol", des: { es: "Respuesta de seguridad física.", en: "Physical security response." } }] },
        { kind: "label", n: "C", es: "Tripulaciones y roles", en: "Crews & roles" },
        { kind: "actors", items: [{ icon: P.person, n: { es: "Paramédico", en: "Paramedic" }, d: { es: "Atención prehospitalaria en sitio", en: "On-site pre-hospital care" }, ch: ["App unidad", "Radio"] }, { icon: P.badge, n: { es: "Médico de urgencias", en: "Emergency physician" }, d: { es: "Soporte avanzado y telemedicina", en: "Advanced support and telemedicine" }, ch: ["Video", "Voz IP"] }, { icon: P.target, n: { es: "Coordinador de despacho", en: "Dispatch coordinator" }, d: { es: "Asignación y seguimiento de unidades", en: "Unit assignment and tracking" }, ch: ["Consola", "GPS"] }] },
      ] },
      tech: { crumb: { es: "Coordinación · Protocolos", en: "Coordination · Protocols" }, title: { es: "Protocolos y capacidades operativas", en: "Protocols & operational capabilities" }, sub: { es: "Con quién te coordinas, tu volumen de servicios y tus capacidades digitales.", en: "Who you coordinate with, your service volume and your digital capabilities." }, secs: [
        { kind: "label", n: "A", es: "Volumen de servicios", en: "Service volume" },
        { kind: "pick", group: "volume", multi: false, cols: 4, items: [{ id: "local", es: "Local", en: "Local", des: { es: "< 100 / mes", en: "< 100 / mo" } }, { id: "regional", es: "Regional", en: "Regional", des: { es: "100 – 500 / mes", en: "100 – 500 / mo" } }, { id: "estatal", es: "Estatal", en: "Statewide", des: { es: "500 – 2k / mes", en: "500 – 2k / mo" } }, { id: "nacional", es: "Nacional", en: "National", des: { es: "2k+ / mes", en: "2k+ / mo" } }] },
        { kind: "label", n: "B", es: "Protocolos de coordinación", en: "Coordination protocols" },
        { kind: "ch", group: "coord", items: [{ id: "911", icon: P.bell, es: "911", en: "911", tag: { es: "Nacional", en: "National" } }, { id: "c5", icon: P.target, es: "C5 / C4", en: "C5 / C4", tag: { es: "Ciudad", en: "City" } }, { id: "cruzroja", icon: P.shield, es: "Cruz Roja", en: "Red Cross", tag: { es: "Médico", en: "Medical" } }, { id: "pc", icon: P.bolt, es: "Protección Civil", en: "Civil Protection", tag: { es: "Siniestros", en: "Disasters" } }] },
        { kind: "label", n: "C", es: "Capacidades operativas", en: "Operational capabilities" },
        { kind: "rtable", rows: [{ n: { es: "GPS en tiempo real", en: "Real-time GPS" }, m: "Flota completa", ok: true }, { n: { es: "App de unidad", en: "Unit app" }, m: "iOS / Android", ok: true }, { n: { es: "Bitácora digital", en: "Digital logbook" }, m: "Por servicio", ok: true }, { n: { es: "Integración hospitalaria", en: "Hospital integration" }, m: "Pre-aviso", ok: false }] },
      ] },
      insights: [
        { es: "Los Prestadores de Emergencia reciben despachos directos desde las centrales de la red.", en: "Emergency Providers receive direct dispatches from network centrals." },
        { es: "Cubrir <b>4 zonas</b> con respuesta < 10 min te prioriza en la asignación automática.", en: "Covering <b>4 zones</b> with < 10 min response prioritizes you in auto-assignment." },
        { es: "Una flota con <b>GPS en tiempo real</b> permite ETA en vivo en la consola del operador.", en: "A fleet with <b>real-time GPS</b> enables live ETA in the operator console." },
        { es: "Coordinarte vía <b>911 + C5</b> habilita el despacho conjunto con autoridades.", en: "Coordinating via <b>911 + C5</b> enables joint dispatch with authorities." },
        { es: "La activación te integra al panel de Coordinación de Ambulancia de toda la red.", en: "Activation plugs you into the network-wide Ambulance Coordination panel." },
      ],
      nexts: [["Verificación de unidades", "Unit verification"], ["Certificación de tripulaciones", "Crew certification"], ["Enlace con despacho", "Dispatch link-up"], ["Primer servicio coordinado", "First coordinated service"]],
      review: { note: { es: "La <b>integración hospitalaria</b> (pre-aviso a urgencias) está en validación. Mientras tanto la coordinación se realiza por línea directa.", en: "<b>Hospital integration</b> (ER pre-alert) is under validation. Meanwhile coordination runs via direct line." },
        cards: [
          { ic: P.pin, t: { es: "Cobertura", en: "Coverage" }, rows: (s) => [t("Zonas", "Zones") + ": 4", t("Servicios", "Services") + ": " + cnt(s, "svctypes"), t("Despacho", "Dispatch") + ": " + cnt(s, "dispatch")] },
          { ic: P.ambulance, t: { es: "Unidades", en: "Units" }, rows: (s) => [t("Flota", "Fleet") + ": " + s.sliders.units + " u", t("Respuesta", "Response") + ": " + s.sliders.resp + " min", t("Tipos", "Types") + ": " + cnt(s, "unittypes")] },
          { ic: P.target, t: { es: "Protocolos", en: "Protocols" }, rows: (s) => [t("Volumen", "Volume") + ": " + cap(s.single.volume), t("Coordinación", "Coordination") + ": " + cnt(s, "coord"), "GPS: " + t("activo", "active")] },
        ],
        checks: [[["Documentación legal", "Legal documentation"], "ok"], [["Certificación de unidades", "Unit certification"], "ok"], [["Cobertura de zonas", "Zone coverage"], "ok"], [["Integración hospitalaria", "Hospital integration"], "warn"], [["GPS de flota", "Fleet GPS"], "ok"], [["Bitácora digital", "Digital logbook"], "ok"]] },
    },
  };

  function cnt(s, g) { return (s.sel[g] && s.sel[g].size) || 0; }
  function cap(v) { return v ? v.charAt(0).toUpperCase() + v.slice(1) : "—"; }
  function lastStep() { return PROFILES[state.partner].steps.length - 1; }

  // ============================ STATE ============================
  const state = { step: 0, partner: "central", sel: {}, single: {}, sliders: {}, confirmed: false };
  function initProfile(p) {
    const d = PROFILES[p].defaults;
    state.sel = {}; state.single = { volume: (d.single && d.single.volume) }; state.sliders = {};
    Object.keys(d.sel || {}).forEach((g) => state.sel[g] = new Set(d.sel[g]));
    Object.assign(state.single, d.single || {});
    Object.assign(state.sliders, d.sliders || {});
  }
  initProfile("central");

  const host = document.getElementById("stepContent");

  // ============================ SECTION RENDERERS ============================
  function secLabel(n, es, en) { return '<div class="sec-label"><span class="n">' + n + '</span><span>' + t(es, en) + '</span></div>'; }
  function pickCard(group, multi, o, on) {
    return '<div class="pick' + (on ? " on" : "") + '" data-' + (multi ? "toggle" : "single") + '="' + group + '" data-val="' + o.id + '"><span class="pchk">' + (on ? CHECK : "") + '</span>' +
      (o.icon ? '<span class="pic">' + sIcon(o.icon) + '</span>' : "") + '<div class="pn">' + t(o.es, o.en) + '</div>' + (o.des ? '<div class="pd">' + t(o.des.es, o.des.en) + '</div>' : "") + '</div>';
  }
  function chTile(group, o, on) {
    return '<div class="ch' + (on ? " on" : "") + '" data-toggle="' + group + '" data-val="' + o.id + '"><div class="chh">' + sIcon(o.icon) + '<span class="minidot"></span></div><div class="chn">' + t(o.es, o.en) + '</div>' + (o.tag ? '<div class="pd" style="font-size:11px;color:var(--ink-400)">' + t(o.tag.es, o.tag.en) + '</div>' : "") + '</div>';
  }
  function slider(s) {
    const v = state.sliders[s.id];
    return '<div class="slider-row"><div class="srh"><span class="l">' + t(s.es, s.en) + '</span><span class="v" data-sv="' + s.id + '">' + v + s.unit + '</span></div><input type="range" min="' + s.min + '" max="' + s.max + '" value="' + v + '" data-slider="' + s.id + '" data-unit="' + s.unit + '"></div>';
  }
  function renderSec(sec) {
    switch (sec.kind) {
      case "label": return secLabel(sec.n, sec.es, sec.en);
      case "badges": return '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px">' + sec.items.map((c) => '<span class="badge badge-info"><span class="pip"></span>' + c + '</span>').join("") + '<span class="badge badge-quiet"><span class="pip"></span>+ ' + t("agregar", "add") + '</span></div>';
      case "pick": return '<div class="pickgrid c' + (sec.cols || 2) + '">' + sec.items.map((o) => pickCard(sec.group, sec.multi, o, sec.multi ? (state.sel[sec.group] && state.sel[sec.group].has(o.id)) : state.single[sec.group] === o.id)).join("") + '</div>';
      case "ch": return '<div class="chgrid"' + (sec.cols ? ' style="grid-template-columns:repeat(' + sec.cols + ',1fr)"' : "") + '>' + sec.items.map((o) => chTile(sec.group, o, state.sel[sec.group] && state.sel[sec.group].has(o.id))).join("") + '</div>';
      case "sla": return '<div class="sla-card">' + sec.items.map(slider).join("") + '</div>';
      case "matrix": return '<div class="matrix">' + sec.rows.map((r) => '<div class="mr"><span class="lvl"><span class="d" style="background:' + r.c + '"></span>' + t(r.l.es, r.l.en) + '</span><span class="ex">' + t(r.e.es, r.e.en) + '</span><span class="ti">' + r.ti + '</span></div>').join("") + '</div>';
      case "actors": return sec.items.map((a) => '<div class="rowcard"><span class="ic">' + sIcon(a.icon) + '</span><span class="rci"><div class="n">' + t(a.n.es, a.n.en) + '</div><div class="d">' + t(a.d.es, a.d.en) + '</div></span><span class="chans">' + a.ch.map((c) => '<span class="cc">' + c + '</span>').join("") + '</span></div>').join("");
      case "esc": return sec.items.map((e) => '<div class="esc"><div class="et">' + t(e.t.es, e.t.en) + '</div><div class="ed">' + t(e.d.es, e.d.en) + '</div></div>').join("");
      case "rtable": return '<div class="matrix rtable">' + sec.rows.map((r) => '<div class="rr"><span><span class="rn">' + t(r.n.es, r.n.en) + '</span>' + (r.m ? '<span class="rm">' + r.m + '</span>' : "") + '</span><span class="badge ' + (r.ok ? "badge-ok" : "badge-warn") + '"><span class="pip"></span>' + (r.ok ? t("Listo", "Ready") : t("Validando", "Validating")) + '</span></div>').join("") + '</div>';
      default: return "";
    }
  }

  function head(crumbEs, crumbEn, es, en, pEs, pEn) {
    return '<div class="step-head"><div class="crumb">' + t(crumbEs, crumbEn) + '</div><h1>' + t(es, en) + '</h1><p>' + t(pEs, pEn) + '</p></div>';
  }
  function renderStepGeneric(spec) {
    return head(spec.crumb.es, spec.crumb.en, spec.title.es, spec.title.en, spec.sub.es, spec.sub.en) + spec.secs.map(renderSec).join("");
  }

  function fld(es, en, val) { return '<div class="field"><label>' + t(es, en) + '</label><input class="input" value="' + val + '"></div>'; }
  function stepRegistro() {
    return head("Registro de Partner", "Partner Registration", "Únete a la Red de Partners de Nevula", "Join the Nevula Partner Network",
      "Selecciona tu perfil — la configuración se adapta a tu tipo de operación.", "Pick your profile — the setup adapts to your type of operation.") +
      '<div class="sec-label"><span class="n">A</span><span>' + t("Selecciona tu perfil de partner", "Select your partner profile") + '</span></div>' +
      '<div class="pickgrid c3">' + PARTNERS.map((p) => pickCard("partner", false, p, state.partner === p.id)).join("") + '</div>' +
      '<div class="sec-label"><span class="n">B</span><span>' + t("Datos de la organización", "Organization details") + '</span></div>' +
      '<div class="formgrid">' +
      fld("Nombre comercial", "Commercial name", "Central Horizonte 24/7") +
      fld("Razón social", "Legal name", "Horizonte Seguridad S.A. de C.V.") +
      fld("RFC / Tax ID", "RFC / Tax ID", "HSE240517AB1") +
      fld("Ciudad base", "Base city", "Ciudad de México") +
      fld("Correo corporativo", "Corporate email", "admin@horizonte24.mx") +
      fld("Teléfono", "Phone", "+52 55 1020 3040") +
      fld("Responsable principal", "Primary contact", "Laura Hernández") +
      fld("Cargo", "Role", "Directora de Operaciones") +
      '</div>';
  }

  function stepReview() {
    const p = PROFILES[state.partner];
    const idCard = { ic: P.clock, t: { es: "Identidad", en: "Identity" }, rows: () => ["Central Horizonte 24/7", t("Perfil", "Profile") + ": " + t(PARTNERS.find((x) => x.id === state.partner).es, PARTNERS.find((x) => x.id === state.partner).en), t("Responsable", "Lead") + ": Laura Hernández"] };
    const cards = [idCard].concat(p.review.cards);
    return head("Revisión Final", "Final Review", "Revisión y activación del partner", "Partner review & activation",
      "Verifica la configuración de tu perfil y confirma la activación dentro de la red operativa de Nevula.", "Verify your profile setup and confirm activation within Nevula's operational network.") +
      '<div class="pickgrid c2">' + cards.map((c) => '<div class="card" style="padding:18px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><span class="pic" style="background:var(--cobalt-50);color:var(--cobalt-500);width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center">' + sIcon(c.ic) + '</span><b style="font-size:15px;letter-spacing:-0.01em;color:var(--ink-100)">' + t(c.t.es, c.t.en) + '</b></div>' + c.rows(state).map((r) => '<div style="font-size:12.5px;color:var(--ink-300);padding:3px 0">' + r + '</div>').join("") + '</div>').join("") + '</div>' +
      '<div class="sec-label"><span class="n">✓</span><span>' + t("Checklist de readiness", "Readiness checklist") + '</span></div>' +
      '<div class="matrix rtable">' + p.review.checks.map((c) => '<div class="rr"><span class="rn">' + t(c[0][0], c[0][1]) + '</span><span class="badge ' + (c[1] === "ok" ? "badge-ok" : "badge-warn") + '"><span class="pip"></span>' + (c[1] === "ok" ? t("Validado", "Validated") : t("Parcial", "Partial")) + '</span></div>').join("") + '</div>' +
      '<div class="insight" style="margin-top:22px"><div class="it">' + t("Nota de implementación", "Implementation note") + '</div><div class="id">' + t(p.review.note.es, p.review.note.en) + '</div></div>';
  }

  // ============================ METERS ============================
  function score() {
    let s = 12; if (state.partner) s += 8;
    Object.values(state.sel).forEach((set) => s += set.size * 3);
    s += Object.keys(state.single).filter((k) => state.single[k]).length * 4;
    s += Object.keys(state.sliders).length * 2;
    if (state.step >= lastStep()) s = state.confirmed ? 99 : Math.max(s, 92);
    return Math.min(99, s);
  }
  const SCOREDESC = [
    { es: "Define tu rol en el ecosistema para desbloquear la configuración contextual.", en: "Define your role to unlock the contextual setup." },
    { es: "Tu perfil permite que la red identifique tu alcance y capacidades.", en: "Your profile lets the network identify your reach and capabilities." },
    { es: "Configura tus parámetros operativos para coordinar con la red.", en: "Configure your operational parameters to coordinate with the network." },
    { es: "Define tu capacidad técnica e integración con Nevula.", en: "Define your technical capacity and Nevula integration." },
    { es: "Todo listo. Activa el partner para entrar en la red operativa.", en: "All set. Activate the partner to enter the operational network." },
  ];
  function syncMeters() {
    const p = PROFILES[state.partner];
    const sc = score();
    document.getElementById("scoreNum").textContent = sc;
    document.getElementById("scoreBar").style.width = sc + "%";
    const prog = Math.round((state.step + 1) / p.steps.length * 100);
    document.getElementById("progPct").textContent = prog + "%";
    document.getElementById("progFill").style.width = prog + "%";
    const sdi = state.step === p.steps.length - 1 ? 4 : state.step;
    document.getElementById("scoreDesc").textContent = t(SCOREDESC[sdi].es, SCOREDESC[sdi].en);
    document.getElementById("insightText").innerHTML = t(p.insights[sdi].es, p.insights[sdi].en);
    document.getElementById("nextList").innerHTML = p.nexts.map((n) => '<div class="ni"><span class="nic">' + sIcon('<path d="M5 12h14M13 6l6 6-6 6"/>').replace('stroke-width="1.7"', 'stroke-width="2"') + '</span><span class="nt"><b>' + t(n[0], n[1]) + '</b></span></div>').join("");
  }

  function renderRail() {
    const p = PROFILES[state.partner];
    const list = document.getElementById("stepList");
    list.innerHTML = p.steps.map((s, i) => {
      const cls = i === state.step ? "active" : (i < state.step ? "done" : "");
      const inner = i < state.step ? CHECK : (i < 9 ? "0" + (i + 1) : "" + (i + 1));
      return '<div class="step ' + cls + '" data-step="' + i + '"><span class="sn">' + inner + '</span><span class="si"><span class="sl">0' + (i + 1) + '</span><span class="snm">' + t(s[0], s[1]) + '</span></span></div>';
    }).join("");
    list.querySelectorAll(".step").forEach((el) => el.onclick = () => goto(+el.dataset.step));
  }

  const MIDDLE = ["org", "ops", "tech"];
  function renderStep() {
    const p = PROFILES[state.partner];
    const last = p.steps.length - 1;
    if (state.step > last) state.step = last;
    if (state.step === 0) host.innerHTML = stepRegistro();
    else if (state.step === last) host.innerHTML = stepReview();
    else host.innerHTML = renderStepGeneric(p[MIDDLE[state.step - 1]]);
    wireStep();
    const next = document.getElementById("obNext").querySelector("span");
    if (state.step === last) { next.setAttribute("data-es", "Activar Partner"); next.setAttribute("data-en", "Activate Partner"); document.getElementById("obNext").className = "btn btn-signal"; }
    else { next.setAttribute("data-es", "Continuar"); next.setAttribute("data-en", "Continue"); document.getElementById("obNext").className = "btn btn-cobalt"; }
    if (window.NEV && NEV.setLang) NEV.setLang(NEV.getLang());
    renderRail(); syncMeters();
    document.getElementById("obPrev").style.visibility = state.step === 0 ? "hidden" : "visible";
    host.parentElement.scrollTop = 0;
  }

  function wireStep() {
    host.querySelectorAll("[data-single]").forEach((el) => el.onclick = () => {
      const g = el.dataset.single, v = el.dataset.val;
      if (g === "partner") { if (state.partner !== v) { state.partner = v; initProfile(v); } }
      else state.single[g] = v;
      renderStep();
    });
    host.querySelectorAll("[data-toggle]").forEach((el) => el.onclick = () => {
      const g = el.dataset.toggle, v = el.dataset.val;
      if (!state.sel[g]) state.sel[g] = new Set();
      toggle(state.sel[g], v); renderStep();
    });
    host.querySelectorAll("[data-slider]").forEach((el) => el.oninput = () => {
      state.sliders[el.dataset.slider] = +el.value;
      host.querySelector('[data-sv="' + el.dataset.slider + '"]').textContent = el.value + el.dataset.unit;
      syncMeters();
    });
  }
  function toggle(set, id) { if (set.has(id)) set.delete(id); else set.add(id); }

  function goto(i) { state.step = Math.max(0, Math.min(lastStep(), i)); renderStep(); }
  document.getElementById("obNext").onclick = () => { if (state.step === lastStep()) { activate(); return; } goto(state.step + 1); };
  document.getElementById("obPrev").onclick = () => goto(state.step - 1);

  function activate() {
    state.confirmed = true; syncMeters();
    const pname = t(PARTNERS.find((x) => x.id === state.partner).es, PARTNERS.find((x) => x.id === state.partner).en);
    const totalSel = Object.values(state.sel).reduce((a, s) => a + s.size, 0);
    const scrim = document.createElement("div");
    scrim.className = "scrim";
    scrim.innerHTML = '<div class="dialog"><div class="dbody" style="text-align:center;padding:32px 28px 24px">' +
      '<div class="success-check" style="width:60px;height:60px;border-radius:50%;background:var(--ok-soft);display:flex;align-items:center;justify-content:center;margin:0 auto 16px"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" style="width:30px;height:30px;stroke:var(--ok)"><path d="M20 6 9 17l-5-5"/></svg></div>' +
      '<div style="font-size:22px;font-weight:700;letter-spacing:-0.02em;color:var(--ink-100)">' + t("Partner activado", "Partner activated") + '</div>' +
      '<p style="margin:10px auto 0;max-width:380px;font-size:14px;line-height:1.55;color:var(--ink-300)">' + t("Central Horizonte 24/7 se activó como <b>" + pname + "</b> en la red operativa de Nevula.", "Central Horizonte 24/7 is now active as <b>" + pname + "</b> in Nevula's operational network.") + '</p>' +
      '<div style="display:inline-flex;gap:24px;margin-top:18px"><div><div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-400)">Readiness</div><div style="font-size:24px;font-weight:700;color:var(--ok)">99%</div></div><div><div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-400)">' + t("Configurado", "Configured") + '</div><div style="font-size:24px;font-weight:700;color:var(--ink-100)">' + totalSel + '</div></div></div>' +
      '</div><div class="dfoot"><a class="btn btn-ghost" href="../onboarding/index.html" data-es="Revisar de nuevo" data-en="Review again">Revisar de nuevo</a><a class="btn btn-cobalt" href="../station/index.html"><span data-es="Entrar a la estación" data-en="Enter station">Entrar a la estación</span><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></div></div>';
    document.body.appendChild(scrim);
    requestAnimationFrame(() => scrim.classList.add("open"));
    if (window.NEV && NEV.setLang) NEV.setLang(NEV.getLang());
    NEV.toast(t("Partner activado en la red Nevula", "Partner activated in the Nevula network"), null, { mono: "99%" });
  }

  document.querySelectorAll("[data-lang-btn]").forEach((b) => b.addEventListener("click", () => { NEV.setLang(b.getAttribute("data-lang-btn")); renderStep(); }));

  renderStep();
})();
/* end */
