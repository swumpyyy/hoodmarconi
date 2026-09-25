/* Hood Marconi, shared behaviour for index.html and menu.html */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Opening hours (Google Maps, Sep 2026) in minutes from midnight, Rome time.
     Index = JS weekday, 0 = Sunday. A close past midnight is stored as > 1440. */
  var HOURS = {
    0: [17 * 60, 24 * 60],
    1: [17 * 60, 24 * 60],
    2: [17 * 60, 24 * 60],
    3: [17 * 60, 24 * 60],
    4: [17 * 60, 24 * 60],
    5: [18 * 60, 26 * 60],
    6: [18 * 60, 26 * 60]
  };
  var DAYS = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];

  function romeNow() {
    var parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Rome", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date());
    var map = {};
    parts.forEach(function (p) { map[p.type] = p.value; });
    var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(map.weekday);
    return { day: day, min: parseInt(map.hour, 10) * 60 + parseInt(map.minute, 10) };
  }

  function clock(min) {
    var m = min % 1440;
    var h = Math.floor(m / 60), mm = m % 60;
    return (h < 10 ? "0" : "") + h + ":" + (mm < 10 ? "0" : "") + mm;
  }

  function computeStatus() {
    var now = romeNow();
    var today = HOURS[now.day];
    var prev = HOURS[(now.day + 6) % 7];

    if (prev[1] > 1440 && now.min < prev[1] - 1440) {
      return { open: true, label: "Aperto ora", detail: "chiude alle " + clock(prev[1]) };
    }
    if (now.min >= today[0] && now.min < Math.min(today[1], 1440)) {
      return { open: true, label: "Aperto ora", detail: "chiude alle " + clock(today[1]) };
    }
    if (now.min < today[0]) {
      return { open: false, label: "Chiuso", detail: "apre oggi alle " + clock(today[0]) };
    }
    var next = HOURS[(now.day + 1) % 7];
    return { open: false, label: "Chiuso", detail: "apre domani alle " + clock(next[0]) };
  }

  var lastState = null;
  function renderStatus() {
    var s = computeStatus();
    var state = s.open ? "open" : "closed";
    document.querySelectorAll("[data-status]").forEach(function (el) {
      el.setAttribute("data-state", state);
      var label = el.querySelector("[data-status-label]");
      var detail = el.querySelector("[data-status-detail]");
      if (label) label.innerHTML = "<span>" + s.label + "</span>";
      if (detail) detail.textContent = s.detail;
      if (lastState !== null && lastState !== state && !reduceMotion) {
        el.classList.remove("is-snapping");
        void el.offsetWidth;
        el.classList.add("is-snapping");
      }
    });
    lastState = state;

    var now = romeNow();
    document.querySelectorAll("[data-today-hours]").forEach(function (el) {
      var h = HOURS[now.day];
      el.textContent = clock(h[0]) + "-" + clock(h[1]);
    });
    document.querySelectorAll("[data-today-name]").forEach(function (el) {
      el.textContent = "Oggi, " + DAYS[now.day];
    });
    document.querySelectorAll(".hours tr[data-days]").forEach(function (tr) {
      var days = tr.getAttribute("data-days").split(",").map(Number);
      tr.classList.toggle("is-today", days.indexOf(now.day) !== -1);
    });
  }

  /* Re-check once a minute; pause while the tab is hidden. */
  var timer = null;
  function startClock() { if (!timer) timer = setInterval(renderStatus, 60000); }
  function stopClock() { clearInterval(timer); timer = null; }
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") stopClock();
    else { renderStatus(); startClock(); }
  });

  /* Hero and menu title entrance: letters rise one by one (CSS). */
  function splitWord() {
    document.querySelectorAll(".hero__word, [data-letters]").forEach(function (word) {
      var text = word.textContent.trim();
      word.textContent = "";
      text.split("").forEach(function (ch, i) {
        var s = document.createElement("span");
        s.textContent = ch;
        s.style.setProperty("--i", i);
        word.appendChild(s);
      });
    });
  }

  /* Scroll reveal, once per element.
     Titles slide up inside a mask; the observed element itself is never clipped,
     because Chrome reports a fully clipped target as not intersecting. */
  function setupReveal() {
    /* Menu page: headings and dishes reveal too, tagged here so nothing hides without JS. */
    document.querySelectorAll(".menu-sec h2").forEach(function (h) { h.setAttribute("data-reveal", "title"); });
    document.querySelectorAll(".items").forEach(function (list) {
      Array.prototype.forEach.call(list.children, function (li, i) {
        li.setAttribute("data-reveal", "item");
        li.style.setProperty("--i", Math.min(i, 6));
      });
    });
    document.querySelectorAll(".menu-sec__note, .menu-group h3, .allergens, .menu-cta").forEach(function (el) {
      el.setAttribute("data-reveal", "");
    });

    document.querySelectorAll('[data-reveal="title"]').forEach(function (t) {
      var mask = document.createElement("span");
      var inner = document.createElement("span");
      mask.className = "rv-mask";
      inner.className = "rv";
      while (t.firstChild) inner.appendChild(t.firstChild);
      mask.appendChild(inner);
      t.appendChild(mask);
    });

    var els = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window) || reduceMotion) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* Reading progress in the nav when GSAP is not driving it (menu page). */
  function setupProgress() {
    var bar = document.querySelector(".nav__progress");
    if (!bar || root.classList.contains("gsap-on")) return;
    var ticking = false;
    function update() {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ")";
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* Menu tabs: scroll spy plus a sliding bar (transform only). */
  function setupTabs() {
    var list = document.querySelector(".tabs__list");
    if (!list) return;
    var bar = list.querySelector(".tabs__bar");
    var links = Array.prototype.slice.call(list.querySelectorAll("a"));
    var sections = links.map(function (a) { return document.querySelector(a.getAttribute("href")); });

    function activate(i) {
      links.forEach(function (a, j) { a.setAttribute("aria-current", j === i ? "true" : "false"); });
      var a = links[i];
      if (!a || !bar) return;
      var cs = getComputedStyle(a);
      var padL = parseFloat(cs.paddingLeft), padR = parseFloat(cs.paddingRight);
      var left = a.offsetLeft + padL;
      var width = a.offsetWidth - padL - padR;
      bar.style.transform = "translateX(" + left + "px) scaleX(" + width / 100 + ")";
      if (a.offsetLeft < list.scrollLeft || a.offsetLeft + a.offsetWidth > list.scrollLeft + list.clientWidth) {
        list.scrollTo({ left: a.offsetLeft - 16, behavior: reduceMotion ? "auto" : "smooth" });
      }
    }

    var visible = sections.map(function () { return false; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var i = sections.indexOf(e.target);
        if (i !== -1) visible[i] = e.isIntersecting;
      });
      var first = visible.indexOf(true);
      if (first !== -1) activate(first);
    }, { rootMargin: "-140px 0px -55% 0px", threshold: 0 });
    sections.forEach(function (s) { if (s) io.observe(s); });
    activate(0);

    function onResize() {
      var cur = links.findIndex(function (a) { return a.getAttribute("aria-current") === "true"; });
      activate(cur < 0 ? 0 : cur);
    }
    window.addEventListener("resize", onResize);
  }

  /* Rating counts up once when it enters the viewport (motion-advanced counter). */
  function setupCounters() {
    var els = document.querySelectorAll("[data-count]");
    if (!els.length || reduceMotion || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target, to = parseFloat(el.getAttribute("data-count")), t0 = null, dur = 1000;
        function step(ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min(1, (ts - t0) / dur);
          var eased = 1 - Math.pow(1 - p, 4);
          el.textContent = (to * eased).toFixed(1).replace(".", ",");
          if (p < 1) requestAnimationFrame(step);
        }
        el.textContent = "0,0";
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* Show an element once a sentinel has scrolled out of view (quick bar, back-to-top, nav shadow). */
  function showAfter(sentinel, el, cls) {
    if (!sentinel || !el || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (entries) {
      el.classList.toggle(cls, !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0);
    }).observe(sentinel);
  }

  /* Share the menu (native sheet on phones, copy link elsewhere). */
  function setupShare() {
    var btn = document.querySelector("[data-share]");
    if (!btn) return;
    var label = btn.querySelector("[data-share-label]");
    btn.hidden = false;
    btn.addEventListener("click", function () {
      var data = { title: "Menu | Hood Marconi", text: "Il menu di Hood Marconi", url: window.location.href.split("#")[0] };
      if (navigator.share) { navigator.share(data).catch(function () {}); return; }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(data.url).then(function () {
          label.textContent = "Link copiato";
          setTimeout(function () { label.textContent = "Condividi il menu"; }, 2000);
        });
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    splitWord();
    renderStatus();
    startClock();
    setupReveal();
    setupProgress();
    setupTabs();
    setupCounters();
    setupShare();
    showAfter(document.querySelector(".hero"), document.querySelector("[data-quickbar]"), "is-visible");
    showAfter(document.querySelector(".menu-head"), document.querySelector("[data-totop]"), "is-visible");
    showAfter(document.querySelector(".hero, .menu-head"), document.querySelector(".nav"), "is-scrolled");
    /* Start the entrance on the next frame; the timer covers background tabs where frames are paused. */
    function ready() { root.classList.add("is-ready"); }
    requestAnimationFrame(function () { requestAnimationFrame(ready); });
    setTimeout(ready, 120);
  });
})();
