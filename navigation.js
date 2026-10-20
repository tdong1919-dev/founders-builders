/* Shared navigation only: no accounts, storage, analytics or API requests. */
(function () {
  'use strict';
  var nav = document.getElementById('nav'), links = document.getElementById('primaryLinks'), toggle = document.getElementById('navToggle');
  var year = document.getElementById('year'); if (year) year.textContent = new Date().getFullYear();
  if (!nav || !links || !toggle) return;
  function close() { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
  function scroll() { nav.classList.toggle('scrolled', window.scrollY > 8); }
  scroll(); window.addEventListener('scroll', scroll, { passive: true });
  toggle.addEventListener('click', function () { toggle.setAttribute('aria-expanded', String(links.classList.toggle('open'))); });
  links.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', close); });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && links.classList.contains('open')) { close(); toggle.focus(); }
  });
  document.addEventListener('click', function (event) { if (!nav.contains(event.target)) close(); });
})();
