/* Shared navigation only: no accounts, storage, analytics or API requests. */
(function () {
  'use strict';
  var nav = document.getElementById('nav'), links = document.getElementById('primaryLinks'), toggle = document.getElementById('navToggle');
  var year = document.getElementById('year'); if (year) year.textContent = new Date().getFullYear();
  // A link into a collapsed step must reveal it, including after same-page navigation.
  function revealStep() {
    var hash = window.location && window.location.hash;
    if (!hash) return;
    var id; try { id = decodeURIComponent(hash.slice(1)); } catch (error) { return; }
    var target = document.getElementById(id), parent = target;
    if (!target) return;
    while (parent) { if (parent.tagName === 'DETAILS') parent.open = true; parent = parent.parentElement; }
    if (target.scrollIntoView) target.scrollIntoView({block: 'start'});
  }
  revealStep(); window.addEventListener('hashchange', revealStep);
  if(document.querySelectorAll)document.querySelectorAll('[data-copy-public-link]').forEach(function(button){button.addEventListener('click',async function(){var path=button.getAttribute('data-copy-public-link'),status=button.nextElementSibling;if(!/^\/(?:opportunities|builders|people|project)\/[A-Za-z0-9_-]{1,120}$/.test(path||''))return;var url=window.location.origin+path;try{await window.navigator.clipboard.writeText(url);if(status)status.textContent='Link copied. Only the published card is shared.';}catch(error){if(status)status.textContent='Copy this public link: '+url;}});});
  if (!nav || !links || !toggle) return;
  function close() { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
  function scroll() { nav.classList.toggle('scrolled', window.scrollY > 8); }
  scroll(); window.addEventListener('scroll', scroll, { passive: true });
  toggle.addEventListener('click', function () { toggle.setAttribute('aria-expanded', String(links.classList.toggle('open'))); });
  links.querySelectorAll('a').forEach(function (link) { if (link.getAttribute && link.getAttribute('href') === 'workspace.html') link.setAttribute('href','cloud-workspace.html'); link.addEventListener('click', close); });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && links.classList.contains('open')) { close(); toggle.focus(); }
  });
  document.addEventListener('click', function (event) { if (!nav.contains(event.target)) close(); });
})();
