/* ===== Founders & Builders — interactions ===== */
(function () {
  "use strict";

  // Current year in footer
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Nav shadow on scroll
  var nav = document.getElementById("nav");
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile nav toggle
  var toggle = document.getElementById("navToggle");
  var links = document.querySelector(".nav__links");
  if (links && !links.querySelector('a[href="dashboard.html"]')) {
    [
      ["dashboard.html", "Dashboard"],
      ["search.html", "Search"]
    ].reverse().forEach(function (item) {
      var a = document.createElement("a");
      a.href = item[0];
      a.textContent = item[1];
      links.insertBefore(a, links.firstChild);
    });
  }
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Lightweight persistent identity for the static site. This is not password
  // authentication; it lets members keep a device-level identity and attach
  // ownership metadata to public submissions until a full auth provider exists.
  function readIdentity() {
    try {
      var identity = JSON.parse(localStorage.getItem("fb_member_identity") || "null");
      return identity && identity.email ? identity : null;
    } catch (err) {
      return null;
    }
  }

  function ensureHidden(form, name, value) {
    var input = form.querySelector('input[name="' + name + '"]');
    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      form.appendChild(input);
    }
    input.value = value || "";
  }

  function syncIdentityToForms() {
    var identity = readIdentity();
    if (!identity) return;
    Array.prototype.forEach.call(document.querySelectorAll("form"), function (form) {
      if (form.id === "signupForm" || form.id === "identityForm") return;
      var email = form.querySelector('[name="email"]');
      var name = form.querySelector('[name="name"]');
      var founder = form.querySelector('[name="founder"]');
      var chapter = form.querySelector('[name="chapter"]');
      if (email && !email.value) email.value = identity.email || "";
      if (name && !name.value) name.value = identity.name || "";
      if (founder && !founder.value) founder.value = identity.name || "";
      if (chapter && !chapter.value) chapter.value = identity.chapter || "";
    });
  }

  document.addEventListener("submit", function (e) {
    var form = e.target;
    if (!form || form.id === "signupForm" || form.id === "identityForm") return;
    var identity = readIdentity();
    if (!identity) return;
    ensureHidden(form, "ownerKey", identity.ownerKey);
    ensureHidden(form, "accountEmail", identity.email);
    ensureHidden(form, "accountName", identity.name);
    if (identity.chapter && !form.querySelector('[name="chapter"]')) {
      ensureHidden(form, "chapter", identity.chapter);
    }
  }, true);

  syncIdentityToForms();

  // Feature slider
  var featureTrack = document.getElementById("featureTrack");
  var featurePrev = document.getElementById("featurePrev");
  var featureNext = document.getElementById("featureNext");
  if (featureTrack && featurePrev && featureNext) {
    var scrollFeatures = function (dir) {
      var slide = featureTrack.querySelector(".feature-slide");
      var amount = slide ? slide.getBoundingClientRect().width + 20 : 300;
      featureTrack.scrollBy({ left: dir * amount, behavior: "smooth" });
    };
    featurePrev.addEventListener("click", function () { scrollFeatures(-1); });
    featureNext.addEventListener("click", function () { scrollFeatures(1); });
    var updateFeatureNav = function () {
      featurePrev.disabled = featureTrack.scrollLeft <= 4;
      featureNext.disabled = featureTrack.scrollLeft >= featureTrack.scrollWidth - featureTrack.clientWidth - 4;
    };
    featureTrack.addEventListener("scroll", updateFeatureNav, { passive: true });
    window.addEventListener("resize", updateFeatureNav, { passive: true });
    updateFeatureNav();
  }

  // Scroll reveal
  var revealTargets = document.querySelectorAll(
    ".card, .section__head, .feature-split__text, .feature-split__card, .city, .pill-cloud, .signup, .mission .lead, .preview-card, .mentor-panel, .activity-list, .accelerator__panel, .membership__panel"
  );
  revealTargets.forEach(function (el) { el.classList.add("reveal"); });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach(function (el) { io.observe(el); });
    // Safety net: never leave content permanently invisible if the observer
    // misses an element (e.g. an instant scroll-to-anchor on load).
    setTimeout(function () {
      revealTargets.forEach(function (el) { el.classList.add("in"); });
    }, 2000);
  } else {
    revealTargets.forEach(function (el) { el.classList.add("in"); });
  }

  // Staggered reveal for hub cards (profiles, business, jobs, mentors, etc.)
  // Cards are injected by each hub's own script, so watch the grid instead of
  // touching every hub file individually.
  var profileGrid = document.getElementById("profileGrid");
  if (profileGrid) {
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var staggerNew = function () {
      var cards = profileGrid.querySelectorAll(".pcard:not(.stagger-init)");
      cards.forEach(function (card, i) {
        card.classList.add("stagger-init");
        card.style.transitionDelay = reduceMotion ? "0ms" : (i % 12) * 40 + "ms";
      });
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          cards.forEach(function (card) { card.classList.add("in"); });
        });
      });
    };
    staggerNew();
    new MutationObserver(staggerNew).observe(profileGrid, { childList: true });
  }

})();
