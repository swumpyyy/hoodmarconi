/* Hood Marconi, avviso cookie / termini.
   Il sito non installa cookie e non usa strumenti di tracciamento: l'avviso è solo informativo.
   Si ricorda soltanto che l'avviso è stato letto, in localStorage (memoria tecnica, nessun dato personale, non inviata a nessuno).
   Se cambiano i testi legali o se in futuro si aggiungono strumenti non tecnici (analytics, pixel, mappe incorporate, video),
   aggiornare VERSION e trasformare l'avviso in un vero consenso con "Accetta" e "Rifiuta" ugualmente evidenti. */
(function () {
  "use strict";

  var KEY = "hm-notice";
  var VERSION = "2026-10-03";

  function read() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function write() {
    try { window.localStorage.setItem(KEY, VERSION); } catch (e) { /* storage bloccato: l'avviso riappare, nessun problema */ }
  }

  var box = null;
  var opener = null;

  function close() {
    if (!box) return;
    write();
    var el = box;
    box = null;
    el.classList.remove("is-visible");
    window.setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 400);
    if (opener && document.contains(opener)) opener.focus();
    opener = null;
  }

  function open(from) {
    if (box) return;
    opener = from || null;
    box = document.createElement("section");
    box.className = "consent";
    box.setAttribute("role", "region");
    box.setAttribute("aria-labelledby", "consent-title");
    box.innerHTML =
      '<div class="consent__text">' +
        '<h2 id="consent-title">Cookie e privacy</h2>' +
        '<p>Questo sito non usa cookie di profilazione né strumenti di tracciamento. ' +
        'Non raccoglie dati personali e non ti chiede di registrarti. ' +
        'Usandolo accetti i <a href="termini.html">Termini e condizioni</a>. ' +
        'Maggiori dettagli in <a href="cookie.html">Cookie</a> e <a href="privacy.html">Privacy</a>.</p>' +
      '</div>' +
      '<button type="button" class="btn btn--beer consent__ok">Ho capito</button>';
    document.body.appendChild(box);
    box.querySelector(".consent__ok").addEventListener("click", close);
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { if (box) box.classList.add("is-visible"); });
    });
    if (opener) box.querySelector(".consent__ok").focus();
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-consent-open]") : null;
    if (!t) return;
    e.preventDefault();
    open(t);
  });

  if (read() !== VERSION) open(null);
})();
