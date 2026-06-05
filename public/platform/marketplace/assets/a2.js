/* Nevula demo — shared chrome injector (brand cell, top bar, side rail) */
(function () {
  const ICONS = {
    station: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    market: '<path d="M3 9h18l-1.5 10.5a2 2 0 0 1-2 1.5H6.5a2 2 0 0 1-2-1.5z"/><path d="M3 9 5 4h14l2 5"/><path d="M9 13a3 3 0 0 0 6 0"/>',
    monitor: '<path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="4"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 14 3-3 3 3 5-6"/>',
    clients: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1"/><path d="M16 3.1a3 3 0 0 1 0 5.8M21 21v-1a5 5 0 0 0-3-4.6"/>',
    protocol: '<path d="m12 2 2.4 7.4H22l-6 4.5 2.3 7.1-6.3-4.6L5.7 21 8 14 2 9.4h7.6z"/>',
    reports: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M8 4v16"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0 1.6 1.6 0 0 0-2.4-1.4 1.6 1.6 0 0 0-1.8.3 2 2 0 1 1-2.8-2.8A1.6 1.6 0 0 0 .8 14H1a2 2 0 1 1 0-4 1.6 1.6 0 0 0 1.6-2.6"/>',
    onboard: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
  };
  function sIcon(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6">' + ICONS[k] + '</svg>'; }

  const NAV = [
    { key: "station", href: "../station/index.html", es: "Estación", en: "Station", grp: 0 },
    { key: "market", href: "../marketplace/index.html", es: "Marketplace IoT", en: "IoT Marketplace", tag: "NEW", grp: 0 },
    { key: "monitor", href: "../console/index.html", es: "Monitoreo en Vivo", en: "Live Monitoring", grp: 0 },
    { key: "chart", href: "#", es: "Indicadores", en: "Indicators", grp: 0 },
    { key: "clients", href: "#", es: "Clientes", en: "Clients", grp: 0 },
    { key: "protocol", href: "#", es: "Protocolos", en: "Protocols", grp: 1 },
    { key: "onboard", href: "../onboarding/index.html", es: "Onboarding Partner", en: "Partner Onboarding", grp: 1 },
    { key: "reports", href: "#", es: "Reportes", en: "Reports", grp: 1 },
    { key: "settings", href: "#", es: "Configuración", en: "Settings", grp: 1 },
  ];

  function el(html) { const d = document.createElement("template"); d.innerHTML = html.trim(); return d.content.firstChild; }

  window.NEV = window.NEV || {};
  window.NEV.mountChrome = function (cfg) {
    cfg = cfg || {};
    const app = document.querySelector(".app");
    const main = app.querySelector(".main");

    // brand cell
    const brand = el('<div class="brandcell"><span class="wordmark"><span>ne</span><span class="v-slot"><img src="assets/nevula-iso.svg" alt=""></span><span>ula</span></span><span class="sub">central<br>stations</span></div>');

    // top bar
    const top = el('<header class="topbar"></header>');
    top.innerHTML =
      '<div class="crumbs"><b>Central Horizonte 24/7</b><span class="sep">/</span><span data-es="' + (cfg.crumbEs || "") + '" data-en="' + (cfg.crumbEn || "") + '">' + (cfg.crumbEs || "") + '</span></div>' +
      '<div class="actions">' +
        '<div class="segmented"><button data-lang-btn="es">ES</button><button data-lang-btn="en">EN</button></div>' +
        '<button class="iconbtn" title="Notificaciones"><span class="dot"></span><svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg></button>' +
        '<button class="iconbtn" title="Geovisor"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><path d="M9 11a3 3 0 1 0 6 0 3 3 0 0 0-6 0"/><path d="M12 2a8 8 0 0 0-8 8c0 5.4 8 12 8 12s8-6.6 8-12a8 8 0 0 0-8-8"/></svg></button>' +
        '<div class="persona" id="personaBtn"><span class="avatar">' + (cfg.avatar || "LH") + '</span><span class="who"><span class="nme">' + (cfg.user || "Laura Hernández") + '</span><span class="rol" data-es="' + (cfg.roleEs || "Admin · Partner") + '" data-en="' + (cfg.roleEn || "Admin · Partner") + '">' + (cfg.roleEs || "Admin · Partner") + '</span></span><svg class="chev" viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="m6 9 6 6 6-6"/></svg></div>' +
      '</div>';

    // rail
    const rail = el('<nav class="rail"></nav>');
    let html = "";
    let lastGrp = -1;
    NAV.forEach((n) => {
      if (n.grp !== lastGrp && n.grp === 1) html += '<div class="group-label" data-es="Operación" data-en="Operations">Operación</div>';
      lastGrp = n.grp;
      const active = n.key === cfg.active ? " active" : "";
      const tag = n.tag ? '<span class="tag">' + n.tag + '</span>' : "";
      html += '<a class="navitem' + active + '" href="' + n.href + '">' + sIcon(n.key) + '<span data-es="' + n.es + '" data-en="' + n.en + '">' + n.es + '</span>' + tag + '</a>';
    });
    html += '<div class="spacer"></div>';
    if (cfg.railFootEs) html += '<div class="palette-foot" style="margin-top:auto"><b>' + (cfg.railFootTitle || "") + '</b><br><span data-es="' + cfg.railFootEs + '" data-en="' + (cfg.railFootEn || cfg.railFootEs) + '">' + cfg.railFootEs + '</span></div>';
    rail.innerHTML = html;

    app.insertBefore(brand, main);
    app.insertBefore(top, main);
    app.insertBefore(rail, main);

    // wire language
    const cur = (window.NEV.getLang && window.NEV.getLang()) || "es";
    document.querySelectorAll("[data-lang-btn]").forEach((b) => {
      b.addEventListener("click", () => {
        window.NEV.setLang(b.getAttribute("data-lang-btn"));
        document.dispatchEvent(new CustomEvent("nev:lang", { detail: b.getAttribute("data-lang-btn") }));
      });
    });
    if (window.NEV.setLang) window.NEV.setLang(cur);
  };
})();
