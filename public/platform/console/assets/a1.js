/* Nevula demo — shared cross-page store (localStorage)
   Lets the Marketplace push purchased devices into Live Monitoring,
   and lets any page deep-link a focus target into the operator console. */
(function () {
  const DEV_KEY = "nevula-devices-v1";
  const FOCUS_KEY = "nevula-focus-v1";

  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; } }
  function write(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }

  window.NEV_STORE = {
    // ---- purchased devices that flow into monitoring ----
    getDevices() { return read(DEV_KEY, []); },
    addDevices(arr) {
      const cur = read(DEV_KEY, []);
      arr.forEach((d) => { if (!cur.find((x) => x.id === d.id)) cur.push(d); });
      write(DEV_KEY, cur);
      return cur;
    },
    updateDevice(id, patch) {
      const cur = read(DEV_KEY, []);
      const d = cur.find((x) => x.id === id);
      if (d) { Object.assign(d, patch); write(DEV_KEY, cur); }
      return d;
    },
    clearDevices() { write(DEV_KEY, []); },

    // ---- deep-link focus (e.g. open this alarm / device in the console) ----
    setFocus(target) { write(FOCUS_KEY, target); },     // {mode:'alarms'|'devices', target:'#8485'|'12CA918'}
    takeFocus() { const f = read(FOCUS_KEY, null); write(FOCUS_KEY, null); return f; },

    // generate a fresh hex device id
    newId() { return (Math.random().toString(16).slice(2, 8)).toUpperCase(); },

    // ---- service registry (programs a device can be enrolled in) ----
    services: [
      { v: "panico", es: "Botón de Pánico", en: "Panic Button" },
      { v: "senior", es: "Cuidado Activo Senior", en: "Senior Care" },
      { v: "acceso", es: "Gestión de Acceso", en: "Access Management" },
      { v: "geocerca", es: "Geocerca de Activos", en: "Asset Geofencing" },
      { v: "incendio", es: "Detección de Incendio", en: "Fire Detection" },
      { v: "fuga", es: "Detección de Fugas e Inundación", en: "Leak & Flood Detection" },
      { v: "video", es: "Video Verificación", en: "Video Verification" },
      { v: "iot", es: "Salud de Dispositivos", en: "Device Health" },
    ],
    serviceLabel(id, lang) { const o = this.services.find((s) => s.v === id); return o ? (lang === "en" ? o.en : o.es) : "—"; },

    // ---- device capability: a device's TYPE fixes what it senses and which
    //      service(s) it can serve. Specialized sensors lock to one program. ----
    capsOf(model) {
      const m = (model || "").toLowerCase();
      const has = (...k) => k.some((x) => m.indexOf(x) >= 0);
      if (has("leak", "fuga", "humedad", "smpleak")) return { fn: { es: "Fuga de agua / humedad", en: "Water leak / humidity" }, services: ["fuga"] };
      if (has("fire", "humo", "térmico", "termico", "smoke", "firesense")) return { fn: { es: "Humo + temperatura", en: "Smoke + temperature" }, services: ["incendio"] };
      if (has("geotrack", "rastrea", "tracker", "gps")) return { fn: { es: "Rastreo GPS de activos", en: "Asset GPS tracking" }, services: ["geocerca"] };
      if (has("rosa", "móvil", "movil", "pánico", "panico", "panic", "smplpck4p")) return { fn: { es: "Botón SOS / pánico", en: "SOS / panic button" }, services: ["panico", "senior"] };
      if (has("cam", "cámara", "camara", "vcam", "video")) return { fn: { es: "Video + detección IA", en: "Video + AI detection" }, services: ["video", "acceso"] };
      if (has("lock", "cerradura", "contacto", "rbs101", "apertura")) return { fn: { es: "Control de acceso / apertura", en: "Access / opening control" }, services: ["acceso"] };
      if (has("smart pack", "simple pack", "smplpck4-ms", "pack")) return { fn: { es: "Temperatura + geolocalización", en: "Temperature + geolocation" }, services: ["senior", "incendio"] };
      if (has("hub", "gateway", "nvhub")) return { fn: { es: "Gateway multiprotocolo (infraestructura)", en: "Multi-protocol gateway (infrastructure)" }, services: ["iot"] };
      return { fn: { es: "Sensor IoT genérico", en: "Generic IoT sensor" }, services: ["iot"] };
    },
  };
})();
