/* Oral Sin Juiz de Fora — interações da LP (v4) */
(function () {
  "use strict";

  /* Header sticky shadow */
  var header = document.querySelector(".header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-stuck", window.scrollY > 12); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* Mobile nav */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.classList.remove("is-open");
      });
    });
  }

  /* Reveal on scroll (suave) */
  var reveals = document.querySelectorAll(".reveal, .stat");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* Count-up dos números (sobem quando a seção aparece) */
  var stats = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && stats.length) {
    var sObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var target = parseFloat(el.getAttribute("data-count"));
        var suffix = el.getAttribute("data-suffix") || "";
        var decimals = (target % 1 !== 0) ? 1 : 0;
        var start = null, dur = 1700;
        var step = function (ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          var val = (target * eased).toFixed(decimals);
          var shown = decimals ? val.replace(".", ",") : Math.floor(val).toLocaleString("pt-BR");
          el.innerHTML = shown + (suffix ? '<span class="u">' + suffix + "</span>" : "");
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        sObs.unobserve(el);
      });
    }, { threshold: 0.5 });
    stats.forEach(function (el) { sObs.observe(el); });
  }

  /* FAQ accordion */
  document.querySelectorAll(".faq__q").forEach(function (q) {
    q.addEventListener("click", function () {
      var item = q.closest(".faq__item");
      var ans = item.querySelector(".faq__a");
      var open = item.classList.toggle("is-open");
      q.setAttribute("aria-expanded", open ? "true" : "false");
      ans.style.maxHeight = open ? ans.scrollHeight + "px" : null;
    });
  });

  /* Carrossel de depoimentos (setas prev/next) */
  var track = document.querySelector(".tst-track");
  if (track) {
    var prev = document.querySelector(".tst-nav .prev");
    var next = document.querySelector(".tst-nav .next");
    var amount = function () {
      var card = track.querySelector(".tst");
      return card ? card.getBoundingClientRect().width + 22 : track.clientWidth * 0.8;
    };
    if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -amount(), behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () { track.scrollBy({ left: amount(), behavior: "smooth" }); });
  }

  /* Form -> WhatsApp */
  var form = document.querySelector("#lead-form");
  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var nome = (form.nome.value || "").trim();
      var tel = (form.telefone.value || "").trim();
      var trat = form.tratamento.value || "";
      var msg =
        "Olá! Gostaria de agendar uma *avaliação gratuita* na Oral Sin Juiz de Fora.%0A%0A" +
        "*Nome:* " + encodeURIComponent(nome) + "%0A" +
        "*Telefone:* " + encodeURIComponent(tel) + "%0A" +
        "*Tratamento de interesse:* " + encodeURIComponent(trat);
      var phone = form.getAttribute("data-wpp") || "5532999931447";
      window.open("https://wa.me/" + phone + "?text=" + msg, "_blank");
    });
  }

  /* Footer year */
  var y = document.querySelector("#year");
  if (y) y.textContent = new Date().getFullYear();

  /* Cursor personalizado (bolinha + anel) — só em ponteiro fino */
  if (window.matchMedia && matchMedia("(pointer: fine)").matches) {
    var dot = document.createElement("div"); dot.className = "cursor-dot";
    var ring = document.createElement("div"); ring.className = "cursor-ring";
    document.body.appendChild(dot); document.body.appendChild(ring);
    document.body.classList.add("cursor-ready");

    var mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;
    document.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + "px"; dot.style.top = my + "px";
    });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.left = rx + "px"; ring.style.top = ry + "px";
      requestAnimationFrame(loop);
    })();

    var hoverSel = "a, button, input, select, textarea, [role=\"button\"], .faq__q, .carousel__item, .tst, .pain__box, .treat";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest && e.target.closest(hoverSel)) ring.classList.add("is-hover");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest && e.target.closest(hoverSel)) {
        var to = e.relatedTarget;
        if (!to || !(to.closest && to.closest(hoverSel))) ring.classList.remove("is-hover");
      }
    });
    document.addEventListener("mousedown", function () { ring.classList.add("is-down"); });
    document.addEventListener("mouseup", function () { ring.classList.remove("is-down"); });
    document.addEventListener("mouseleave", function () { dot.style.opacity = 0; ring.style.opacity = 0; });
    document.addEventListener("mouseenter", function () { dot.style.opacity = 1; ring.style.opacity = 1; });
  }
})();
