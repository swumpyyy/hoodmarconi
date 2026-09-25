/* Hood Marconi, scroll-driven motion for index.html (GSAP + ScrollTrigger, Lenis on mouse/trackpad).
   If the CDN scripts fail or the visitor prefers reduced motion, the CSS reveals in site.css still run. */
(function () {
  "use strict";

  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);
  ST.config({ ignoreMobileResize: true });
  document.documentElement.classList.add("gsap-on");

  /* Smooth wheel scrolling on desktop; touch stays native. */
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fine && window.Lenis) {
    var lenis = new window.Lenis({ duration: 1.1, anchors: { offset: -88 } });
    lenis.on("scroll", ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* Reading progress in the nav. */
  gsap.to(".nav__progress", {
    scaleX: 1, ease: "none",
    scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 }
  });

  /* Hero: the photo pushes in, the title lifts away and the room goes dark as you leave it. */
  var hero = document.querySelector(".hero");
  if (hero) {
    gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
    })
      .to(".hero__photo", { scale: 1.18, yPercent: 12 }, 0)
      .to(".hero__content", { yPercent: -35, scale: 0.9, autoAlpha: 0 }, 0)
      .to(".hero__shade", { opacity: 0.75 }, 0);
  }

  /* Manifesto: split into words, each lights up in sequence with the scroll. */
  var mText = document.querySelector("[data-words]");
  if (mText) {
    var nodes = Array.prototype.slice.call(mText.childNodes);
    mText.textContent = "";
    nodes.forEach(function (n) {
      if (n.nodeType !== 3) { mText.appendChild(n); return; }
      n.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { mText.appendChild(document.createTextNode(part)); return; }
        var w = document.createElement("span");
        w.className = "w";
        w.textContent = part;
        mText.appendChild(w);
      });
    });
    var pieces = mText.querySelectorAll(".w, .pill");
    gsap.set(pieces, { opacity: 0.12 });
    gsap.set(mText.querySelectorAll(".pill"), { scale: 0.4 });

    gsap.matchMedia().add({ desk: "(min-width: 768px)", mob: "(max-width: 767px)" }, function (ctx) {
      var desk = ctx.conditions.desk;
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".manifesto",
          start: desk ? "top top" : "top 75%",
          end: desk ? "+=120%" : "bottom 45%",
          scrub: 0.5,
          pin: desk
        }
      });
      pieces.forEach(function (el, i) {
        var isPill = el.classList.contains("pill");
        tl.to(el, isPill ? { opacity: 1, scale: 1, ease: "back.out(2)", duration: 1.4 } : { opacity: 1, duration: 1 }, i * 0.5);
      });
    });
  }

  /* Cucina: the lead photo opens from a smaller frame, the side photos drift at different speeds. */
  var lead = document.querySelector(".cucina__lead .photo");
  if (lead) {
    gsap.fromTo(lead,
      { clipPath: "inset(10% 8% 10% 8% round 18px)" },
      { clipPath: "inset(0% 0% 0% 0% round 2px)", ease: "none",
        scrollTrigger: { trigger: lead, start: "top 90%", end: "center 55%", scrub: true } });
  }
  gsap.utils.toArray(".cucina__side .photo").forEach(function (el, i) {
    gsap.fromTo(el, { y: 50 + i * 40 }, {
      y: -30 - i * 20, ease: "none",
      scrollTrigger: { trigger: ".cucina__grid", start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  /* Photos darken and fade a little as they scroll out at the top. */
  gsap.utils.toArray(".cucina__grid .photo, .info__store .photo").forEach(function (el) {
    gsap.to(el, {
      opacity: 0.35, ease: "none",
      scrollTrigger: { trigger: el, start: "bottom 35%", end: "bottom top", scrub: true }
    });
  });

  /* Aperitivo prices rise into place while the board crosses the screen. */
  gsap.utils.toArray(".board__price").forEach(function (el) {
    gsap.fromTo(el, { yPercent: 40 }, {
      yPercent: -10, ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "top 40%", scrub: true }
    });
  });

  /* Marquee: continuous loop; scroll speed boosts it and scroll direction flips it. */
  var loops = gsap.utils.toArray(".marquee__track").map(function (track, i) {
    var rev = i % 2 === 1;
    return gsap.fromTo(track, { xPercent: rev ? -50 : 0 }, { xPercent: rev ? 0 : -50, duration: 32, ease: "none", repeat: -1, paused: true });
  });
  if (loops.length) {
    ST.create({
      trigger: ".marquee", start: "top bottom", end: "bottom top",
      onToggle: function (self) { loops.forEach(function (t) { if (self.isActive) t.play(); else t.pause(); }); },
      onUpdate: function (self) {
        var dir = self.direction;
        var boost = Math.min(6, 1 + Math.abs(self.getVelocity()) / 350);
        loops.forEach(function (t) {
          gsap.timeline({ overwrite: true })
            .to(t, { timeScale: dir * boost, duration: 0.2 })
            .to(t, { timeScale: dir, duration: 1.2, ease: "power2.out" });
        });
      }
    });
  }

  /* Il posto: the mural frame widens to full bleed, then the text panel slides over it. */
  var frame = document.querySelector(".posto__frame");
  if (frame) {
    gsap.fromTo(frame,
      { clipPath: "inset(0% 7% 0% 7% round 24px)" },
      { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none",
        scrollTrigger: { trigger: frame, start: "top 85%", end: "top 15%", scrub: true } });
    gsap.fromTo(".posto__img", { yPercent: -6 }, {
      yPercent: 6, ease: "none",
      scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true }
    });
    gsap.fromTo(".posto__text", { y: 80 }, {
      y: 0, ease: "none",
      scrollTrigger: { trigger: ".posto__panel", start: "top bottom", end: "top 55%", scrub: true }
    });
  }

  /* Footer logo settles in as the page ends. */
  gsap.fromTo(".foot img", { rotate: -8, scale: 0.85 }, {
    rotate: 0, scale: 1, ease: "none",
    scrollTrigger: { trigger: ".foot", start: "top bottom", end: "bottom bottom", scrub: true }
  });

  window.addEventListener("load", function () { ST.refresh(); });
})();
