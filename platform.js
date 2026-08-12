/* ===== Founders & Builders — connected platform layer ===== */
(function () {
  "use strict";

  var API = (window.FB_CONFIG && window.FB_CONFIG.PROFILES_API || "").trim();
  var DATA = window.FBData || null;
  var hasDataBackend = !!(DATA && DATA.isActive && DATA.isActive());
  var hasBackend = hasDataBackend || /^https?:\/\//.test(API);
  var IDENTITY_KEY = "fb_member_identity";
  var SAVED_KEY = "fb_saved_items_v1";
  var ADMIN_TOKEN_KEY = "fb_admin_token_v1";

  var CHAPTERS = [
    {
      id: "dc",
      label: "Washington, DC",
      short: "DC",
      status: "Launch chapter",
      aliases: ["washington", "dc", "d.c.", "dmv", "northern virginia", "nova", "maryland"],
      focus: "Policy, govtech, services, capital, and founder operators."
    },
    {
      id: "atlanta",
      label: "Atlanta, GA",
      short: "Atlanta",
      status: "Launch chapter",
      aliases: ["atlanta", "atl", "georgia"],
      focus: "Media, fintech, logistics, healthcare, and startup services."
    },
    {
      id: "boise",
      label: "Boise, ID",
      short: "Boise",
      status: "Launch chapter",
      aliases: ["boise", "idaho"],
      focus: "Product builders, local businesses, remote teams, and operators."
    },
    {
      id: "madison",
      label: "Madison",
      short: "Madison",
      status: "Launch chapter",
      aliases: ["madison"],
      focus: "Early builders, students, local companies, and practical community support."
    }
  ];

  var TYPE_META = {
    profile: {
      label: "Member",
      plural: "Members",
      page: "profiles.html",
      title: ["name"],
      subtitle: ["business", "stage", "location"],
      body: ["building", "bio", "goals", "lookingFor", "needs", "canHelp", "offers"],
      tags: ["skills", "needs", "offers", "products"],
      location: ["location"],
      email: "email",
      action: "Connect"
    },
    business: {
      label: "Business",
      plural: "Businesses",
      page: "business.html",
      title: ["name"],
      subtitle: ["category", "industry", "team"],
      body: ["description", "products", "services", "hiring"],
      tags: ["products", "services", "industry", "category"],
      location: ["location", "city", "team"],
      email: "email",
      action: "Contact"
    },
    listing: {
      label: "Marketplace",
      plural: "Marketplace",
      page: "marketplace.html",
      title: ["name"],
      subtitle: ["category", "pricing"],
      body: ["description"],
      tags: ["category"],
      location: ["city", "location"],
      email: "email",
      action: "View"
    },
    job: {
      label: "Opportunity",
      plural: "Jobs",
      page: "jobs.html",
      title: ["title"],
      subtitle: ["company", "category", "location", "compensation"],
      body: ["description"],
      tags: ["category", "company"],
      location: ["location"],
      email: "email",
      action: "Apply"
    },
    mentor: {
      label: "Mentor",
      plural: "Mentors",
      page: "mentors.html",
      title: ["name"],
      subtitle: ["title", "company", "industry"],
      body: ["bio", "expertise", "stages", "availability", "officeHours"],
      tags: ["expertise", "stages", "industry"],
      location: ["location", "city"],
      email: "email",
      action: "Request intro"
    },
    help: {
      label: "Help request",
      plural: "Help board",
      page: "help.html",
      title: ["title"],
      subtitle: ["name", "category", "urgency"],
      body: ["description"],
      tags: ["category", "urgency"],
      location: ["location", "city"],
      email: "email",
      action: "Help"
    },
    raise: {
      label: "Raising",
      plural: "Raises",
      page: "funding.html",
      title: ["company"],
      subtitle: ["founder", "stage", "industry", "amountSeeking"],
      body: ["description", "useOfFunds", "raisedSoFar"],
      tags: ["stage", "industry"],
      location: ["location", "city"],
      email: "email",
      action: "Discuss"
    },
    investor: {
      label: "Investor",
      plural: "Investors",
      page: "funding.html",
      title: ["name"],
      subtitle: ["firm", "type", "checkSize"],
      body: ["thesis", "stages", "industries"],
      tags: ["type", "stages", "industries"],
      location: ["location", "city"],
      email: "email",
      action: "Request intro"
    },
    event: {
      label: "Event",
      plural: "Events",
      page: "calendar.html",
      title: ["title"],
      subtitle: ["host", "category", "city", "date", "time"],
      body: ["description", "location"],
      tags: ["category", "city"],
      location: ["city", "location"],
      email: "email",
      action: "RSVP"
    },
    eventSource: {
      label: "Event source",
      plural: "Event sources",
      page: "add-event-source.html",
      title: ["sourceName"],
      subtitle: ["platform", "authMethod", "syncStatus"],
      body: ["fitNotes", "nextStep", "sourceUrl", "feedUrl"],
      tags: ["platform", "authMethod", "syncStatus", "chapter"],
      location: ["chapter"],
      email: "organizerEmail",
      public: false
    },
    collab: {
      label: "Collaboration",
      plural: "Collaborations",
      page: "collaborate.html",
      title: ["title"],
      subtitle: ["name", "category", "city"],
      body: ["description"],
      tags: ["category", "format", "city"],
      location: ["city", "location"],
      email: "email",
      action: "Collaborate"
    },
    podcast: {
      label: "Podcast",
      plural: "Podcasts",
      page: "podcasts.html",
      title: ["showName"],
      subtitle: ["host", "format", "lookingFor", "city"],
      body: ["description", "topics"],
      tags: ["topics", "format", "lookingFor"],
      location: ["city", "location"],
      email: "email",
      action: "Pitch"
    },
    resource: {
      label: "Resource",
      plural: "Resources",
      page: "resources.html",
      title: ["title"],
      subtitle: ["category", "submittedBy"],
      body: ["description"],
      tags: ["category"],
      location: ["city", "location"],
      email: "email",
      action: "Open"
    },
    account: {
      label: "Account",
      plural: "Accounts",
      page: "dashboard.html",
      title: ["name"],
      subtitle: ["chapter", "email"],
      body: ["needs", "offers", "goals"],
      tags: ["needs", "offers", "skills"],
      location: ["chapter", "location"],
      email: "email",
      public: false
    },
    savedItem: {
      label: "Saved",
      plural: "Saved items",
      page: "dashboard.html",
      title: ["targetTitle"],
      subtitle: ["targetType"],
      body: ["notes"],
      tags: ["targetType"],
      public: false
    },
    report: {
      label: "Report",
      plural: "Reports",
      page: "admin.html",
      title: ["targetTitle"],
      subtitle: ["targetType", "reason", "status"],
      body: ["details"],
      tags: ["reason", "status"],
      public: false
    },
    adminAction: {
      label: "Admin action",
      plural: "Admin actions",
      page: "admin.html",
      title: ["targetTitle"],
      subtitle: ["targetType", "action"],
      body: ["notes"],
      tags: ["action"],
      public: false
    },
    chapter: {
      label: "Chapter",
      plural: "Chapters",
      page: "chapters.html",
      title: ["name"],
      subtitle: ["city", "status"],
      body: ["focus", "notes"],
      tags: ["city", "status"],
      public: false
    },
    graphEdge: {
      label: "Graph edge",
      plural: "Graph edges",
      page: "network.html",
      title: ["sourceTitle"],
      subtitle: ["relationship", "targetTitle"],
      body: ["basis"],
      tags: ["relationship"],
      public: false
    },
    conciergeRequest: {
      label: "Concierge request",
      plural: "Concierge requests",
      page: "concierge.html",
      title: ["question"],
      subtitle: ["email", "status"],
      body: ["context", "matchedTypes"],
      tags: ["matchedTypes", "status"],
      public: false
    },
    seedTemplate: {
      label: "Seed template",
      plural: "Seed templates",
      page: "admin.html",
      title: ["title"],
      subtitle: ["targetType", "status"],
      body: ["notes", "sourcePolicy"],
      tags: ["targetType", "status"],
      public: false
    }
  };

  var CONTENT_TYPES = [
    "profile", "business", "listing", "job", "mentor", "help",
    "raise", "investor", "event", "collab", "podcast", "resource"
  ];

  var EVENT_CATEGORIES = ["Workshop", "Meetup", "AMA", "Demo Day", "Pitch Competition", "Office Hours", "Hack Night", "Panel", "Other"];
  var EVENT_CITIES = ["Boise, ID", "Atlanta, GA", "Washington, DC", "Madison, AL", "Virtual", "Other"];
  var EVENT_PROVIDER_GUIDES = [
    {
      platform: "Luma",
      auth: "API key stored in secure backend secrets",
      endpoint: "https://public-api.luma.com/v1/organizations/events/list",
      scope: "Read calendar or organization events",
      note: "Use public calendar links first. API sync needs a Luma Plus calendar-scoped key.",
      docs: "https://docs.luma.com/reference/getting-started-with-your-api"
    },
    {
      platform: "Meetup",
      auth: "OAuth bearer token stored in secure backend secrets",
      endpoint: "https://api.meetup.com/gql-ext",
      scope: "Read approved group events",
      note: "Meetup API access now uses GraphQL and organizer authorization. OAuth access may require Meetup Pro.",
      docs: "https://www.meetup.com/graphql/guide/"
    },
    {
      platform: "Eventbrite",
      auth: "OAuth bearer token stored in secure backend secrets",
      endpoint: "https://www.eventbriteapi.com/v3/organizations/{organization_id}/events/",
      scope: "Read current and future organization events",
      note: "Keep OAuth/private tokens out of the browser and Sheets. Start with curated public URLs when possible.",
      docs: "https://www.eventbrite.com/platform/docs/authentication"
    },
    {
      platform: "Partiful",
      auth: "Public URL or manual review",
      endpoint: "Public event or organizer URL",
      scope: "Curated review only",
      note: "Use public event pages unless an official export or approved API path exists.",
      docs: "https://partiful.com/"
    },
    {
      platform: "iCal feed",
      auth: "No secret for public feeds",
      endpoint: "Public .ics URL",
      scope: "Public event fields only",
      note: "Use the feed fetcher to pull ICS text into the manual preview queue before publishing.",
      docs: "https://icalendar.org/"
    },
    {
      platform: "Google Calendar",
      auth: "Public iCal URL or future OAuth connector",
      endpoint: "Public calendar .ics URL",
      scope: "Public event fields only",
      note: "Prefer public iCal exports for the first version. Do not import private attendee data.",
      docs: "https://support.google.com/calendar/answer/37648"
    }
  ];

  var SAMPLE_ICS = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Founders and Builders//Demo Event Import//EN",
    "BEGIN:VEVENT",
    "UID:demo-ical-founder-coffee@example.invalid",
    "SUMMARY:Demo Founder Coffee",
    "DTSTART:20990212T083000Z",
    "LOCATION:Example Cafe",
    "DESCRIPTION:Demo-only imported iCal event. Replace with a real public feed.",
    "URL:https://example.invalid/founder-coffee",
    "CATEGORIES:Meetup",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\n");

  var DEMO = {
    profile: [{
      id: "demo-profile-template",
      name: "Demo member profile",
      business: "Example company",
      building: "A placeholder profile showing the fields a real member would complete.",
      stage: "MVP / Beta",
      skills: "Product, Fundraising, Customer discovery",
      needs: "Beta users, Sales intros",
      offers: "Product feedback, Founder support",
      lookingFor: "Replace this with a real member need before launch.",
      canHelp: "Replace this with real offers from a real member.",
      location: "Washington, DC",
      email: "demo-member@example.invalid",
      moderationStatus: "Demo"
    }],
    business: [{
      id: "demo-business-template",
      name: "Demo company listing",
      category: "Startup",
      industry: "Software",
      description: "Placeholder business record for layout testing only.",
      services: "Replace with verified services",
      hiring: "Open to great people",
      email: "demo-business@example.invalid",
      moderationStatus: "Demo"
    }],
    listing: [{
      id: "demo-listing-template",
      name: "Demo marketplace offer",
      category: "Consulting",
      description: "Placeholder marketplace record. Do not publish as a real vendor.",
      pricing: "Example only",
      email: "demo-listing@example.invalid",
      moderationStatus: "Demo"
    }],
    job: [{
      id: "demo-job-template",
      title: "Demo opportunity",
      company: "Example company",
      category: "Co-founder",
      location: "Atlanta, GA",
      remote: "Yes",
      compensation: "Example only",
      description: "Placeholder job record for testing the opportunity flow.",
      email: "demo-job@example.invalid",
      moderationStatus: "Demo"
    }],
    mentor: [{
      id: "demo-mentor-template",
      name: "Demo mentor profile",
      title: "Example advisor",
      company: "Example company",
      industry: "Startups",
      expertise: "Go-to-market, Fundraising",
      stages: "Idea, Pre-seed",
      bio: "Placeholder mentor record. Replace with a real opt-in mentor.",
      email: "demo-mentor@example.invalid",
      moderationStatus: "Demo"
    }],
    help: [{
      id: "demo-help-template",
      name: "Demo member",
      title: "Need beta testers for a demo product",
      category: "Beta testers",
      urgency: "This month",
      description: "Placeholder help request for testing only.",
      email: "demo-help@example.invalid",
      moderationStatus: "Demo"
    }],
    raise: [{
      id: "demo-raise-template",
      company: "Demo raising company",
      founder: "Demo founder",
      stage: "Pre-seed",
      industry: "Software",
      amountSeeking: "Example only",
      useOfFunds: "Placeholder use of funds.",
      description: "Placeholder funding record. Not an offer to sell securities.",
      email: "demo-raise@example.invalid",
      moderationStatus: "Demo"
    }],
    investor: [{
      id: "demo-investor-template",
      name: "Demo investor profile",
      firm: "Example fund",
      type: "Angel",
      checkSize: "Example only",
      stages: "Idea, Pre-seed",
      industries: "Software, Services",
      thesis: "Placeholder investor profile. Replace with a real opt-in investor.",
      email: "demo-investor@example.invalid",
      moderationStatus: "Demo"
    }],
    event: [{
      id: "demo-event-template",
      title: "Demo founder meetup",
      host: "Founders & Builders",
      category: "Meetup",
      city: "Boise, ID",
      date: "2099-01-01",
      time: "6:00 PM",
      location: "Example venue",
      description: "Placeholder event for testing chapter views.",
      email: "demo-event@example.invalid",
      moderationStatus: "Demo"
    }],
    eventSource: [{
      id: "demo-event-source-template",
      sourceName: "Demo external founder calendar",
      organizerEmail: "demo-source@example.invalid",
      platform: "Luma",
      authMethod: "Public organizer/event URL",
      chapter: "Washington, DC",
      sourceUrl: "https://example.invalid/calendar",
      importMode: "Curated review",
      syncStatus: "Pending review",
      secretStatus: "No secret required",
      fitNotes: "Template record for event-source review flow testing.",
      nextStep: "Manual import approved in demo action"
    }],
    collab: [{
      id: "demo-collab-template",
      title: "Demo workshop collaborator needed",
      name: "Demo organizer",
      category: "Workshop",
      city: "Madison",
      description: "Placeholder collaboration request.",
      email: "demo-collab@example.invalid",
      moderationStatus: "Demo"
    }],
    podcast: [{
      id: "demo-podcast-template",
      showName: "Demo builder podcast",
      host: "Demo host",
      topics: "Startups, Founder lessons",
      format: "Interview",
      lookingFor: "Guests",
      city: "Atlanta, GA",
      description: "Placeholder podcast record.",
      email: "demo-podcast@example.invalid",
      moderationStatus: "Demo"
    }],
    resource: [{
      id: "demo-resource-template",
      title: "Demo startup checklist",
      category: "Checklist",
      description: "Placeholder resource record for testing only.",
      link: "https://example.invalid",
      submittedBy: "Founders & Builders demo",
      moderationStatus: "Demo"
    }],
    report: [],
    account: [],
    savedItem: [],
    adminAction: [{
      id: "demo-event-source-review-action",
      targetType: "eventSource",
      targetId: "demo-event-source-template",
      targetTitle: "Demo external founder calendar",
      action: "Event source ready for manual import",
      recommendedApprovalStatus: "Approved",
      recommendedSyncStatus: "Pending review",
      recommendedSecretStatus: "No secret required",
      importPlan: "Manual import approved",
      sourcePlatform: "Luma",
      sourceUrl: "https://example.invalid/calendar",
      organizerEmail: "demo-source@example.invalid",
      notes: "Demo-only review action for testing the manual import queue."
    }],
    chapter: [],
    graphEdge: [],
    conciergeRequest: [],
    seedTemplate: []
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function normUrl(u) {
    u = String(u || "").trim();
    if (!u) return "";
    return /^https?:\/\//i.test(u) ? u : "https://" + u;
  }

  function toText(value) {
    if (Array.isArray(value)) return value.join(", ");
    return String(value == null ? "" : value);
  }

  function tags(value) {
    return toText(value).split(/[,\n;|]+/).map(function (s) {
      return s.trim();
    }).filter(Boolean);
  }

  function tokenize(value) {
    return toText(value).toLowerCase().replace(/[^a-z0-9\s]+/g, " ").split(/\s+/).filter(function (token) {
      return token.length > 1 && ["and", "the", "for", "with", "that", "this", "from", "into", "near"].indexOf(token) === -1;
    });
  }

  function uniq(list) {
    var seen = {};
    return list.filter(function (item) {
      var key = String(item || "").toLowerCase();
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function first(record, fields) {
    for (var i = 0; i < fields.length; i++) {
      if (record[fields[i]]) return record[fields[i]];
    }
    return "";
  }

  function combine(record, fields) {
    return fields.map(function (field) { return record[field]; }).filter(Boolean).join(" · ");
  }

  function metaFor(type) {
    return TYPE_META[type] || {
      label: type || "Record",
      plural: type || "Records",
      page: "index.html",
      title: ["title", "name"],
      subtitle: [],
      body: [],
      tags: []
    };
  }

  function moderationValue(record) {
    return String(record.moderationStatus || record.status || "").toLowerCase();
  }

  function isPublicRecord(type, record) {
    var meta = metaFor(type);
    if (meta.public === false) return true;
    var status = moderationValue(record);
    return ["hidden", "rejected", "spam", "blocked", "archived", "deleted"].indexOf(status) === -1;
  }

  function recordText(record) {
    var meta = metaFor(record._type);
    return [
      record._title,
      record._subtitle,
      record._body,
      combine(record, meta.tags || []),
      combine(record, meta.location || [])
    ].join(" ");
  }

  function chapterFor(record) {
    var meta = metaFor(record._type);
    var hay = [record.chapter, record.city, record.location, combine(record, meta.location || [])].join(" ").toLowerCase();
    for (var i = 0; i < CHAPTERS.length; i++) {
      var chapter = CHAPTERS[i];
      for (var j = 0; j < chapter.aliases.length; j++) {
        if (hay.indexOf(chapter.aliases[j]) !== -1) return chapter.id;
      }
    }
    if (hay.indexOf("virtual") !== -1 || hay.indexOf("remote") !== -1) return "virtual";
    return "";
  }

  function normalizeRecord(type, raw) {
    var record = {};
    raw = raw || {};
    Object.keys(raw).forEach(function (key) { record[key] = raw[key]; });
    var meta = metaFor(type);
    record._type = type;
    record._meta = meta;
    record._id = String(record.id || record.targetId || record.email || Math.random().toString(36).slice(2));
    record._key = type + ":" + record._id;
    record._title = first(record, meta.title || []) || meta.label;
    record._subtitle = combine(record, meta.subtitle || []);
    record._body = combine(record, meta.body || []);
    record._tags = uniq((meta.tags || []).reduce(function (all, field) {
      return all.concat(tags(record[field]));
    }, [])).slice(0, 8);
    record._chapter = chapterFor(record);
    return record;
  }

  function fetchType(type, options, cb) {
    if (typeof options === "function") {
      cb = options;
      options = {};
    }
    options = options || {};
    var sample = (DEMO[type] || []).map(function (item) { return normalizeRecord(type, item); });
    if (!hasBackend) {
      cb(null, sample, true);
      return;
    }
    if (hasDataBackend) {
      DATA.fetchType(type, options, function (err, list, demo) {
        if (err) {
          cb(err, sample, true);
          return;
        }
        cb(null, (list || []).map(function (item) { return normalizeRecord(type, item); }).filter(function (item) {
          return isPublicRecord(type, item);
        }), demo);
      });
      return;
    }
    var cbName = "fb_platform_" + type + "_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    var script = document.createElement("script");
    var done = false;
    var timer = setTimeout(function () {
      cleanup();
      cb(new Error("Request timed out"), sample, true);
    }, 14000);

    function cleanup() {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { delete window[cbName]; } catch (err) { window[cbName] = null; }
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    window[cbName] = function (res) {
      var list = res && (res.records || res.profiles);
      cleanup();
      if (res && res.ok && Array.isArray(list)) {
        cb(null, list.map(function (item) { return normalizeRecord(type, item); }).filter(function (item) {
          return isPublicRecord(type, item);
        }), false);
      } else {
        cb(new Error(res && res.error || "Bad response"), sample, true);
      }
    };

    script.onerror = function () {
      cleanup();
      cb(new Error("Network error"), sample, true);
    };
    script.src = API + (API.indexOf("?") === -1 ? "?" : "&") + "type=" + encodeURIComponent(type)
      + "&callback=" + encodeURIComponent(cbName) + "&t=" + Date.now()
      + (options.adminToken ? "&adminToken=" + encodeURIComponent(options.adminToken) : "");
    document.body.appendChild(script);
  }

  function fetchAll(options, cb) {
    if (typeof options === "function") {
      cb = options;
      options = {};
    }
    options = options || {};
    var types = options.types || CONTENT_TYPES;
    var pending = types.length;
    var byType = {};
    var all = [];
    var errors = [];
    var usedDemo = false;
    if (!pending) {
      cb({ all: all, byType: byType, errors: errors, isDemo: !hasBackend });
      return;
    }
    types.forEach(function (type) {
      fetchType(type, options, function (err, list, demo) {
        if (err) errors.push({ type: type, error: err });
        if (demo) usedDemo = true;
        byType[type] = list || [];
        all = all.concat(byType[type]);
        pending -= 1;
        if (!pending) cb({ all: all, byType: byType, errors: errors, isDemo: usedDemo });
      });
    });
  }

  function postRecord(type, data) {
    data = data || {};
    if (!hasBackend || !window.fetch) {
      return Promise.resolve({ ok: true, demo: true });
    }
    if (hasDataBackend) {
      return DATA.postRecord(type, data);
    }
    data.type = type;
    return fetch(API, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data)
    }).then(function () {
      return { ok: true };
    });
  }

  function getAdminToken() {
    try {
      if (hasDataBackend && DATA.getAccessToken && DATA.getAccessToken()) return DATA.getAccessToken();
      return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
    } catch (err) {
      return "";
    }
  }

  function saveAdminToken(token) {
    try {
      localStorage.setItem(ADMIN_TOKEN_KEY, token || "");
      if (hasDataBackend && DATA.saveAccessToken) DATA.saveAccessToken(token || "");
    } catch (err) {
      return false;
    }
    return true;
  }

  function clearAdminToken() {
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      if (hasDataBackend && DATA.signOut) DATA.signOut();
    } catch (err) {}
  }

  function requireAdminToken(statusEl) {
    var token = getAdminToken();
    if (!hasBackend) return "";
    if (!token) {
      if (statusEl) statusEl.textContent = "Sign in or save admin access before using this admin action.";
      return null;
    }
    return token;
  }

  function withAdminToken(data, statusEl) {
    var token = requireAdminToken(statusEl);
    if (token == null) return null;
    var out = {};
    Object.keys(data || {}).forEach(function (key) { out[key] = data[key]; });
    if (token) out.adminToken = token;
    return out;
  }

  function postAdminRecord(type, data, statusEl) {
    var payload = withAdminToken(data, statusEl);
    if (!payload) return Promise.reject(new Error("Missing admin access"));
    return postRecord(type, payload);
  }

  function postAdminUpdateRecord(type, targetId, updates, statusEl) {
    var payload = {};
    Object.keys(updates || {}).forEach(function (key) { payload[key] = updates[key]; });
    payload.adminOperation = "updateRecord";
    payload.targetId = targetId;
    return postAdminRecord(type, payload, statusEl);
  }

  function fetchPublicIcalFeed(url, statusEl) {
    if (!hasBackend) return Promise.resolve({ ok: true, content: SAMPLE_ICS, demo: true });
    var token = requireAdminToken(statusEl);
    if (token == null) return Promise.reject(new Error("Missing admin access"));
    if (hasDataBackend && DATA.fetchPublicIcalFeed) {
      return DATA.fetchPublicIcalFeed(url, { adminToken: token });
    }
    return new Promise(function (resolve, reject) {
      var cbName = "fb_ical_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
      var script = document.createElement("script");
      var done = false;
      var timer = setTimeout(function () {
        cleanup();
        reject(new Error("Request timed out"));
      }, 20000);

      function cleanup() {
        if (done) return;
        done = true;
        clearTimeout(timer);
        try { delete window[cbName]; } catch (err) { window[cbName] = null; }
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[cbName] = function (res) {
        cleanup();
        if (res && res.ok) resolve(res);
        else reject(new Error(res && res.error || "Could not fetch iCal feed"));
      };
      script.onerror = function () {
        cleanup();
        reject(new Error("Network error"));
      };
      script.src = API + (API.indexOf("?") === -1 ? "?" : "&")
        + "action=fetchIcal&url=" + encodeURIComponent(url)
        + "&adminToken=" + encodeURIComponent(token)
        + "&callback=" + encodeURIComponent(cbName)
        + "&t=" + Date.now();
      document.body.appendChild(script);
    });
  }

  function randomKey() {
    return "owner_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
  }

  function getIdentity() {
    try {
      var identity = JSON.parse(localStorage.getItem(IDENTITY_KEY) || "null");
      return identity && identity.email ? identity : null;
    } catch (err) {
      return null;
    }
  }

  function saveIdentity(identity) {
    identity = identity || {};
    var existing = getIdentity() || {};
    var saved = {
      ownerKey: existing.ownerKey || identity.ownerKey || randomKey(),
      name: identity.name || existing.name || "",
      email: identity.email || existing.email || "",
      chapter: identity.chapter || existing.chapter || "",
      location: identity.location || existing.location || "",
      needs: identity.needs || existing.needs || "",
      offers: identity.offers || existing.offers || "",
      goals: identity.goals || existing.goals || "",
      skills: identity.skills || existing.skills || "",
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(saved));
    postRecord("account", saved);
    return saved;
  }

  function clearIdentity() {
    localStorage.removeItem(IDENTITY_KEY);
  }

  function savedItems() {
    try {
      return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
    } catch (err) {
      return [];
    }
  }

  function isSaved(key) {
    return savedItems().some(function (item) { return item.key === key; });
  }

  function toggleSaved(record) {
    var list = savedItems();
    var key = record._key;
    var next;
    if (isSaved(key)) {
      next = list.filter(function (item) { return item.key !== key; });
    } else {
      var identity = getIdentity() || {};
      next = list.concat([{
        key: key,
        targetType: record._type,
        targetId: record._id,
        targetTitle: record._title,
        savedAt: new Date().toISOString()
      }]);
      postRecord("savedItem", {
        ownerKey: identity.ownerKey || "",
        accountEmail: identity.email || "",
        targetType: record._type,
        targetId: record._id,
        targetTitle: record._title,
        notes: ""
      });
    }
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    return next.some(function (item) { return item.key === key; });
  }

  function scoreItem(query, record) {
    var q = tokenize(query);
    if (!q.length) return 1;
    var hay = recordText(record).toLowerCase();
    var title = toText(record._title).toLowerCase();
    var score = 0;
    q.forEach(function (token) {
      if (title.indexOf(token) !== -1) score += 4;
      if (hay.indexOf(token) !== -1) score += 2;
      record._tags.forEach(function (tag) {
        if (tag.toLowerCase().indexOf(token) !== -1) score += 2;
      });
    });
    if (hay.indexOf(toText(query).toLowerCase()) !== -1) score += 6;
    return score;
  }

  function universalSearch(query, records, filters) {
    filters = filters || {};
    return records.map(function (record) {
      return { record: record, score: scoreItem(query, record) };
    }).filter(function (entry) {
      if (filters.type && entry.record._type !== filters.type) return false;
      if (filters.chapter && entry.record._chapter !== filters.chapter) return false;
      return entry.score > 0;
    }).sort(function (a, b) {
      return b.score - a.score;
    }).map(function (entry) { return entry.record; });
  }

  function currentMember(records) {
    var identity = getIdentity();
    if (!identity) return null;
    var email = identity.email.toLowerCase();
    var match = (records || []).filter(function (record) {
      return record._type === "profile" && toText(record.email).toLowerCase() === email;
    })[0];
    if (match) return match;
    return normalizeRecord("profile", {
      id: identity.ownerKey,
      name: identity.name,
      email: identity.email,
      location: identity.location || identity.chapter,
      needs: identity.needs,
      offers: identity.offers,
      goals: identity.goals,
      skills: identity.skills,
      building: "Local dashboard identity. Publish a member profile to appear in the directory."
    });
  }

  function matchScore(member, record) {
    if (!member || record._key === member._key) return 0;
    var memberNeeds = tokenize([member.needs, member.lookingFor, member.goals].join(" "));
    var memberOffers = tokenize([member.offers, member.canHelp, member.skills].join(" "));
    var recordOfferText = [record.offers, record.canHelp, record.skills, record.expertise, record.services, record.thesis, record.description, record._body].join(" ").toLowerCase();
    var recordNeedText = [record.needs, record.lookingFor, record.title, record.description, record._body].join(" ").toLowerCase();
    var score = 0;
    memberNeeds.forEach(function (token) {
      if (recordOfferText.indexOf(token) !== -1) score += 4;
      if (recordText(record).toLowerCase().indexOf(token) !== -1) score += 1;
    });
    memberOffers.forEach(function (token) {
      if (recordNeedText.indexOf(token) !== -1) score += 3;
    });
    if (member._chapter && record._chapter && member._chapter === record._chapter) score += 3;
    if (member.industry && record.industry && toText(member.industry).toLowerCase() === toText(record.industry).toLowerCase()) score += 2;
    if (record._type === "mentor" || record._type === "help" || record._type === "job" || record._type === "collab") score += 1;
    if (record._type === "investor" || record._type === "raise") score += 1;
    return score;
  }

  function recommendations(member, records, limit) {
    return records.map(function (record) {
      return { record: record, score: matchScore(member, record) };
    }).filter(function (entry) {
      return entry.score > 0 && CONTENT_TYPES.indexOf(entry.record._type) !== -1;
    }).sort(function (a, b) {
      return b.score - a.score;
    }).slice(0, limit || 8).map(function (entry) {
      entry.record._matchScore = entry.score;
      return entry.record;
    });
  }

  function activityFor(record) {
    var text;
    if (record._type === "profile") text = record._title + " joined with needs: " + (record.needs || record.lookingFor || "open to practical connections");
    else if (record._type === "business") text = record._title + " is listed in " + (record.industry || record.category || "the business directory");
    else if (record._type === "listing") text = record._title + " is available in the marketplace";
    else if (record._type === "job") text = record._title + " is open" + (record.company ? " at " + record.company : "");
    else if (record._type === "mentor") text = record._title + " is available for " + (record.expertise || "mentor support");
    else if (record._type === "help") text = record._title + " needs help" + (record.urgency ? " - " + record.urgency : "");
    else if (record._type === "raise") text = record._title + " is raising" + (record.stage ? " at " + record.stage : "");
    else if (record._type === "investor") text = record._title + " is open to relevant founder outreach";
    else if (record._type === "event") text = record._title + " is coming up" + (record.city ? " in " + record.city : "");
    else if (record._type === "eventSource") text = record._title + " requested event-source review";
    else if (record._type === "collab") text = record._title + " is looking for collaborators";
    else if (record._type === "podcast") text = record._title + " is looking for " + (record.lookingFor || "community connections");
    else if (record._type === "resource") text = record._title + " was added to the resource library";
    else text = record._title;
    return {
      key: record._key,
      type: record._type,
      label: metaFor(record._type).label,
      text: text,
      page: metaFor(record._type).page,
      chapter: record._chapter,
      timestamp: record.timestamp || record.date || "",
      record: record
    };
  }

  function activityItems(records, filters) {
    filters = filters || {};
    return records.filter(function (record) {
      if (filters.type && record._type !== filters.type) return false;
      if (filters.chapter && record._chapter !== filters.chapter) return false;
      return CONTENT_TYPES.indexOf(record._type) !== -1;
    }).map(activityFor).sort(function (a, b) {
      return toText(b.timestamp).localeCompare(toText(a.timestamp));
    });
  }

  function buildGraph(records) {
    var nodes = [{ id: "fb", label: "F&B network", kind: "hub", x: 50, y: 50 }];
    var edges = [];
    var counts = {};
    records.forEach(function (record) {
      counts[record._type] = (counts[record._type] || 0) + 1;
    });
    CONTENT_TYPES.forEach(function (type, i) {
      var angle = (Math.PI * 2 * i) / CONTENT_TYPES.length;
      nodes.push({
        id: type,
        label: metaFor(type).plural,
        kind: type === "raise" || type === "investor" ? "capital" : "type",
        x: 50 + Math.cos(angle) * 34,
        y: 50 + Math.sin(angle) * 34,
        count: counts[type] || 0
      });
      edges.push({ source: "F&B network", target: metaFor(type).plural, relationship: "indexes", basis: (counts[type] || 0) + " current records" });
    });

    records.forEach(function (record) {
      if (record._type === "profile") {
        tags(record.needs || record.lookingFor).slice(0, 3).forEach(function (need) {
          edges.push({ source: record._title, target: need, relationship: "needs", basis: "Profile need" });
        });
        tags(record.offers || record.canHelp || record.skills).slice(0, 3).forEach(function (offer) {
          edges.push({ source: record._title, target: offer, relationship: "can help with", basis: "Profile offer" });
        });
      }
      if (record._type === "business" && record.hiring) {
        edges.push({ source: record._title, target: "Talent", relationship: "may need", basis: record.hiring });
      }
      if (record._type === "raise") {
        edges.push({ source: record._title, target: "Capital", relationship: "seeking", basis: [record.stage, record.amountSeeking].filter(Boolean).join(", ") });
      }
      if (record._chapter) {
        var chapter = chapterLabel(record._chapter);
        edges.push({ source: record._title, target: chapter, relationship: "chapter", basis: "Location signal" });
      }
    });

    return { nodes: nodes, edges: edges.slice(0, 80), counts: counts };
  }

  function chapterLabel(id) {
    var match = CHAPTERS.filter(function (chapter) { return chapter.id === id; })[0];
    if (match) return match.label;
    if (id === "virtual") return "Virtual";
    return id || "Unassigned";
  }

  function eventSourceNeedsSecret(record) {
    var method = toText(record && record.authMethod).toLowerCase();
    return method.indexOf("oauth") !== -1 || method.indexOf("api key") !== -1;
  }

  function eventSourceHasPublicInput(record) {
    return !!(record && (record.feedUrl || record.sourceUrl));
  }

  function eventSourceRecommendation(record) {
    if (eventSourceNeedsSecret(record)) {
      return {
        action: "Event source needs secure setup",
        approval: "Pending review",
        sync: "Needs secure setup",
        secret: "Not collected - admin follow-up required",
        importPlan: "No import yet"
      };
    }
    if (!eventSourceHasPublicInput(record) || record.authMethod === "Manual review only") {
      return {
        action: "Needs follow-up",
        approval: "Pending review",
        sync: "Pending review",
        secret: "No secret required",
        importPlan: "Curated review only"
      };
    }
    return {
      action: "Event source ready for manual import",
      approval: "Approved",
      sync: "Pending review",
      secret: "No secret required",
      importPlan: "Manual import approved"
    };
  }

  function yesNo(value) {
    return toText(value).toLowerCase() === "yes" ? "Yes" : "No";
  }

  function eventSourceReviewNotes(record, recommendation) {
    return [
      "Source reviewed: " + (record._title || record.sourceName || ""),
      "Platform: " + (record.platform || ""),
      "Connection method: " + (record.authMethod || ""),
      "Organizer email: " + (record.organizerEmail || ""),
      "Public source URL: " + (record.sourceUrl || ""),
      "Feed URL: " + (record.feedUrl || ""),
      "Permission confirmed: " + yesNo(record.permissionConfirmed),
      "Attribution accepted: " + yesNo(record.attributionAccepted),
      "Review terms accepted: " + yesNo(record.reviewAccepted),
      "",
      "Recommended Event Sources row updates:",
      "- approvalStatus: " + recommendation.approval,
      "- syncStatus: " + recommendation.sync,
      "- secretStatus: " + recommendation.secret,
      "- nextStep: " + (
        recommendation.action === "Event source needs secure setup"
          ? "Admin follow-up for secure OAuth/API setup"
          : recommendation.importPlan
      ),
      "",
      "Import plan: " + recommendation.importPlan
    ].join("\n");
  }

  function reviewCheck(label, value) {
    var ok = yesNo(value) === "Yes";
    return '<span class="review-check review-check--' + (ok ? "ok" : "warn") + '">' + esc(label) + ": " + (ok ? "Yes" : "No") + "</span>";
  }

  function eventSourceCardHTML(record, selectedKey) {
    var selected = selectedKey && record._key === selectedKey;
    var status = record.approvalStatus || record.syncStatus || "Pending review";
    var method = [record.platform, record.authMethod].filter(Boolean).join(" · ");
    var publicUrl = record.feedUrl || record.sourceUrl;
    return (
      '<article class="platform-card source-review-card' + (selected ? " is-selected" : "") + '" data-record-key="' + esc(record._key) + '">' +
        '<div class="platform-card__top">' +
          '<div class="platform-card__icon">E</div>' +
          '<div>' +
            '<p class="platform-card__label">Event source' + (record._chapter ? " · " + esc(chapterLabel(record._chapter)) : "") + "</p>" +
            '<h3 class="platform-card__title">' + esc(record._title) + "</h3>" +
            (method ? '<p class="platform-card__meta">' + esc(method) + "</p>" : "") +
          "</div>" +
        "</div>" +
        (record.fitNotes ? '<p class="platform-card__body">' + esc(record.fitNotes) + "</p>" : "") +
        '<div class="review-checks">' +
          reviewCheck("Permission", record.permissionConfirmed) +
          reviewCheck("Attribution", record.attributionAccepted) +
          reviewCheck("Review", record.reviewAccepted) +
        "</div>" +
        '<div class="tags">' +
          '<span class="tag">' + esc(status) + "</span>" +
          (record.secretStatus ? '<span class="tag">' + esc(record.secretStatus) + "</span>" : "") +
        "</div>" +
        '<div class="platform-card__actions">' +
          '<button class="mini-btn' + (selected ? " is-active" : "") + '" type="button" data-admin-source-select data-record-key="' + esc(record._key) + '">' + (selected ? "Selected" : "Review") + "</button>" +
          (record.organizerEmail ? '<a class="mini-btn" href="mailto:' + esc(record.organizerEmail) + '">Email</a>' : "") +
          (publicUrl ? '<a class="mini-btn" href="' + esc(normUrl(publicUrl)) + '" target="_blank" rel="noopener noreferrer">Open source</a>' : "") +
        "</div>" +
      "</article>"
    );
  }

  function renderEventSourceQueue(el, records, selectedKey) {
    if (!el) return;
    if (!records.length) {
      el.innerHTML = emptyHTML("No event source requests have been submitted.");
      return;
    }
    el.innerHTML = records.map(function (record) {
      return eventSourceCardHTML(record, selectedKey);
    }).join("");
  }

  function setFormValue(form, name, value) {
    if (form && form.elements[name]) form.elements[name].value = value || "";
  }

  function setReviewFormEnabled(form, enabled) {
    if (!form) return;
    Array.prototype.forEach.call(form.elements, function (el) {
      if (el.name !== "targetType") el.disabled = !enabled;
    });
  }

  function renderSelectedEventSource(record, el) {
    if (!el) return;
    if (!record) {
      el.innerHTML = "<p>Select an event source request above to start a review.</p>";
      return;
    }
    var links = [
      record.sourceUrl ? '<a class="mini-btn" href="' + esc(normUrl(record.sourceUrl)) + '" target="_blank" rel="noopener noreferrer">Source URL</a>' : "",
      record.feedUrl ? '<a class="mini-btn" href="' + esc(normUrl(record.feedUrl)) + '" target="_blank" rel="noopener noreferrer">Feed URL</a>' : "",
      record.organizerEmail ? '<a class="mini-btn" href="mailto:' + esc(record.organizerEmail) + '">Email organizer</a>' : ""
    ].filter(Boolean).join("");
    el.innerHTML =
      '<div class="source-review-summary__grid">' +
        '<div><p class="source-review-summary__label">Selected source</p><strong>' + esc(record._title) + "</strong></div>" +
        '<div><p class="source-review-summary__label">Platform</p><strong>' + esc(record.platform || "Unknown") + "</strong></div>" +
        '<div><p class="source-review-summary__label">Connection</p><strong>' + esc(record.authMethod || "Not specified") + "</strong></div>" +
        '<div><p class="source-review-summary__label">Current status</p><strong>' + esc(record.approvalStatus || record.syncStatus || "Pending review") + "</strong></div>" +
      "</div>" +
      (record.fitNotes ? '<p class="source-review-summary__notes">' + esc(record.fitNotes) + "</p>" : "") +
      (links ? '<div class="platform-card__actions">' + links + "</div>" : "");
  }

  function selectEventSourceForReview(record, form, summaryEl, submitEl) {
    if (!record || !form) return;
    var recommendation = eventSourceRecommendation(record);
    setReviewFormEnabled(form, true);
    setFormValue(form, "targetType", "eventSource");
    setFormValue(form, "targetId", record._id);
    setFormValue(form, "targetTitle", record._title);
    setFormValue(form, "action", recommendation.action);
    setFormValue(form, "recommendedApprovalStatus", recommendation.approval);
    setFormValue(form, "recommendedSyncStatus", recommendation.sync);
    setFormValue(form, "recommendedSecretStatus", recommendation.secret);
    setFormValue(form, "importPlan", recommendation.importPlan);
    setFormValue(form, "sourcePlatform", record.platform);
    setFormValue(form, "sourceUrl", record.sourceUrl);
    setFormValue(form, "feedUrl", record.feedUrl);
    setFormValue(form, "organizerEmail", record.organizerEmail);
    setFormValue(form, "notes", eventSourceReviewNotes(record, recommendation));
    renderSelectedEventSource(record, summaryEl);
    if (submitEl) submitEl.disabled = false;
  }

  function latestSourceAction(source, actions) {
    var reviewActions = [
      "Event source approved",
      "Event source ready for manual import",
      "Event source needs secure setup",
      "Event source rejected",
      "Event source paused",
      "Needs follow-up"
    ];
    var matches = (actions || []).filter(function (action) {
      return action.targetType === "eventSource"
        && String(action.targetId || "") === String(source._id || "")
        && reviewActions.indexOf(action.action) !== -1;
    }).sort(function (a, b) {
      return toText(b.timestamp).localeCompare(toText(a.timestamp));
    });
    return matches[0] || null;
  }

  function eventSourceImportState(source, actions) {
    var approvalStatus = toText(source.approvalStatus).toLowerCase();
    var syncStatus = toText(source.syncStatus).toLowerCase();
    var latest = latestSourceAction(source, actions);
    var action = latest && toText(latest.action).toLowerCase();
    if (action && (action.indexOf("rejected") !== -1 || action.indexOf("paused") !== -1)) {
      return { approved: false, basis: latest.action };
    }
    if (action === "event source approved" || action === "event source ready for manual import") {
      return { approved: true, basis: latest.action };
    }
    if (approvalStatus === "approved" || syncStatus === "active") {
      return { approved: true, basis: source.approvalStatus || source.syncStatus };
    }
    if (approvalStatus === "rejected" || approvalStatus === "paused" || syncStatus === "rejected" || syncStatus === "paused") {
      return { approved: false, basis: source.approvalStatus || source.syncStatus };
    }
    return { approved: false, basis: "Pending review" };
  }

  function approvedEventSources(sources, actions) {
    return (sources || []).filter(function (source) {
      return eventSourceImportState(source, actions).approved;
    }).sort(function (a, b) {
      return toText(a._title).localeCompare(toText(b._title));
    });
  }

  function populateEventImportSources(selectEl, sources, actions) {
    if (!selectEl) return [];
    var approved = approvedEventSources(sources, actions);
    if (!approved.length) {
      selectEl.innerHTML = '<option value="">No approved event sources yet</option>';
      selectEl.disabled = true;
      return approved;
    }
    selectEl.disabled = false;
    selectEl.innerHTML = '<option value="">Select approved source...</option>' + approved.map(function (source) {
      var state = eventSourceImportState(source, actions);
      return '<option value="' + esc(source._key) + '">' + esc(source._title) + " · " + esc(source.platform || "Source") + " · " + esc(state.basis) + "</option>";
    }).join("");
    return approved;
  }

  function optionHTML(options, value, placeholder) {
    var html = placeholder ? '<option value="">' + esc(placeholder) + "</option>" : "";
    html += options.map(function (option) {
      return '<option' + (option === value ? " selected" : "") + ">" + esc(option) + "</option>";
    }).join("");
    return html;
  }

  function normalizeEventCategory(value) {
    value = toText(value).trim();
    if (!value) return "";
    var lower = value.toLowerCase();
    for (var i = 0; i < EVENT_CATEGORIES.length; i++) {
      if (EVENT_CATEGORIES[i].toLowerCase() === lower) return EVENT_CATEGORIES[i];
    }
    if (lower.indexOf("demo") !== -1) return "Demo Day";
    if (lower.indexOf("pitch") !== -1) return "Pitch Competition";
    if (lower.indexOf("office") !== -1) return "Office Hours";
    if (lower.indexOf("hack") !== -1) return "Hack Night";
    if (lower.indexOf("panel") !== -1) return "Panel";
    if (lower.indexOf("workshop") !== -1) return "Workshop";
    if (lower.indexOf("ama") !== -1) return "AMA";
    if (lower.indexOf("meet") !== -1) return "Meetup";
    return "Other";
  }

  function normalizeEventCity(value) {
    value = toText(value).trim();
    if (!value) return "";
    var lower = value.toLowerCase();
    for (var i = 0; i < EVENT_CITIES.length; i++) {
      if (EVENT_CITIES[i].toLowerCase() === lower) return EVENT_CITIES[i];
    }
    if (lower.indexOf("boise") !== -1) return "Boise, ID";
    if (lower.indexOf("atlanta") !== -1) return "Atlanta, GA";
    if (lower.indexOf("washington") !== -1 || lower === "dc" || lower.indexOf("d.c.") !== -1) return "Washington, DC";
    if (lower.indexOf("madison") !== -1) return "Madison, AL";
    if (lower.indexOf("virtual") !== -1 || lower.indexOf("online") !== -1 || lower.indexOf("zoom") !== -1) return "Virtual";
    return "Other";
  }

  function formatImportedTime(hour, minute, suffix) {
    hour = Number(hour || 0);
    minute = Number(minute || 0);
    var meridiem = hour >= 12 ? "PM" : "AM";
    var displayHour = hour % 12 || 12;
    return displayHour + ":" + String(minute).padStart(2, "0") + " " + meridiem + (suffix || "");
  }

  function parseIcalDate(value) {
    value = toText(value).trim();
    var match = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?/);
    if (!match) return { date: normalizeDate(value), time: "" };
    return {
      date: match[1] + "-" + match[2] + "-" + match[3],
      time: match[4] ? formatImportedTime(match[4], match[5], match[7] ? " UTC" : "") : ""
    };
  }

  function normalizeDate(value) {
    value = toText(value).trim();
    if (!value) return "";
    var iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return iso[1] + "-" + iso[2] + "-" + iso[3];
    var compact = value.match(/^(\d{4})(\d{2})(\d{2})/);
    if (compact) return compact[1] + "-" + compact[2] + "-" + compact[3];
    var parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed.getFullYear() + "-" + String(parsed.getMonth() + 1).padStart(2, "0") + "-" + String(parsed.getDate()).padStart(2, "0");
    }
    return "";
  }

  function decodeIcalText(value) {
    return toText(value)
      .replace(/\\n/gi, "\n")
      .replace(/\\,/g, ",")
      .replace(/\\;/g, ";")
      .replace(/\\\\/g, "\\")
      .trim();
  }

  function parseIcalEvents(raw) {
    var lines = toText(raw).split(/\r?\n/).reduce(function (all, line) {
      if (/^[ \t]/.test(line) && all.length) all[all.length - 1] += line.slice(1);
      else all.push(line);
      return all;
    }, []);
    var events = [];
    var current = null;
    lines.forEach(function (line) {
      var trimmed = line.trim();
      if (trimmed === "BEGIN:VEVENT") {
        current = {};
        return;
      }
      if (trimmed === "END:VEVENT") {
        if (current) events.push(current);
        current = null;
        return;
      }
      if (!current) return;
      var colon = line.indexOf(":");
      if (colon === -1) return;
      var key = line.slice(0, colon).split(";")[0].toUpperCase();
      var value = decodeIcalText(line.slice(colon + 1));
      if (key === "SUMMARY") current.title = value;
      else if (key === "DESCRIPTION") current.description = value;
      else if (key === "LOCATION") current.location = value;
      else if (key === "URL") current.rsvpLink = value;
      else if (key === "UID") current.sourceEventId = value;
      else if (key === "CATEGORIES") current.category = value.split(",")[0];
      else if (key === "DTSTART") {
        var parsed = parseIcalDate(value);
        current.date = parsed.date;
        current.time = parsed.time;
      }
    });
    return events;
  }

  function parseJsonEvents(raw) {
    try {
      var parsed = JSON.parse(raw);
      var list = Array.isArray(parsed) ? parsed : (parsed.events || parsed.records || parsed.items || [parsed]);
      if (!Array.isArray(list)) return [];
      return list.map(function (item) {
        item = item || {};
        var start = item.start || item.startsAt || item.startDate || item.date || "";
        var parsedStart = parseIcalDate(start);
        return {
          title: item.title || item.name || item.summary,
          host: item.host || item.organizer || item.organizerName,
          category: item.category || item.type,
          city: item.city,
          date: normalizeDate(item.date || item.startDate || parsedStart.date),
          time: item.time || item.startTime || parsedStart.time,
          location: item.location || item.venue || item.address,
          description: item.description || item.details,
          rsvpLink: item.rsvpLink || item.url || item.link,
          sourceUrl: item.sourceUrl || item.url || item.link,
          sourceEventId: item.sourceEventId || item.uid || item.id
        };
      });
    } catch (err) {
      return [];
    }
  }

  function parseCsvLine(line, delimiter) {
    var out = [];
    var cur = "";
    var quote = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') {
        quote = !quote;
      } else if (ch === delimiter && !quote) {
        out.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  }

  function fieldFromHeader(row, names) {
    for (var i = 0; i < names.length; i++) {
      if (row[names[i]] != null && row[names[i]] !== "") return row[names[i]];
    }
    return "";
  }

  function parseDelimitedEvents(raw) {
    var lines = toText(raw).split(/\r?\n/).filter(function (line) { return line.trim(); });
    if (lines.length < 2) return [];
    var delimiter = lines[0].indexOf("\t") !== -1 ? "\t" : ",";
    if (lines[0].indexOf(delimiter) === -1) return [];
    var headers = parseCsvLine(lines[0], delimiter).map(function (header) {
      return header.toLowerCase().replace(/[^a-z0-9]+/g, "");
    });
    if (!headers.some(function (header) { return ["title", "name", "summary", "event"].indexOf(header) !== -1; })) return [];
    return lines.slice(1).map(function (line) {
      var cells = parseCsvLine(line, delimiter);
      var row = {};
      headers.forEach(function (header, i) { row[header] = cells[i] || ""; });
      return {
        title: fieldFromHeader(row, ["title", "name", "summary", "event"]),
        host: fieldFromHeader(row, ["host", "organizer", "organizername"]),
        category: fieldFromHeader(row, ["category", "type"]),
        city: fieldFromHeader(row, ["city", "chapter"]),
        date: fieldFromHeader(row, ["date", "startdate", "starts"]),
        time: fieldFromHeader(row, ["time", "starttime"]),
        location: fieldFromHeader(row, ["location", "venue", "address"]),
        description: fieldFromHeader(row, ["description", "details", "summary"]),
        rsvpLink: fieldFromHeader(row, ["rsvplink", "url", "link"]),
        sourceUrl: fieldFromHeader(row, ["sourceurl", "url", "link"]),
        sourceEventId: fieldFromHeader(row, ["sourceeventid", "uid", "id"])
      };
    });
  }

  function parseStructuredEvents(raw) {
    var blocks = toText(raw).split(/\n\s*\n+/).map(function (block) { return block.trim(); }).filter(Boolean);
    if (!blocks.length && raw.trim()) blocks = [raw.trim()];
    return blocks.map(function (block) {
      var event = {};
      block.split(/\r?\n/).forEach(function (line, i) {
        var match = line.match(/^\s*([^:]+):\s*(.+)$/);
        if (!match) {
          if (i === 0 && !event.title) event.title = line.trim();
          else if (/^https?:\/\//i.test(line.trim())) event.rsvpLink = line.trim();
          return;
        }
        var key = match[1].toLowerCase().replace(/[^a-z0-9]+/g, "");
        var value = match[2].trim();
        if (["title", "event", "name", "summary"].indexOf(key) !== -1) event.title = value;
        else if (["host", "organizer", "organizername"].indexOf(key) !== -1) event.host = value;
        else if (key === "category" || key === "type") event.category = value;
        else if (key === "city" || key === "chapter") event.city = value;
        else if (key === "date" || key === "startdate") event.date = value;
        else if (key === "time" || key === "starttime") event.time = value;
        else if (key === "location" || key === "venue" || key === "address") event.location = value;
        else if (key === "description" || key === "details") event.description = value;
        else if (key === "rsvp" || key === "rsvplink" || key === "url" || key === "link") event.rsvpLink = value;
        else if (key === "sourceurl") event.sourceUrl = value;
        else if (key === "id" || key === "uid" || key === "sourceeventid") event.sourceEventId = value;
      });
      return event;
    });
  }

  function normalizeImportedEvent(item, source, defaults, index) {
    item = item || {};
    defaults = defaults || {};
    var parsedDate = parseIcalDate(item.date || item.start || "");
    var sourceUrl = item.sourceUrl || source.sourceUrl || source.feedUrl || item.rsvpLink || "";
    return {
      _draftId: "draft_" + index + "_" + Date.now(),
      _include: true,
      title: toText(item.title).trim(),
      host: toText(item.host || defaults.host || source.sourceName).trim(),
      category: normalizeEventCategory(item.category || defaults.category || ""),
      city: normalizeEventCity(item.city || defaults.city || ""),
      date: normalizeDate(item.date || parsedDate.date),
      time: toText(item.time || parsedDate.time).trim(),
      location: toText(item.location).trim(),
      description: toText(item.description).trim(),
      rsvpLink: toText(item.rsvpLink || item.url || item.link || sourceUrl).trim(),
      email: toText(defaults.email || source.organizerEmail).trim(),
      sourcePlatform: toText(item.sourcePlatform || source.platform).trim(),
      sourceName: toText(item.sourceName || source.sourceName).trim(),
      sourceUrl: toText(sourceUrl).trim(),
      sourceEventId: toText(item.sourceEventId || item.uid || item.id).trim(),
      importedFromSourceId: source._id,
      importStatus: "Imported"
    };
  }

  function parseEventImportInput(raw, source, defaults) {
    raw = toText(raw).trim();
    if (!raw || !source) return [];
    var parsed = [];
    if (raw.indexOf("BEGIN:VEVENT") !== -1) parsed = parseIcalEvents(raw);
    if (!parsed.length) parsed = parseJsonEvents(raw);
    if (!parsed.length) parsed = parseDelimitedEvents(raw);
    if (!parsed.length) parsed = parseStructuredEvents(raw);
    return parsed.map(function (item, i) {
      return normalizeImportedEvent(item, source, defaults, i);
    }).filter(function (item) {
      return item.title || item.date || item.rsvpLink;
    });
  }

  function eventTextKey(value) {
    return toText(value).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
  }

  function eventCityKey(event) {
    return eventTextKey(normalizeEventCity(event && event.city) || event && event.city || event && event.location || "");
  }

  function eventSourceKey(event) {
    return eventTextKey(event && event.sourcePlatform || "");
  }

  function eventFingerprint(event) {
    var title = eventTextKey(event && event.title);
    var date = normalizeDate(event && event.date);
    var city = eventCityKey(event);
    if (!title || !date) return "";
    return [title, date, city].join("|");
  }

  function eventDuplicateInfo(event, existingEvents) {
    event = event || {};
    existingEvents = existingEvents || [];
    var externalId = eventTextKey(event.sourceEventId);
    var platform = eventSourceKey(event);
    var fingerprint = eventFingerprint(event);
    for (var i = 0; i < existingEvents.length; i++) {
      var existing = existingEvents[i] || {};
      if (moderationValue(existing) === "archived" || moderationValue(existing) === "deleted") continue;
      if (externalId && eventTextKey(existing.sourceEventId) === externalId) {
        var existingPlatform = eventSourceKey(existing);
        if (!platform || !existingPlatform || platform === existingPlatform) {
          return {
            kind: "sourceEventId",
            message: "Matches existing source event ID",
            matchId: existing._id || existing.id || "",
            matchTitle: existing._title || existing.title || "Existing event"
          };
        }
      }
      if (fingerprint && eventFingerprint(existing) === fingerprint) {
        return {
          kind: "fingerprint",
          message: "Same title, date, and city as an existing event",
          matchId: existing._id || existing.id || "",
          matchTitle: existing._title || existing.title || "Existing event"
        };
      }
    }
    return null;
  }

  function annotateEventDrafts(drafts, existingEvents) {
    var seen = {};
    return (drafts || []).map(function (event) {
      var duplicate = eventDuplicateInfo(event, existingEvents);
      var fingerprint = eventFingerprint(event);
      if (!duplicate && fingerprint && seen[fingerprint]) {
        duplicate = {
          kind: "previewBatch",
          message: "Duplicate within this preview batch",
          matchId: "",
          matchTitle: seen[fingerprint]
        };
      }
      if (fingerprint && !seen[fingerprint]) seen[fingerprint] = event.title || "Earlier preview event";
      event._duplicate = duplicate;
      event._include = !duplicate;
      return event;
    });
  }

  function todayStart() {
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function eventAgeDays(event) {
    var date = normalizeDate(event && event.date);
    if (!date) return null;
    var parts = date.split("-");
    if (parts.length !== 3) return null;
    var eventDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (isNaN(eventDate.getTime())) return null;
    return Math.floor((todayStart().getTime() - eventDate.getTime()) / 86400000);
  }

  function expiredEventCandidates(events, olderThanDays) {
    olderThanDays = Math.max(0, Number(olderThanDays || 0));
    return (events || []).filter(function (event) {
      if (["archived", "deleted", "hidden", "rejected"].indexOf(moderationValue(event)) !== -1) return false;
      var age = eventAgeDays(event);
      return age != null && age > olderThanDays;
    }).sort(function (a, b) {
      return toText(a.date).localeCompare(toText(b.date));
    });
  }

  function draftField(name, value, type) {
    return '<input type="' + esc(type || "text") + '" data-import-field="' + esc(name) + '" value="' + esc(value || "") + '" />';
  }

  function renderEventImportPreview(el, drafts) {
    if (!el) return;
    if (!drafts.length) {
      el.innerHTML = "";
      return;
    }
    el.innerHTML =
      '<div class="event-import-preview__head">' +
        '<div><h3 class="platform-section__title">Preview parsed events</h3><p class="platform-section__desc">Edit fields before publishing. Only checked events will be written to the public calendar.</p></div>' +
        '<button class="btn" type="button" data-event-import-publish>Publish selected</button>' +
      "</div>" +
      drafts.map(function (event, i) {
        var duplicate = event._duplicate;
        return '<article class="event-import-card' + (duplicate ? " event-import-card--duplicate" : "") + '" data-import-index="' + i + '" data-imported-from="' + esc(event.importedFromSourceId || "") + '" data-duplicate-id="' + esc(duplicate && duplicate.matchId || "") + '">' +
          '<label class="event-import-card__include"><input type="checkbox" data-import-include' + (event._include !== false ? " checked" : "") + " /> Include</label>" +
          (duplicate ? '<div class="event-import-card__warning"><strong>Possible duplicate:</strong> ' + esc(duplicate.message) + (duplicate.matchTitle ? " · " + esc(duplicate.matchTitle) : "") + "</div>" : "") +
          '<div class="event-import-card__grid">' +
            '<label class="field"><span class="field__label">Title</span>' + draftField("title", event.title) + "</label>" +
            '<label class="field"><span class="field__label">Host</span>' + draftField("host", event.host) + "</label>" +
            '<label class="field"><span class="field__label">Date</span>' + draftField("date", event.date, "date") + "</label>" +
            '<label class="field"><span class="field__label">Time</span>' + draftField("time", event.time) + "</label>" +
            '<label class="field"><span class="field__label">City</span><select data-import-field="city">' + optionHTML(EVENT_CITIES, event.city, "Select...") + "</select></label>" +
            '<label class="field"><span class="field__label">Category</span><select data-import-field="category">' + optionHTML(EVENT_CATEGORIES, event.category, "Select...") + "</select></label>" +
            '<label class="field field--full"><span class="field__label">Location</span>' + draftField("location", event.location) + "</label>" +
            '<label class="field field--full"><span class="field__label">RSVP link</span>' + draftField("rsvpLink", event.rsvpLink, "url") + "</label>" +
            '<label class="field"><span class="field__label">Source platform</span>' + draftField("sourcePlatform", event.sourcePlatform) + "</label>" +
            '<label class="field"><span class="field__label">Source name</span>' + draftField("sourceName", event.sourceName) + "</label>" +
            '<label class="field field--full"><span class="field__label">Source URL</span>' + draftField("sourceUrl", event.sourceUrl, "url") + "</label>" +
            '<label class="field"><span class="field__label">Source event ID</span>' + draftField("sourceEventId", event.sourceEventId) + "</label>" +
            '<label class="field"><span class="field__label">Contact email</span>' + draftField("email", event.email, "email") + "</label>" +
            '<label class="field field--full"><span class="field__label">Description</span><textarea data-import-field="description" rows="4">' + esc(event.description || "") + "</textarea></label>" +
          "</div>" +
        "</article>";
      }).join("");
  }

  function collectEventImportPreview(el) {
    if (!el) return [];
    return Array.prototype.map.call(el.querySelectorAll("[data-import-index]"), function (card) {
      var event = {};
      Array.prototype.forEach.call(card.querySelectorAll("[data-import-field]"), function (field) {
        event[field.getAttribute("data-import-field")] = field.value.trim();
      });
      event._include = !!(card.querySelector("[data-import-include]") && card.querySelector("[data-import-include]").checked);
      event.importedFromSourceId = card.getAttribute("data-imported-from") || "";
      event._duplicateMatchId = card.getAttribute("data-duplicate-id") || "";
      event.importStatus = "Imported";
      return event;
    });
  }

  function prepareEventForPost(event, source) {
    event = event || {};
    return {
      title: event.title,
      host: event.host,
      category: normalizeEventCategory(event.category),
      city: normalizeEventCity(event.city),
      date: normalizeDate(event.date),
      time: event.time,
      location: event.location,
      description: event.description,
      rsvpLink: event.rsvpLink,
      email: event.email || source.organizerEmail,
      sourcePlatform: event.sourcePlatform || source.platform,
      sourceName: event.sourceName || source.sourceName,
      sourceUrl: event.sourceUrl || source.sourceUrl || source.feedUrl,
      sourceEventId: event.sourceEventId,
      importedFromSourceId: source._id,
      importStatus: "Imported"
    };
  }

  function renderEventCleanup(el, events) {
    if (!el) return;
    if (!events.length) {
      el.innerHTML = emptyHTML("No expired public events match the current cleanup window.");
      return;
    }
    el.innerHTML = events.map(function (event, i) {
      var age = eventAgeDays(event);
      return '<article class="event-import-card event-cleanup-card" data-cleanup-index="' + i + '" data-event-id="' + esc(event._id || event.id || "") + '">' +
        '<label class="event-import-card__include"><input type="checkbox" data-cleanup-include checked /> Archive</label>' +
        '<div class="event-cleanup-card__body">' +
          '<h3 class="platform-card__title">' + esc(event._title || event.title || "Untitled event") + "</h3>" +
          '<p class="platform-card__meta">' + esc([event.date, event.time, event.city, event.sourcePlatform].filter(Boolean).join(" · ")) + "</p>" +
          (event.sourceName ? '<p class="platform-card__body">Source: ' + esc(event.sourceName) + "</p>" : "") +
          '<div class="tags"><span class="tag">' + esc(age + " days old") + "</span>" + (event.importStatus ? '<span class="tag">' + esc(event.importStatus) + "</span>" : "") + "</div>" +
        "</div>" +
      "</article>";
    }).join("");
  }

  function collectCleanupSelection(el, events) {
    if (!el) return [];
    return Array.prototype.map.call(el.querySelectorAll("[data-cleanup-index]"), function (card) {
      var include = !!(card.querySelector("[data-cleanup-include]") && card.querySelector("[data-cleanup-include]").checked);
      return include ? events[Number(card.getAttribute("data-cleanup-index"))] : null;
    }).filter(Boolean);
  }

  function providerGuideHTML(guide) {
    return '<article class="platform-card provider-guide-card">' +
      '<div class="platform-card__top">' +
        '<div class="platform-card__icon">API</div>' +
        '<div>' +
          '<p class="platform-card__label">Provider connector</p>' +
          '<h3 class="platform-card__title">' + esc(guide.platform) + "</h3>" +
          '<p class="platform-card__meta">' + esc(guide.auth) + "</p>" +
        "</div>" +
      "</div>" +
      '<p class="platform-card__body">' + esc(guide.note) + "</p>" +
      '<div class="source-review-summary__grid">' +
        '<div><p class="source-review-summary__label">Endpoint</p><strong>' + esc(guide.endpoint) + "</strong></div>" +
        '<div><p class="source-review-summary__label">Scope</p><strong>' + esc(guide.scope) + "</strong></div>" +
      "</div>" +
      '<div class="platform-card__actions"><a class="mini-btn" href="' + esc(guide.docs) + '" target="_blank" rel="noopener noreferrer">Docs</a></div>' +
    "</article>";
  }

  function renderProviderGuides(el) {
    if (!el) return;
    el.innerHTML = EVENT_PROVIDER_GUIDES.map(providerGuideHTML).join("");
  }

  function providerGuideFor(platform) {
    var key = eventTextKey(platform);
    return EVENT_PROVIDER_GUIDES.filter(function (guide) {
      return eventTextKey(guide.platform) === key;
    })[0] || EVENT_PROVIDER_GUIDES[0];
  }

  function populateEventProviderSources(selectEl, sources) {
    if (!selectEl) return;
    if (!sources.length) {
      selectEl.innerHTML = '<option value="">No event sources available</option>';
      selectEl.disabled = true;
      return;
    }
    selectEl.disabled = false;
    selectEl.innerHTML = '<option value="">Select event source...</option>' + sources.map(function (source) {
      return '<option value="' + esc(source._key) + '">' + esc(source._title) + " · " + esc(source.platform || "Source") + "</option>";
    }).join("");
  }

  function fillProviderFormFromSource(source, fields) {
    if (!source || !fields) return;
    if (fields.providerSelect) fields.providerSelect.value = source.platform || fields.providerSelect.value;
    var guide = providerGuideFor(source.platform || fields.providerSelect && fields.providerSelect.value);
    if (fields.connectorStatus) fields.connectorStatus.value = source.connectorStatus || source.syncStatus || "Needs secure setup";
    if (fields.oauthStatus) fields.oauthStatus.value = source.oauthStatus || (eventSourceNeedsSecret(source) ? "Organizer authorization requested" : "No secret required");
    if (fields.accountId) fields.accountId.value = source.providerAccountId || "";
    if (fields.calendarId) fields.calendarId.value = source.providerCalendarId || "";
    if (fields.organizationId) fields.organizationId.value = source.providerOrganizationId || "";
    if (fields.endpoint) fields.endpoint.value = source.providerEndpoint || guide.endpoint || "";
    if (fields.scope) fields.scope.value = source.providerScope || guide.scope || "";
    if (fields.notes) {
      fields.notes.value = source.providerNotes || [
        "Provider: " + (source.platform || guide.platform),
        "Credential handling: " + guide.auth,
        "Do not paste tokens or API keys into this form. Store them in secure backend secrets."
      ].join("\n");
    }
  }

  function cardHTML(record) {
    var meta = metaFor(record._type);
    var email = record[meta.email] || record.email;
    var isPrivate = meta.public === false;
    var saved = isSaved(record._key);
    var tagsHTML = record._tags.slice(0, 4).map(function (tag) {
      return '<span class="tag">' + esc(tag) + "</span>";
    }).join("");
    return (
      '<article class="platform-card" data-record-key="' + esc(record._key) + '">' +
        '<div class="platform-card__top">' +
          '<div class="platform-card__icon">' + esc(meta.label.slice(0, 1)) + "</div>" +
          '<div>' +
            '<p class="platform-card__label">' + esc(meta.label) + (record._chapter ? " · " + esc(chapterLabel(record._chapter)) : "") + "</p>" +
            '<h3 class="platform-card__title">' + esc(record._title) + "</h3>" +
            (record._subtitle ? '<p class="platform-card__meta">' + esc(record._subtitle) + "</p>" : "") +
          "</div>" +
        "</div>" +
        (record._body ? '<p class="platform-card__body">' + esc(record._body) + "</p>" : "") +
        (tagsHTML ? '<div class="tags">' + tagsHTML + "</div>" : "") +
        '<div class="platform-card__actions">' +
          '<a class="mini-btn" href="' + esc(meta.page) + '">' + esc(meta.action || "Open") + "</a>" +
          (email ? '<a class="mini-btn" href="mailto:' + esc(email) + '">Email</a>' : "") +
          (isPrivate ? "" : '<button class="mini-btn' + (saved ? " is-active" : "") + '" type="button" data-platform-action="save" data-record-key="' + esc(record._key) + '">' + (saved ? "Saved" : "Save") + "</button>") +
          (isPrivate ? "" : '<a class="mini-btn" href="report-listing.html?type=' + encodeURIComponent(record._type) + '&id=' + encodeURIComponent(record._id) + '&title=' + encodeURIComponent(record._title) + '">Report</a>') +
        "</div>" +
      "</article>"
    );
  }

  function rowHTML(record) {
    var meta = metaFor(record._type);
    return (
      '<article class="result-row" data-record-key="' + esc(record._key) + '">' +
        '<div class="result-row__body">' +
          '<span class="badge result-row__type">' + esc(meta.label) + (record._chapter ? " · " + esc(chapterLabel(record._chapter)) : "") + "</span>" +
          '<h3 class="platform-card__title result-row__title">' + esc(record._title) + "</h3>" +
          (record._subtitle ? '<p class="platform-card__meta">' + esc(record._subtitle) + "</p>" : "") +
          (record._body ? '<p class="result-row__text">' + esc(record._body) + "</p>" : "") +
        "</div>" +
        '<div class="platform-card__actions">' +
          '<a class="mini-btn" href="' + esc(meta.page) + '">Open hub</a>' +
          '<button class="mini-btn' + (isSaved(record._key) ? " is-active" : "") + '" type="button" data-platform-action="save" data-record-key="' + esc(record._key) + '">' + (isSaved(record._key) ? "Saved" : "Save") + "</button>" +
        "</div>" +
      "</article>"
    );
  }

  function emptyHTML(message) {
    return '<div class="empty-soft"><p>' + esc(message || "Nothing to show yet.") + "</p></div>";
  }

  function renderCards(el, records, emptyMessage) {
    if (!el) return;
    if (!records.length) {
      el.innerHTML = emptyHTML(emptyMessage);
      return;
    }
    el.innerHTML = records.map(cardHTML).join("");
  }

  function renderRows(el, records, emptyMessage) {
    if (!el) return;
    if (!records.length) {
      el.innerHTML = emptyHTML(emptyMessage);
      return;
    }
    el.innerHTML = records.map(rowHTML).join("");
  }

  function renderStats(el, data) {
    if (!el) return;
    var stats = [
      ["Members", (data.byType.profile || []).length],
      ["Opportunities", (data.byType.job || []).length + (data.byType.help || []).length + (data.byType.collab || []).length],
      ["Events", (data.byType.event || []).length],
      ["Resources", (data.byType.resource || []).length]
    ];
    el.innerHTML = stats.map(function (stat) {
      return '<div class="stat-card"><p class="stat-card__num">' + stat[1] + '</p><p class="stat-card__label">' + esc(stat[0]) + "</p></div>";
    }).join("");
  }

  function renderActivity(el, items, limit) {
    if (!el) return;
    var list = items.slice(0, limit || items.length);
    if (!list.length) {
      el.innerHTML = emptyHTML("No action-oriented activity yet.");
      return;
    }
    el.innerHTML = list.map(function (item) {
      return (
        '<div class="activity-feed__item">' +
          '<span class="activity-feed__dot"></span>' +
          '<p class="activity-feed__text"><strong>' + esc(item.label) + ":</strong> " + esc(item.text) + (item.chapter ? ' <span>' + esc(chapterLabel(item.chapter)) + "</span>" : "") + "</p>" +
          '<a class="mini-btn" href="' + esc(item.page) + '">Act</a>' +
        "</div>"
      );
    }).join("");
  }

  function fillChapterSelect(select, includeAll) {
    if (!select) return;
    var html = includeAll ? '<option value="">All chapters</option>' : "";
    html += CHAPTERS.map(function (chapter) {
      return '<option value="' + esc(chapter.id) + '">' + esc(chapter.label) + "</option>";
    }).join("");
    html += '<option value="virtual">Virtual / remote</option>';
    select.innerHTML = html;
  }

  function fillTypeSelect(select, includeAll) {
    if (!select) return;
    var html = includeAll ? '<option value="">All hubs</option>' : "";
    html += CONTENT_TYPES.map(function (type) {
      return '<option value="' + esc(type) + '">' + esc(metaFor(type).plural) + "</option>";
    }).join("");
    select.innerHTML = html;
  }

  function wireIdentity(render) {
    var form = document.getElementById("identityForm");
    var summary = document.getElementById("identitySummary");
    var clearBtn = document.getElementById("clearIdentity");
    var chapterSelect = form && form.elements.chapter;
    fillChapterSelect(chapterSelect, false);

    function update() {
      var identity = getIdentity();
      if (summary) {
        summary.innerHTML = identity
          ? '<div class="identity-summary"><strong>' + esc(identity.name || identity.email) + '</strong><span>' + esc(identity.email) + '</span><span>' + esc(chapterLabel(identity.chapter)) + '</span></div>'
          : '<p class="platform-panel__copy">Create a lightweight member identity on this device to power your dashboard, saves, and match recommendations.</p>';
      }
      if (form && identity) {
        form.elements.name.value = identity.name || "";
        form.elements.email.value = identity.email || "";
        form.elements.chapter.value = identity.chapter || "";
        form.elements.needs.value = identity.needs || "";
        form.elements.offers.value = identity.offers || "";
        form.elements.goals.value = identity.goals || "";
        form.elements.skills.value = identity.skills || "";
      }
      if (render) render();
    }

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var email = form.elements.email.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
        saveIdentity({
          name: form.elements.name.value.trim(),
          email: email,
          chapter: form.elements.chapter.value,
          needs: form.elements.needs.value.trim(),
          offers: form.elements.offers.value.trim(),
          goals: form.elements.goals.value.trim(),
          skills: form.elements.skills.value.trim()
        });
        update();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        clearIdentity();
        if (form) form.reset();
        update();
      });
    }

    update();
  }

  function initDashboard() {
    var dataState = null;
    var searchForm = document.getElementById("dashboardSearchForm");

    wireIdentity(function () {
      if (dataState) render(dataState);
    });

    if (searchForm) {
      searchForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var q = searchForm.elements.q.value.trim();
        window.location.href = "search.html?q=" + encodeURIComponent(q);
      });
    }

    fetchAll(function (data) {
      dataState = data;
      render(data);
    });

    function render(data) {
      var member = currentMember(data.all);
      var nameEl = document.getElementById("dashboardName");
      if (nameEl) nameEl.textContent = member ? member._title : "your network";
      renderStats(document.getElementById("dashboardStats"), data);
      renderCards(document.getElementById("matchGrid"), member ? recommendations(member, data.all, 6) : activityItems(data.all).map(function (item) { return item.record; }).slice(0, 6), "Create your identity to get recommendations.");
      renderActivity(document.getElementById("dashboardActivity"), activityItems(data.all), 8);

      var saved = savedItems();
      var savedRecords = saved.map(function (savedItem) {
        return data.all.filter(function (record) { return record._key === savedItem.key; })[0] || normalizeRecord(savedItem.targetType, {
          id: savedItem.targetId,
          title: savedItem.targetTitle,
          name: savedItem.targetTitle,
          description: "Saved locally. It may not be in the current public index."
        });
      });
      renderCards(document.getElementById("savedGrid"), savedRecords.slice(0, 6), "Saved opportunities will appear here.");

      var identity = getIdentity();
      var mine = identity ? data.all.filter(function (record) {
        return toText(record.ownerKey) === identity.ownerKey || toText(record.email).toLowerCase() === identity.email.toLowerCase();
      }) : [];
      renderCards(document.getElementById("myRecordsGrid"), mine.slice(0, 6), "Posts connected to your email or owner key will appear here.");
    }
  }

  function initSearch() {
    var form = document.getElementById("universalSearchForm");
    var qInput = document.getElementById("universalSearchInput");
    var typeSelect = document.getElementById("hubFilter");
    var chapterSelect = document.getElementById("chapterFilter");
    var resultsEl = document.getElementById("searchResults");
    var metaEl = document.getElementById("searchMeta");
    var params = new URLSearchParams(window.location.search);
    fillTypeSelect(typeSelect, true);
    fillChapterSelect(chapterSelect, true);
    if (qInput) qInput.value = params.get("q") || "";
    if (typeSelect && params.get("type")) typeSelect.value = params.get("type");
    if (chapterSelect && params.get("chapter")) chapterSelect.value = params.get("chapter");

    fetchAll(function (data) {
      function run() {
        var q = qInput ? qInput.value.trim() : "";
        var records = universalSearch(q, data.all, {
          type: typeSelect && typeSelect.value,
          chapter: chapterSelect && chapterSelect.value
        }).slice(0, 80);
        if (metaEl) metaEl.textContent = records.length + (records.length === 1 ? " result" : " results") + (data.isDemo ? " from clearly labeled demo records." : " across the F&B network.");
        renderRows(resultsEl, records, q ? "No current records match that search." : "No records are available yet.");
      }
      if (form) form.addEventListener("submit", function (e) { e.preventDefault(); run(); });
      if (qInput) qInput.addEventListener("input", run);
      if (typeSelect) typeSelect.addEventListener("change", run);
      if (chapterSelect) chapterSelect.addEventListener("change", run);
      run();
    });
  }

  function conciergeResults(query, records) {
    var results = universalSearch(query, records, {}).slice(0, 18);
    var groups = {};
    results.forEach(function (record) {
      if (!groups[record._type]) groups[record._type] = [];
      groups[record._type].push(record);
    });
    return groups;
  }

  function initConcierge() {
    var form = document.getElementById("conciergeForm");
    var input = document.getElementById("conciergeQuestion");
    var output = document.getElementById("conciergeResults");
    var examples = document.getElementById("conciergeExamples");
    var dataState = null;

    fetchAll(function (data) {
      dataState = data;
      if (output) output.innerHTML = emptyHTML("Ask for people, events, resources, jobs, help, collaborators, mentors, or funding signals.");
    });

    if (examples) {
      examples.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-question]");
        if (!btn || !input) return;
        input.value = btn.getAttribute("data-question");
        if (form) form.dispatchEvent(new Event("submit"));
      });
    }

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!dataState || !input || !output) return;
        var query = input.value.trim();
        if (!query) return;
        var groups = conciergeResults(query, dataState.all);
        rememberPageRecords(dataState.all);
        var html = '<div class="notice"><p>Ask F&B only uses current platform records. Funding results are discovery signals, not investment, legal, tax, or financial advice. Do your own diligence before outreach or fundraising decisions.</p></div>';
        var any = false;
        CONTENT_TYPES.forEach(function (type) {
          var list = (groups[type] || []).slice(0, 4);
          if (!list.length) return;
          any = true;
          html += '<section class="platform-section"><div class="platform-section__head"><div><h2 class="platform-section__title">' + esc(metaFor(type).plural) + '</h2><p class="platform-section__desc">Relevant records from the current F&B index.</p></div></div><div class="platform-grid platform-grid--two">' + list.map(cardHTML).join("") + "</div></section>";
        });
        output.innerHTML = any ? html : html + emptyHTML("No current F&B records match that request yet. Try a broader ask or add seed templates for this chapter.");
        postRecord("conciergeRequest", {
          question: query,
          email: (getIdentity() || {}).email || "",
          status: "Open",
          matchedTypes: Object.keys(groups).join(", ")
        });
      });
    }
  }

  function initChapters() {
    var cardsEl = document.getElementById("chapterCards");
    var detailEl = document.getElementById("chapterDetail");
    var selected = "dc";
    var dataState = null;

    if (cardsEl) {
      cardsEl.innerHTML = CHAPTERS.map(function (chapter) {
        return '<button type="button" class="chapter-card' + (chapter.id === selected ? " is-active" : "") + '" data-chapter="' + esc(chapter.id) + '"><p class="chapter-card__city">' + esc(chapter.label) + '</p><p class="chapter-card__status">' + esc(chapter.status) + '</p><p class="chapter-card__copy">' + esc(chapter.focus) + "</p></button>";
      }).join("");
      cardsEl.addEventListener("click", function (e) {
        var card = e.target.closest("[data-chapter]");
        if (!card) return;
        selected = card.getAttribute("data-chapter");
        Array.prototype.forEach.call(cardsEl.querySelectorAll(".chapter-card"), function (el) {
          el.classList.toggle("is-active", el.getAttribute("data-chapter") === selected);
        });
        if (dataState) render();
      });
    }

    fetchAll(function (data) {
      dataState = data;
      render();
    });

    function render() {
      if (!detailEl || !dataState) return;
      var chapter = CHAPTERS.filter(function (c) { return c.id === selected; })[0];
      var records = dataState.all.filter(function (record) { return record._chapter === selected; });
      rememberPageRecords(records);
      var feed = activityItems(records);
      detailEl.innerHTML =
        '<div class="platform-section__head"><div><h2 class="platform-section__title">' + esc(chapter.label) + '</h2><p class="platform-section__desc">' + esc(chapter.focus) + '</p></div><a class="btn btn--secondary" href="search.html?chapter=' + encodeURIComponent(selected) + '">Search this chapter</a></div>' +
        '<div class="stat-grid">' +
          '<div class="stat-card"><p class="stat-card__num">' + records.filter(function (r) { return r._type === "profile"; }).length + '</p><p class="stat-card__label">Members</p></div>' +
          '<div class="stat-card"><p class="stat-card__num">' + records.filter(function (r) { return r._type === "event"; }).length + '</p><p class="stat-card__label">Events</p></div>' +
          '<div class="stat-card"><p class="stat-card__num">' + records.filter(function (r) { return r._type === "help" || r._type === "job" || r._type === "collab"; }).length + '</p><p class="stat-card__label">Open asks</p></div>' +
          '<div class="stat-card"><p class="stat-card__num">' + records.filter(function (r) { return r._type === "mentor" || r._type === "investor"; }).length + '</p><p class="stat-card__label">Guides</p></div>' +
        "</div>" +
        '<div class="platform-section" style="margin-top:18px"><div class="platform-section__head"><div><h3 class="platform-section__title">Chapter activity</h3><p class="platform-section__desc">Every item points to something a member can do.</p></div></div><div class="activity-feed">' +
        (feed.length ? feed.slice(0, 8).map(function (item) {
          return '<div class="activity-feed__item"><span class="activity-feed__dot"></span><p class="activity-feed__text"><strong>' + esc(item.label) + ':</strong> ' + esc(item.text) + '</p><a class="mini-btn" href="' + esc(item.page) + '">Act</a></div>';
        }).join("") : emptyHTML("No chapter records yet.")) +
        "</div></div>" +
        '<div class="platform-grid platform-grid--two" style="margin-top:18px">' + records.slice(0, 6).map(cardHTML).join("") + "</div>";
    }
  }

  function initActivity() {
    var typeSelect = document.getElementById("activityTypeFilter");
    var chapterSelect = document.getElementById("activityChapterFilter");
    var feedEl = document.getElementById("activityFeed");
    fillTypeSelect(typeSelect, true);
    fillChapterSelect(chapterSelect, true);
    fetchAll(function (data) {
      function render() {
        renderActivity(feedEl, activityItems(data.all, {
          type: typeSelect && typeSelect.value,
          chapter: chapterSelect && chapterSelect.value
        }), 80);
      }
      if (typeSelect) typeSelect.addEventListener("change", render);
      if (chapterSelect) chapterSelect.addEventListener("change", render);
      render();
    });
  }

  function initNetwork() {
    var statsEl = document.getElementById("networkStats");
    var canvasEl = document.getElementById("networkCanvas");
    var edgesEl = document.getElementById("networkEdges");
    fetchAll(function (data) {
      var graph = buildGraph(data.all);
      if (statsEl) renderStats(statsEl, data);
      if (canvasEl) {
        canvasEl.innerHTML = graph.nodes.map(function (node) {
          return '<div class="graph-node graph-node--' + esc(node.kind || "type") + '" style="left:' + node.x + '%;top:' + node.y + '%">' + esc(node.label) + (node.count != null ? "<br>" + node.count : "") + "</div>";
        }).join("");
      }
      if (edgesEl) {
        edgesEl.innerHTML = graph.edges.map(function (edge) {
          return '<div class="edge-item"><strong>' + esc(edge.source) + " " + esc(edge.relationship) + " " + esc(edge.target) + '</strong><p>' + esc(edge.basis || "Derived from current record fields.") + "</p></div>";
        }).join("");
      }
    });
  }

  function initAdmin() {
    var adminTokenInput = document.getElementById("adminTokenInput");
    var adminTokenSave = document.getElementById("adminTokenSave");
    var adminTokenClear = document.getElementById("adminTokenClear");
    var adminAuthStatus = document.getElementById("adminAuthStatus");
    var supabaseAdminAuth = document.getElementById("supabaseAdminAuth");
    var supabaseAdminEmail = document.getElementById("supabaseAdminEmail");
    var supabaseAdminPassword = document.getElementById("supabaseAdminPassword");
    var supabaseAdminSignIn = document.getElementById("supabaseAdminSignIn");
    var supabaseAdminSignOut = document.getElementById("supabaseAdminSignOut");
    var sourceEl = document.getElementById("eventSourceQueue");
    var sourceReviewForm = document.getElementById("eventSourceReviewForm");
    var sourceReviewSummary = document.getElementById("eventSourceReviewSummary");
    var sourceReviewStatus = document.getElementById("eventSourceReviewStatus");
    var sourceReviewSubmit = document.getElementById("eventSourceReviewSubmit");
    var importForm = document.getElementById("eventImportForm");
    var importSourceSelect = document.getElementById("eventImportSourceSelect");
    var importDefaultCity = document.getElementById("eventImportDefaultCity");
    var importDefaultCategory = document.getElementById("eventImportDefaultCategory");
    var importEmail = document.getElementById("eventImportEmail");
    var importHost = document.getElementById("eventImportHost");
    var importIcalUrl = document.getElementById("eventImportIcalUrl");
    var importRawData = document.getElementById("eventImportRawData");
    var importPreview = document.getElementById("eventImportPreview");
    var importStatus = document.getElementById("eventImportStatus");
    var importFetchIcalBtn = document.getElementById("eventImportFetchIcalBtn");
    var importClearBtn = document.getElementById("eventImportClearBtn");
    var cleanupDays = document.getElementById("eventCleanupDays");
    var cleanupAdminEmail = document.getElementById("eventCleanupAdminEmail");
    var cleanupRefreshBtn = document.getElementById("eventCleanupRefreshBtn");
    var cleanupArchiveBtn = document.getElementById("eventCleanupArchiveBtn");
    var cleanupList = document.getElementById("eventCleanupList");
    var cleanupStatus = document.getElementById("eventCleanupStatus");
    var providerGuides = document.getElementById("eventProviderGuides");
    var providerForm = document.getElementById("eventProviderForm");
    var providerSourceSelect = document.getElementById("eventProviderSourceSelect");
    var providerSelect = document.getElementById("eventProviderSelect");
    var providerConnectorStatus = document.getElementById("eventProviderConnectorStatus");
    var providerOauthStatus = document.getElementById("eventProviderOauthStatus");
    var providerAccountId = document.getElementById("eventProviderAccountId");
    var providerCalendarId = document.getElementById("eventProviderCalendarId");
    var providerOrganizationId = document.getElementById("eventProviderOrganizationId");
    var providerEndpoint = document.getElementById("eventProviderEndpoint");
    var providerScope = document.getElementById("eventProviderScope");
    var providerAdminEmail = document.getElementById("eventProviderAdminEmail");
    var providerNotes = document.getElementById("eventProviderNotes");
    var providerSubmit = document.getElementById("eventProviderSubmit");
    var providerStatus = document.getElementById("eventProviderStatus");
    var reportEl = document.getElementById("reportQueue");
    var pendingEl = document.getElementById("pendingQueue");
    var actionForm = document.getElementById("adminActionForm");
    var eventSources = [];
    var adminActions = [];
    var existingEvents = [];
    var cleanupCandidates = [];
    var importableSources = [];
    var selectedEventSource = null;
    var importDrafts = [];

    setReviewFormEnabled(sourceReviewForm, false);
    renderProviderGuides(providerGuides);
    initAdminAuth();
    loadAdminData();

    function sayAdminAuth(message) {
      if (adminAuthStatus) adminAuthStatus.textContent = message || "";
    }

    function initAdminAuth() {
      if (adminTokenInput) adminTokenInput.value = getAdminToken();
      if (adminTokenInput && hasDataBackend) adminTokenInput.placeholder = "Paste Supabase access token";
      if (supabaseAdminAuth) supabaseAdminAuth.hidden = !hasDataBackend;
      sayAdminAuth(hasBackend
        ? (getAdminToken() ? "Admin access saved on this device." : "Admin access required for private queues and admin writes.")
        : "Demo mode. Admin access is not required locally.");
      if (adminTokenSave) {
        adminTokenSave.addEventListener("click", function () {
          saveAdminToken(adminTokenInput && adminTokenInput.value.trim() || "");
          sayAdminAuth(getAdminToken() ? "Admin access saved on this device." : "Paste an admin credential before saving.");
          loadAdminData();
        });
      }
      if (supabaseAdminSignIn) {
        supabaseAdminSignIn.addEventListener("click", function () {
          if (!DATA || !DATA.signInWithPassword) return;
          var email = supabaseAdminEmail && supabaseAdminEmail.value.trim();
          var password = supabaseAdminPassword && supabaseAdminPassword.value;
          if (!email || !password) {
            sayAdminAuth("Enter the Supabase admin email and password.");
            return;
          }
          supabaseAdminSignIn.disabled = true;
          supabaseAdminSignIn.textContent = "Signing in...";
          DATA.signInWithPassword(email, password).then(function () {
            if (adminTokenInput) adminTokenInput.value = getAdminToken();
            if (supabaseAdminPassword) supabaseAdminPassword.value = "";
            sayAdminAuth("Supabase admin access saved on this device.");
            supabaseAdminSignIn.disabled = false;
            supabaseAdminSignIn.textContent = "Sign in";
            loadAdminData();
          }).catch(function () {
            sayAdminAuth("Could not sign in. Check the Supabase admin user and fb_admins row.");
            supabaseAdminSignIn.disabled = false;
            supabaseAdminSignIn.textContent = "Sign in";
          });
        });
      }
      if (supabaseAdminSignOut) {
        supabaseAdminSignOut.addEventListener("click", function () {
          clearAdminToken();
          if (adminTokenInput) adminTokenInput.value = "";
          if (supabaseAdminPassword) supabaseAdminPassword.value = "";
          sayAdminAuth("Supabase admin access cleared from this device.");
          loadAdminData();
        });
      }
      if (adminTokenClear) {
        adminTokenClear.addEventListener("click", function () {
          clearAdminToken();
          if (adminTokenInput) adminTokenInput.value = "";
          sayAdminAuth("Admin access cleared from this device.");
          loadAdminData();
        });
      }
    }

    function renderLockedAdmin() {
      selectedEventSource = null;
      setReviewFormEnabled(sourceReviewForm, false);
      renderSelectedEventSource(null, sourceReviewSummary);
      if (sourceReviewSubmit) sourceReviewSubmit.disabled = true;
      renderEventSourceQueue(sourceEl, [], null);
      renderCards(reportEl, [], "Sign in or save admin access to load private reports.");
      renderCards(pendingEl, [], "Sign in or save admin access to load pending records.");
      populateEventImportSources(importSourceSelect, [], []);
      populateEventProviderSources(providerSourceSelect, []);
      existingEvents = [];
      cleanupCandidates = [];
      renderEventCleanup(cleanupList, []);
      if (sourceEl) sourceEl.innerHTML = emptyHTML("Sign in or save admin access to load event source requests.");
      if (importStatus) importStatus.textContent = "Admin access required before importing external events.";
    }

    function refreshCleanup() {
      cleanupCandidates = expiredEventCandidates(existingEvents, cleanupDays && cleanupDays.value || 7);
      renderEventCleanup(cleanupList, cleanupCandidates);
      if (cleanupStatus) cleanupStatus.textContent = cleanupCandidates.length
        ? cleanupCandidates.length + " expired event" + (cleanupCandidates.length === 1 ? "" : "s") + " ready for review."
        : "No expired events match this cleanup window.";
    }

    function loadAdminData() {
      var adminToken = getAdminToken();
      if (hasBackend && !adminToken) {
        renderLockedAdmin();
        return;
      }
      fetchAll({
        types: CONTENT_TYPES.concat(["eventSource", "report", "account", "savedItem", "adminAction", "conciergeRequest"]),
        adminToken: adminToken
      }, function (data) {
        var privateReadFailed = hasBackend && (data.errors || []).some(function (entry) {
          return ["eventSource", "report", "account", "savedItem", "adminAction", "conciergeRequest"].indexOf(entry.type) !== -1;
        });
        if (privateReadFailed) {
          sayAdminAuth("Could not load private admin queues. Check the token configured in Apps Script.");
          selectedEventSource = null;
          setReviewFormEnabled(sourceReviewForm, false);
          renderSelectedEventSource(null, sourceReviewSummary);
          if (sourceReviewSubmit) sourceReviewSubmit.disabled = true;
          data.byType.eventSource = [];
          data.byType.report = [];
          data.byType.account = [];
          data.byType.savedItem = [];
          data.byType.adminAction = [];
          data.byType.conciergeRequest = [];
          data.all = (data.byType.event || []).slice();
        }
        eventSources = data.byType.eventSource || [];
        adminActions = data.byType.adminAction || [];
        existingEvents = data.byType.event || [];
        importableSources = populateEventImportSources(importSourceSelect, eventSources, adminActions);
        populateEventProviderSources(providerSourceSelect, eventSources);
        renderEventSourceQueue(sourceEl, eventSources, selectedEventSource && selectedEventSource._key);
        renderCards(reportEl, data.byType.report || [], "No reports have been submitted.");
        var pending = data.all.filter(function (record) {
          return ["pending review", "flagged"].indexOf(moderationValue(record)) !== -1;
        });
        renderCards(pendingEl, pending, "No records are currently marked pending review or flagged.");
        refreshCleanup();
      });
    }

    if (sourceEl) {
      sourceEl.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-admin-source-select]");
        if (!btn) return;
        var key = btn.getAttribute("data-record-key");
        selectedEventSource = eventSources.filter(function (record) {
          return record._key === key;
        })[0] || null;
        if (!selectedEventSource) return;
        renderEventSourceQueue(sourceEl, eventSources, selectedEventSource._key);
        selectEventSourceForReview(selectedEventSource, sourceReviewForm, sourceReviewSummary, sourceReviewSubmit);
        if (sourceReviewStatus) sourceReviewStatus.textContent = "";
      });
    }

    if (sourceReviewForm) {
      sourceReviewForm.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!selectedEventSource) {
          if (sourceReviewStatus) sourceReviewStatus.textContent = "Select an event source before recording a review.";
          return;
        }
        var formData = {};
        Array.prototype.forEach.call(sourceReviewForm.elements, function (el) {
          if (!el.name) return;
          formData[el.name] = el.value.trim();
        });
        formData.targetType = "eventSource";
        formData.targetId = selectedEventSource._id;
        formData.targetTitle = selectedEventSource._title;
        formData.sourcePlatform = selectedEventSource.platform || formData.sourcePlatform;
        formData.sourceUrl = selectedEventSource.sourceUrl || formData.sourceUrl;
        formData.feedUrl = selectedEventSource.feedUrl || formData.feedUrl;
        formData.organizerEmail = selectedEventSource.organizerEmail || formData.organizerEmail;
        if (sourceReviewSubmit) {
          sourceReviewSubmit.disabled = true;
          sourceReviewSubmit.textContent = "Recording...";
        }
        postAdminRecord("adminAction", formData, sourceReviewStatus).then(function () {
          if (sourceReviewStatus) sourceReviewStatus.textContent = "Source review sent to Admin Actions.";
          var localAction = {};
          Object.keys(formData).forEach(function (key) { localAction[key] = formData[key]; });
          localAction.timestamp = new Date().toISOString();
          adminActions.unshift(normalizeRecord("adminAction", localAction));
          importableSources = populateEventImportSources(importSourceSelect, eventSources, adminActions);
          if (sourceReviewSubmit) {
            sourceReviewSubmit.disabled = false;
            sourceReviewSubmit.textContent = "Record source review";
          }
        }).catch(function () {
          if (sourceReviewStatus) sourceReviewStatus.textContent = "Could not record this source review. Try again.";
          if (sourceReviewSubmit) {
            sourceReviewSubmit.disabled = false;
            sourceReviewSubmit.textContent = "Record source review";
          }
        });
      });
    }

    function selectedImportSource() {
      var key = importSourceSelect && importSourceSelect.value;
      return importableSources.filter(function (source) {
        return source._key === key;
      })[0] || null;
    }

    function sayImport(message) {
      if (importStatus) importStatus.textContent = message || "";
    }

    if (importSourceSelect) {
      importSourceSelect.addEventListener("change", function () {
        var source = selectedImportSource();
        if (importEmail && source && !importEmail.value) importEmail.value = source.organizerEmail || "";
        if (importHost && source && !importHost.value) importHost.value = source.sourceName || "";
        if (importIcalUrl && source && !importIcalUrl.value) importIcalUrl.value = source.feedUrl || source.sourceUrl || "";
        sayImport(source ? "Source selected. Paste event data or fetch a public iCal feed to preview imports." : "");
      });
    }

    if (importFetchIcalBtn) {
      importFetchIcalBtn.addEventListener("click", function () {
        var source = selectedImportSource();
        if (!source) {
          sayImport("Select an approved event source before fetching a feed.");
          return;
        }
        var url = importIcalUrl && importIcalUrl.value.trim() || source.feedUrl || source.sourceUrl || "";
        if (!url) {
          sayImport("Add a public iCal feed URL before fetching.");
          return;
        }
        importFetchIcalBtn.disabled = true;
        importFetchIcalBtn.textContent = "Fetching...";
        fetchPublicIcalFeed(url, importStatus).then(function (res) {
          if (importRawData) importRawData.value = res.content || "";
          if (importForm) importForm.dispatchEvent(new Event("submit"));
          sayImport(res.demo
            ? "Demo iCal loaded. Review the sample event before publishing."
            : "Feed fetched. Review parsed events before publishing.");
          importFetchIcalBtn.disabled = false;
          importFetchIcalBtn.textContent = "Fetch iCal feed";
        }).catch(function (err) {
          sayImport(err && err.message || "Could not fetch that iCal feed.");
          importFetchIcalBtn.disabled = false;
          importFetchIcalBtn.textContent = "Fetch iCal feed";
        });
      });
    }

    if (importForm) {
      importForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var source = selectedImportSource();
        if (!source) {
          sayImport("Select an approved event source before importing.");
          return;
        }
        var raw = importRawData && importRawData.value;
        if (!raw || !raw.trim()) {
          sayImport("Paste iCal, JSON, CSV, or structured event text before previewing.");
          return;
        }
        var defaults = {
          city: importDefaultCity && importDefaultCity.value,
          category: importDefaultCategory && importDefaultCategory.value,
          email: importEmail && importEmail.value,
          host: importHost && importHost.value
        };
        importDrafts = annotateEventDrafts(parseEventImportInput(raw, source, defaults), existingEvents);
        renderEventImportPreview(importPreview, importDrafts);
        var duplicateCount = importDrafts.filter(function (event) { return !!event._duplicate; }).length;
        sayImport(importDrafts.length
          ? importDrafts.length + " event" + (importDrafts.length === 1 ? "" : "s") + " parsed. " + duplicateCount + " possible duplicate" + (duplicateCount === 1 ? "" : "s") + " unchecked."
          : "No events could be parsed. Try iCal VEVENT data, JSON, CSV headers, or labeled event blocks.");
      });
    }

    if (importClearBtn) {
      importClearBtn.addEventListener("click", function () {
        importDrafts = [];
        if (importRawData) importRawData.value = "";
        renderEventImportPreview(importPreview, importDrafts);
        sayImport("");
      });
    }

    if (importPreview) {
      importPreview.addEventListener("click", function (e) {
        var publishBtn = e.target.closest("[data-event-import-publish]");
        if (!publishBtn) return;
        var source = selectedImportSource();
        if (!source) {
          sayImport("Select an approved event source before publishing.");
          return;
        }
        var selected = collectEventImportPreview(importPreview).filter(function (event) {
          return event._include;
        }).map(function (event) {
          return prepareEventForPost(event, source);
        });
        if (!selected.length) {
          sayImport("Select at least one event to publish.");
          return;
        }
        var invalid = selected.filter(function (event) {
          return !event.title || !event.date || !event.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(event.email);
        });
        if (invalid.length) {
          sayImport("Each selected event needs a title, date, and valid contact email before publishing.");
          return;
        }
        var selectedDuplicates = selected.map(function (event) {
          return eventDuplicateInfo(event, existingEvents);
        }).filter(Boolean);
        if (selectedDuplicates.length) {
          sayImport(selectedDuplicates.length + " selected event" + (selectedDuplicates.length === 1 ? "" : "s") + " appear to already exist. Uncheck duplicates before publishing.");
          return;
        }
        publishBtn.disabled = true;
        publishBtn.textContent = "Publishing...";
        selected.reduce(function (chain, event) {
          return chain.then(function () { return postAdminRecord("event", event, importStatus); });
        }, Promise.resolve()).then(function () {
          return postAdminRecord("adminAction", {
            targetType: "eventSource",
            targetId: source._id,
            targetTitle: source._title,
            action: "Imported events from source",
            notes: "Published " + selected.length + " selected event(s) to the public Events tab.",
            sourcePlatform: source.platform || "",
            sourceUrl: source.sourceUrl || "",
            feedUrl: source.feedUrl || "",
            organizerEmail: source.organizerEmail || "",
            importCount: String(selected.length),
            duplicateCount: String(importDrafts.filter(function (event) { return !!event._duplicate; }).length)
          }, importStatus);
        }).then(function () {
          existingEvents = selected.map(function (event) {
            event.id = event.id || "local-import-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
            return normalizeRecord("event", event);
          }).concat(existingEvents);
          sayImport("Published " + selected.length + " event" + (selected.length === 1 ? "" : "s") + " to the public calendar.");
          refreshCleanup();
          publishBtn.disabled = false;
          publishBtn.textContent = "Publish selected";
        }).catch(function () {
          sayImport("Could not publish the selected events. Check admin access and try again.");
          publishBtn.disabled = false;
          publishBtn.textContent = "Publish selected";
        });
      });
    }

    if (cleanupRefreshBtn) {
      cleanupRefreshBtn.addEventListener("click", refreshCleanup);
    }

    if (cleanupArchiveBtn) {
      cleanupArchiveBtn.addEventListener("click", function () {
        var selected = collectCleanupSelection(cleanupList, cleanupCandidates);
        if (!selected.length) {
          if (cleanupStatus) cleanupStatus.textContent = "Select at least one expired event to archive.";
          return;
        }
        cleanupArchiveBtn.disabled = true;
        cleanupArchiveBtn.textContent = "Archiving...";
        var now = new Date().toISOString();
        selected.reduce(function (chain, event) {
          return chain.then(function () {
            return postAdminUpdateRecord("event", event._id || event.id, {
              moderationStatus: "Archived",
              importStatus: "Archived",
              lastUpdated: now
            }, cleanupStatus);
          });
        }, Promise.resolve()).then(function () {
          return postAdminRecord("adminAction", {
            targetType: "event",
            targetId: selected.map(function (event) { return event._id || event.id; }).join(", "),
            targetTitle: "Expired event cleanup",
            action: "Archived expired events",
            notes: "Archived " + selected.length + " expired event(s) from the public calendar.",
            adminEmail: cleanupAdminEmail && cleanupAdminEmail.value.trim() || "",
            archivedCount: String(selected.length)
          }, cleanupStatus);
        }).then(function () {
          var selectedIds = {};
          selected.forEach(function (event) { selectedIds[event._id || event.id] = true; });
          existingEvents.forEach(function (event) {
            if (selectedIds[event._id || event.id]) {
              event.moderationStatus = "Archived";
              event.importStatus = "Archived";
            }
          });
          refreshCleanup();
          if (cleanupStatus) cleanupStatus.textContent = "Archived " + selected.length + " expired event" + (selected.length === 1 ? "" : "s") + ".";
          cleanupArchiveBtn.disabled = false;
          cleanupArchiveBtn.textContent = "Archive selected";
        }).catch(function () {
          if (cleanupStatus) cleanupStatus.textContent = "Could not archive events. Check admin access and try again.";
          cleanupArchiveBtn.disabled = false;
          cleanupArchiveBtn.textContent = "Archive selected";
        });
      });
    }

    function selectedProviderSource() {
      var key = providerSourceSelect && providerSourceSelect.value;
      return eventSources.filter(function (source) {
        return source._key === key;
      })[0] || null;
    }

    function providerFields() {
      return {
        providerSelect: providerSelect,
        connectorStatus: providerConnectorStatus,
        oauthStatus: providerOauthStatus,
        accountId: providerAccountId,
        calendarId: providerCalendarId,
        organizationId: providerOrganizationId,
        endpoint: providerEndpoint,
        scope: providerScope,
        notes: providerNotes
      };
    }

    if (providerSourceSelect) {
      providerSourceSelect.addEventListener("change", function () {
        fillProviderFormFromSource(selectedProviderSource(), providerFields());
        if (providerStatus) providerStatus.textContent = selectedProviderSource()
          ? "Source selected. Record connector state after credentials are handled securely."
          : "";
      });
    }

    if (providerSelect) {
      providerSelect.addEventListener("change", function () {
        var guide = providerGuideFor(providerSelect.value);
        if (providerEndpoint && !providerEndpoint.value) providerEndpoint.value = guide.endpoint || "";
        if (providerScope && !providerScope.value) providerScope.value = guide.scope || "";
        if (providerNotes && !providerNotes.value) {
          providerNotes.value = "Provider: " + guide.platform + "\nCredential handling: " + guide.auth + "\nDo not paste tokens or API keys into this form.";
        }
      });
    }

    if (providerForm) {
      providerForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var source = selectedProviderSource();
        if (!source) {
          if (providerStatus) providerStatus.textContent = "Select an event source before recording connector setup.";
          return;
        }
        var provider = providerSelect && providerSelect.value || source.platform || "";
        var now = new Date().toISOString();
        var updates = {
          providerAccountId: providerAccountId && providerAccountId.value.trim() || "",
          providerCalendarId: providerCalendarId && providerCalendarId.value.trim() || "",
          providerOrganizationId: providerOrganizationId && providerOrganizationId.value.trim() || "",
          providerEndpoint: providerEndpoint && providerEndpoint.value.trim() || "",
          providerScope: providerScope && providerScope.value.trim() || "",
          connectorStatus: providerConnectorStatus && providerConnectorStatus.value || "",
          oauthStatus: providerOauthStatus && providerOauthStatus.value || "",
          lastProviderSyncAt: "",
          lastChecked: now,
          providerNotes: providerNotes && providerNotes.value.trim() || "",
          notes: providerNotes && providerNotes.value.trim() || source.notes || ""
        };
        if (updates.connectorStatus === "Active") updates.syncStatus = "Active";
        if (providerSubmit) {
          providerSubmit.disabled = true;
          providerSubmit.textContent = "Recording...";
        }
        postAdminUpdateRecord("eventSource", source._id, updates, providerStatus).then(function () {
          return postAdminRecord("adminAction", {
            targetType: "eventSource",
            targetId: source._id,
            targetTitle: source._title,
            action: "Configured provider connector",
            notes: updates.providerNotes || "Provider connector state recorded.",
            adminEmail: providerAdminEmail && providerAdminEmail.value.trim() || "",
            sourcePlatform: provider,
            sourceUrl: source.sourceUrl || "",
            feedUrl: source.feedUrl || "",
            organizerEmail: source.organizerEmail || "",
            provider: provider,
            providerOperation: updates.connectorStatus || "Connector setup recorded"
          }, providerStatus);
        }).then(function () {
          Object.keys(updates).forEach(function (key) { source[key] = updates[key]; });
          source.platform = source.platform || provider;
          if (providerStatus) providerStatus.textContent = "Connector setup sent. Store or rotate any credentials only in secure backend secrets.";
          if (providerSubmit) {
            providerSubmit.disabled = false;
            providerSubmit.textContent = "Record connector setup";
          }
        }).catch(function () {
          if (providerStatus) providerStatus.textContent = "Could not record connector setup. Check admin access and try again.";
          if (providerSubmit) {
            providerSubmit.disabled = false;
            providerSubmit.textContent = "Record connector setup";
          }
        });
      });
    }

    if (actionForm) {
      actionForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var formData = {};
        Array.prototype.forEach.call(actionForm.elements, function (el) {
          if (el.name) formData[el.name] = el.value.trim();
        });
        postAdminRecord("adminAction", formData, document.getElementById("adminActionStatus")).then(function () {
          actionForm.reset();
          var status = document.getElementById("adminActionStatus");
          if (status) status.textContent = "Action note sent.";
        }).catch(function () {
          var status = document.getElementById("adminActionStatus");
          if (status) status.textContent = "Sign in or save admin access before recording an action.";
        });
      });
    }
  }

  function initReport() {
    var params = new URLSearchParams(window.location.search);
    var form = document.getElementById("reportForm");
    var titleEl = document.getElementById("reportTargetTitle");
    if (titleEl) titleEl.textContent = params.get("title") || "Selected record";
    if (!form) return;
    form.elements.targetType.value = params.get("type") || "";
    form.elements.targetId.value = params.get("id") || "";
    form.elements.targetTitle.value = params.get("title") || "";
    var identity = getIdentity();
    if (identity && form.elements.reporterEmail) form.elements.reporterEmail.value = identity.email;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name) return;
        data[el.name] = el.value.trim();
      });
      if (!data.reason) return;
      data.status = "Open";
      postRecord("report", data).then(function () {
        var status = document.getElementById("reportStatus");
        if (status) status.textContent = "Report submitted. Thank you for helping keep F&B useful.";
        form.reset();
      });
    });
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-platform-action='save']");
    if (!btn) return;
    var key = btn.getAttribute("data-record-key");
    var recordEl = e.target.closest("[data-record-key]");
    var pageRecords = window.__FB_PAGE_RECORDS || [];
    var record = pageRecords.filter(function (item) { return item._key === key; })[0];
    if (!record && recordEl) {
      record = normalizeRecord("resource", {
        id: key,
        title: recordEl.querySelector(".platform-card__title") && recordEl.querySelector(".platform-card__title").textContent
      });
      record._key = key;
    }
    if (!record) return;
    var nowSaved = toggleSaved(record);
    btn.classList.toggle("is-active", nowSaved);
    btn.textContent = nowSaved ? "Saved" : "Save";
  });

  function rememberPageRecords(records) {
    window.__FB_PAGE_RECORDS = records || [];
    return records || [];
  }

  var oldRenderCards = renderCards;
  renderCards = function (el, records, emptyMessage) {
    rememberPageRecords((window.__FB_PAGE_RECORDS || []).concat(records || []));
    oldRenderCards(el, records, emptyMessage);
  };
  var oldRenderRows = renderRows;
  renderRows = function (el, records, emptyMessage) {
    rememberPageRecords((window.__FB_PAGE_RECORDS || []).concat(records || []));
    oldRenderRows(el, records, emptyMessage);
  };

  function boot() {
    var page = document.body && document.body.getAttribute("data-platform-page");
    if (page === "dashboard") initDashboard();
    else if (page === "search") initSearch();
    else if (page === "concierge") initConcierge();
    else if (page === "chapters") initChapters();
    else if (page === "activity") initActivity();
    else if (page === "network") initNetwork();
    else if (page === "admin") initAdmin();
    else if (page === "report") initReport();
  }

  window.FBPlatform = {
    chapters: CHAPTERS,
    contentTypes: CONTENT_TYPES,
    metaFor: metaFor,
    fetchType: fetchType,
    fetchAll: fetchAll,
    postRecord: postRecord,
    getIdentity: getIdentity,
    saveIdentity: saveIdentity,
    clearIdentity: clearIdentity,
    savedItems: savedItems,
    universalSearch: universalSearch,
    recommendations: recommendations,
    activityItems: activityItems,
    buildGraph: buildGraph,
    chapterLabel: chapterLabel,
    normalizeRecord: normalizeRecord,
    cardHTML: cardHTML,
    rowHTML: rowHTML
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
