/* Nevula demo — shared chrome behaviors: i18n, persona, toast, modal */
(function () {
  const LANG_KEY = "nevula-demo-lang";

  function applyLang(lang) {
    const root = document.documentElement;
    root.setAttribute("data-lang", lang);
    // textContent swap
    document.querySelectorAll("[data-es]").forEach((el) => {
      const v = el.getAttribute("data-" + lang);
      if (v !== null) el.textContent = v;
    });
    // placeholder swap
    document.querySelectorAll("[data-es-ph]").forEach((el) => {
      const v = el.getAttribute("data-" + lang + "-ph");
      if (v !== null) el.setAttribute("placeholder", v);
    });
    // segmented control state
    document.querySelectorAll("[data-lang-btn]").forEach((b) => {
      b.classList.toggle("on", b.getAttribute("data-lang-btn") === lang);
    });
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  }

  window.NEV = window.NEV || {};
  window.NEV.setLang = applyLang;
  window.NEV.getLang = () => document.documentElement.getAttribute("data-lang") || "en";

  // toast
  window.NEV.toast = function (msgEs, msgEn, opts) {
    opts = opts || {};
    let wrap = document.querySelector(".toast-wrap");
    if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; document.body.appendChild(wrap); }
    const t = document.createElement("div");
    t.className = "toast";
    const lang = window.NEV.getLang();
    const icon = opts.icon || '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>';
    t.innerHTML = icon + '<span>' + (lang === "en" ? (msgEn || msgEs) : msgEs) + '</span>' + (opts.mono ? '<span class="mono">' + opts.mono + '</span>' : '');
    wrap.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 350); }, opts.dur || 2800);
  };

  document.addEventListener("DOMContentLoaded", function () {
    let lang = "en";
    try { lang = localStorage.getItem(LANG_KEY) || "en"; } catch (e) {}
    applyLang(lang);
    document.querySelectorAll("[data-lang-btn]").forEach((b) => {
      b.addEventListener("click", () => applyLang(b.getAttribute("data-lang-btn")));
    });
  });
})();
