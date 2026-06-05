/* Nevula demo — service catalog (metadata) + fleet-summary widgets (v2)
   The canvas module widgets read the SAME fleet data as the dedicated monitors
   (window.NEV_FLEET.summary) so the Station, the monitors and the wall all agree. */
(function () {
  const I = {
    monitoreo: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="4"/></svg>',
    panico: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="M12 8v4M12 16h.01"/></svg>',
    senior: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><path d="M3 12h3l2-5 4 10 2-5h7"/></svg>',
    ambulancia: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><path d="M3 8h11v9H3z"/><path d="M14 11h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M7 10v4M5 12h4"/></svg>',
    acceso: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><circle cx="8" cy="9" r="3"/><path d="m10.5 11 6 6M14.5 13l2 2M16 18l2-2"/><path d="M4 21h16"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><path d="M3 7h13v10H3z"/><path d="m16 10 5-3v10l-5-3z"/><circle cx="8" cy="12" r="2"/></svg>',
    iot: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><rect x="7" y="7" width="10" height="10" rx="1"/><path d="M10 2v3M14 2v3M10 19v3M14 19v3M2 10h3M2 14h3M19 10h3M19 14h3"/></svg>',
    incendio: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><path d="M12 3c1 3 4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 11 9 9 12 3"/></svg>',
    geocerca: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><circle cx="12" cy="11" r="2.5"/><path d="M12 21c4-4.5 7-8 7-11a7 7 0 0 0-14 0c0 3 3 6.5 7 11"/></svg>',
  };
  const t = (l) => (window.NEV && window.NEV.getLang() === "en") ? l.en : l.es;

  // Render a compact fleet summary card from NEV_FLEET.summary (shared data source).
  function renderFleetWidget(id) {
    const sm = window.NEV_FLEET && window.NEV_FLEET.summary(id);
    if (!sm) return { html: '<div class="upper">—</div>', tick() {} };
    const open = t({ es: "Abrir en Monitoreo en Vivo", en: "Open in Live Monitoring" });
    const stats = '<div class="statline">' + sm.stats.map((s) =>
      '<div class="c"><div class="k">' + s.k + '</div><div class="v"' + (s.c ? ' style="color:' + s.c + '"' : '') + '>' + s.v + '</div></div>').join('') + '</div>';
    const chev = '<svg class="fchev" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg>';
    const list = '<div class="upper" style="margin-top:4px">' + sm.title + '</div><div class="feed">' + sm.rows.map((r) => {
      const lk = r.link || {};
      const det = (r.det || []).map((d) => '<span class="fk">' + d[0] + '</span><span class="fv">' + d[1] + '</span>').join('');
      const btnLabel = lk.label || open;
      return '<div class="feedrow expandable" data-exp>' +
        '<span class="fdot" style="background:' + r.c + '"></span>' +
        '<span class="ftxt"><span class="fp">' + r.p + '</span><br/><span class="fm">' + r.m + '</span></span>' +
        '<span class="ft">' + r.v + '</span>' + chev + '</div>' +
        '<div class="feedrow-exp">' + (det ? '<div class="fx-rows">' + det + '</div>' : '') +
        '<button class="btn btn-cobalt btn-sm fx-open" data-open-mon data-mode="' + (lk.mode || 'alarms') + '" data-target="' + (lk.target || '') + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M2 12h4M18 12h4M12 2v4M12 18v4"/><circle cx="12" cy="12" r="4"/></svg>' + btnLabel + '</button></div>';
    }).join('') + '</div>';
    return {
      html: stats + list,
      tick(body) {
        const f = body.querySelector('.feed .feedrow');
        if (f && Math.random() > 0.5) { f.classList.remove('fresh'); void f.offsetWidth; f.classList.add('fresh'); }
      }
    };
  }

  // delegation: expand a signal row / open it in live monitoring
  document.addEventListener('click', function (e) {
    const open = e.target.closest('[data-open-mon]');
    if (open) {
      e.stopPropagation();
      const focus = { mode: open.dataset.mode || 'alarms', target: open.dataset.target || null };
      if (window.NEV_STORE) window.NEV_STORE.setFocus(focus);
      window.location.href = '../console/index.html';
      return;
    }
    const row = e.target.closest('.feedrow.expandable');
    if (row && row.parentElement && row.parentElement.classList.contains('feed')) {
      const exp = row.nextElementSibling;
      if (exp && exp.classList.contains('feedrow-exp')) {
        const isOpen = exp.classList.contains('open');
        // close siblings in same feed
        row.parentElement.querySelectorAll('.feedrow-exp.open').forEach((x) => { x.classList.remove('open'); if (x.previousElementSibling) x.previousElementSibling.classList.remove('open'); });
        if (!isOpen) { exp.classList.add('open'); row.classList.add('open'); }
      }
    }
  });

  // metadata only — every widget reads its fleet summary
  const SERVICES = [
    { id: "monitoreo", cat: "subscribed", accent: "var(--crit)", soft: "var(--crit-soft)", icon: I.monitoreo, es: "Monitoreo en Vivo", en: "Live Monitoring", sub: { es: "cola de alarmas en vivo", en: "live alarm queue" }, devices: 0, events: 124, sla: "< 90 s", wide: false, widget() { return renderFleetWidget(this.id); } },
    { id: "panico", cat: "subscribed", accent: "var(--orange-500)", soft: "var(--signal-soft)", icon: I.panico, es: "Botón de Pánico", en: "Panic Button", sub: { es: "SOS · despacho táctico", en: "SOS · tactical dispatch" }, devices: 12, events: 38, sla: "< 1 min", wide: false, widget() { return renderFleetWidget(this.id); } },
    { id: "senior", cat: "subscribed", accent: "var(--cobalt-500)", soft: "var(--cobalt-50)", icon: I.senior, es: "Cuidado Activo Senior", en: "Active Senior Care", sub: { es: "monitoreo asistido", en: "assisted monitoring" }, devices: 9, events: 14, sla: "< 2 min", wide: false, widget() { return renderFleetWidget(this.id); } },
    { id: "ambulancia", cat: "subscribed", accent: "var(--crit)", soft: "var(--crit-soft)", icon: I.ambulancia, es: "Coordinación Ambulancia", en: "Ambulance Coordination", sub: { es: "flota de respuesta médica", en: "medical response fleet" }, devices: 0, events: 6, sla: "< 4 min", wide: false, widget() { return renderFleetWidget(this.id); } },
    { id: "acceso", cat: "subscribed", accent: "var(--ice-500)", soft: "var(--info-soft)", icon: I.acceso, es: "Gestión de Acceso", en: "Access Management", sub: { es: "perímetro · puertas", en: "perimeter · doors" }, devices: 7, events: 22, sla: "< 30 s", wide: false, widget() { return renderFleetWidget(this.id); } },
    { id: "iot", cat: "subscribed", accent: "var(--ok)", soft: "var(--ok-soft)", icon: I.iot, es: "Salud de Dispositivos", en: "Device Health", sub: { es: "telemetría flota IoT", en: "IoT fleet telemetry" }, devices: 0, events: 4, sla: "—", wide: false, widget() { return renderFleetWidget(this.id); } },
    { id: "video", cat: "available", accent: "var(--ink-200)", soft: "rgba(10,15,31,0.08)", icon: I.video, es: "Video Verificación Pro", en: "Pro Video Verification", sub: { es: "IA · detección intrusos", en: "AI · intrusion detection" }, devices: 6, events: 19, sla: "< 1 min", wide: false, price: "$1,490/mes", widget() { return renderFleetWidget(this.id); } },
    { id: "incendio", cat: "available", accent: "var(--orange-600)", soft: "var(--signal-soft)", icon: I.incendio, es: "Detección de Incendio", en: "Fire Detection", sub: { es: "humo · temperatura", en: "smoke · temperature" }, devices: 8, events: 2, sla: "< 1 min", wide: false, price: "$890/mes", widget() { return renderFleetWidget(this.id); } },
    { id: "geocerca", cat: "available", accent: "var(--cobalt-600)", soft: "var(--cobalt-50)", icon: I.geocerca, es: "Geocerca de Activos", en: "Asset Geofencing", sub: { es: "rastreo en movimiento", en: "in-motion tracking" }, devices: 5, events: 8, sla: "< 2 min", wide: false, price: "$1,150/mes", widget() { return renderFleetWidget(this.id); } },
  ];

  window.NEV_SERVICES = SERVICES;
  window.NEV_HELP = { t };
})();
