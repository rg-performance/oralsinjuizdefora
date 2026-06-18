/* Oral Sin Juiz de Fora — interações da LP */
(function () {
  "use strict";

  /* Header sticky shadow */
  var header = document.querySelector(".header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 12);
    };
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

  /* Scroll reveal */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* Count-up stats */
  var stats = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && stats.length) {
    var sObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var target = parseFloat(el.getAttribute("data-count"));
        var suffix = el.getAttribute("data-suffix") || "";
        var decimals = (target % 1 !== 0) ? 1 : 0;
        var start = null, dur = 1600;
        var step = function (ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          var val = (target * eased).toFixed(decimals);
          el.textContent = (decimals ? val.replace(".", ",") : Math.floor(val).toLocaleString("pt-BR")) + suffix;
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
})();
