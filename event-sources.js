/* ===== Founders & Builders — Event Source intake ===== */
(function () {
  "use strict";

  var API = (window.FB_CONFIG && window.FB_CONFIG.PROFILES_API || "").trim();
  var DATA = window.FBData || null;
  var hasDataBackend = !!(DATA && DATA.isActive && DATA.isActive());
  var hasBackend = hasDataBackend || /^https?:\/\//.test(API);
  var TYPE = "eventSource";

  var SECURE_METHODS = {
    "Luma": "API key setup request",
    "Eventbrite": "OAuth setup request",
    "Meetup": "OAuth setup request",
    "Partiful": "Public organizer/event URL",
    "Google Calendar": "Public calendar/feed URL",
    "iCal feed": "Public calendar/feed URL",
    "Other website": "Public organizer/event URL",
    "Other": "Manual review only"
  };

  function collect(form) {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      if (el.type === "checkbox") data[el.name] = el.checked ? (el.value || "Yes") : "";
      else data[el.name] = el.value.trim();
    });
    return data;
  }

  function hasSecureSetup(method) {
    return method === "OAuth setup request" || method === "API key setup request";
  }

  function sourceStatus(data) {
    if (hasSecureSetup(data.authMethod)) return "Needs secure setup";
    if (data.authMethod === "Public calendar/feed URL" && data.feedUrl) return "Pending review";
    return "Pending review";
  }

  function secretStatus(data) {
    return hasSecureSetup(data.authMethod) ? "Not collected - admin follow-up required" : "No secret required";
  }

  function postToBackend(type, data) {
    if (hasDataBackend) return DATA.postRecord(type, data);
    data.type = type;
    return fetch(API, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data)
    });
  }

  function init() {
    var form = document.getElementById("eventSourceForm");
    if (!form) return;

    var platformSelect = document.getElementById("platformSelect");
    var authMethodSelect = document.getElementById("authMethodSelect");
    var status = document.getElementById("formStatus");
    var btn = document.getElementById("submitBtn");

    if (platformSelect && authMethodSelect) {
      platformSelect.addEventListener("change", function () {
        var recommended = SECURE_METHODS[platformSelect.value];
        if (recommended && !authMethodSelect.value) authMethodSelect.value = recommended;
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = collect(form);

      if (!data.sourceName || !data.organizerEmail || !data.platform || !data.authMethod) {
        say("Please fill in the organizer name, email, platform, and connection method.", "err");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.organizerEmail)) {
        say("Please enter a valid organizer email.", "err");
        return;
      }
      if (!data.permissionConfirmed || !data.attributionAccepted || !data.reviewAccepted) {
        say("Please confirm permission, attribution, and review terms before submitting.", "err");
        return;
      }
      if (data.authMethod === "Public calendar/feed URL" && !data.feedUrl && !data.sourceUrl) {
        say("Please include a public source URL or feed URL.", "err");
        return;
      }

      data.syncStatus = sourceStatus(data);
      data.secretStatus = secretStatus(data);
      data.approvalStatus = "Pending review";
      data.lastChecked = "";
      data.lastImportCount = "";
      data.nextStep = hasSecureSetup(data.authMethod)
        ? "Admin follow-up for secure OAuth/API setup"
        : "Admin review source and import fit";

      btn.disabled = true;
      btn.textContent = "Submitting...";

      if (!hasBackend) {
        setTimeout(function () {
          say("Demo mode - source request captured locally for review flow testing.", "ok");
          btn.disabled = false;
          btn.textContent = "Submit event source";
        }, 500);
        return;
      }

      postToBackend(TYPE, data).then(function () {
        form.reset();
        say("Event source submitted for review. Redirecting to the calendar...", "ok");
        setTimeout(function () { window.location.href = "calendar.html"; }, 1600);
      }).catch(function () {
        say("Something went wrong submitting this source. Please try again.", "err");
        btn.disabled = false;
        btn.textContent = "Submit event source";
      });
    });

    function say(message, kind) {
      if (!status) return;
      status.textContent = message;
      status.className = "form-status" + (kind ? " form-status--" + kind : "");
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
