/* ===== Founders & Builders — Supabase data adapter ===== */
(function () {
  "use strict";

  var CONFIG = window.FB_CONFIG || {};
  var BACKEND = String(CONFIG.DATA_BACKEND || "google-sheets").toLowerCase();
  var SUPABASE_URL = stripSlash(CONFIG.SUPABASE_URL || "");
  var SUPABASE_KEY = CONFIG.SUPABASE_PUBLISHABLE_KEY || CONFIG.SUPABASE_ANON_KEY || "";
  var ACCESS_TOKEN_KEY = "fb_supabase_access_token_v1";

  var TYPE_TABLES = {
    profile: "fb_profiles",
    business: "fb_businesses",
    listing: "fb_listings",
    job: "fb_jobs",
    mentor: "fb_mentors",
    help: "fb_help_requests",
    raise: "fb_raises",
    investor: "fb_investors",
    eventSource: "fb_event_sources",
    event: "fb_events",
    collab: "fb_collaborations",
    podcast: "fb_podcasts",
    resource: "fb_resources",
    account: "fb_accounts",
    savedItem: "fb_saved_items",
    report: "fb_reports",
    adminAction: "fb_admin_actions",
    chapter: "fb_chapters",
    activity: "fb_activity_items",
    graphEdge: "fb_graph_edges",
    conciergeRequest: "fb_concierge_requests",
    seedTemplate: "fb_seed_templates",
    eventImportRun: "fb_event_import_runs",
    eventImportDraft: "fb_event_import_drafts"
  };

  var READ_ORDERS = {
    event: "event_date.asc.nullslast,created_at.desc",
    eventSource: "created_at.desc",
    adminAction: "created_at.desc",
    report: "created_at.desc",
    account: "created_at.desc",
    savedItem: "created_at.desc",
    chapter: "slug.asc",
    activity: "created_at.desc",
    graphEdge: "created_at.desc",
    conciergeRequest: "created_at.desc",
    seedTemplate: "created_at.desc",
    eventImportRun: "created_at.desc",
    eventImportDraft: "created_at.desc"
  };

  var WRITE_ALIASES = {
    event: {
      date: "event_date",
      time: "event_time"
    },
    investor: {
      type: "investor_type"
    }
  };

  var READ_ALIASES = {
    event_date: "date",
    event_time: "time",
    investor_type: "type",
    submitted_at: "timestamp"
  };

  var INTERNAL_FIELDS = {
    adminToken: true,
    adminOperation: true,
    targetId: true,
    _id: true,
    _key: true,
    _type: true,
    _meta: true,
    _title: true,
    _subtitle: true,
    _body: true,
    _tags: true,
    _chapter: true,
    _matchScore: true,
    _draftId: true,
    _include: true,
    _duplicate: true,
    _duplicateMatchId: true,
    _supabaseId: true
  };

  var BOOLEAN_FIELDS = {
    mentor: true,
    investor: true,
    podcast: true,
    speaker: true,
    volunteer: true,
    verified: true,
    remote: true,
    disclaimer_accepted: true,
    permission_confirmed: true,
    attribution_accepted: true,
    review_accepted: true
  };

  var INTEGER_FIELDS = {
    report_count: true,
    last_import_count: true,
    import_count: true,
    duplicate_count: true,
    archived_count: true,
    error_count: true
  };

  var NUMBER_FIELDS = {
    weight: true
  };

  var DATE_FIELDS = {
    event_date: true
  };

  var TIMESTAMP_FIELDS = {
    submitted_at: true,
    expires_at: true,
    last_updated: true,
    last_checked: true,
    last_provider_sync_at: true,
    external_updated_at: true,
    last_seen: true,
    started_at: true,
    finished_at: true
  };

  function stripSlash(value) {
    return String(value || "").replace(/\/+$/, "");
  }

  function isActive() {
    return BACKEND === "supabase" && !!SUPABASE_URL && !!SUPABASE_KEY && !!window.fetch;
  }

  function tableFor(type) {
    var table = TYPE_TABLES[type];
    if (!table) throw new Error("Unknown Supabase type: " + type);
    return table;
  }

  function camelToSnake(value) {
    return String(value || "").replace(/[A-Z]/g, function (letter) {
      return "_" + letter.toLowerCase();
    });
  }

  function snakeToCamel(value) {
    return String(value || "").replace(/_([a-z0-9])/g, function (_, letter) {
      return letter.toUpperCase();
    });
  }

  function cleanValue(value, column) {
    if (value === undefined || value === "") return null;
    if (BOOLEAN_FIELDS[column]) return toBool(value);
    if (INTEGER_FIELDS[column]) return toInteger(value);
    if (NUMBER_FIELDS[column]) return toNumber(value);
    if (DATE_FIELDS[column]) return toDate(value);
    if (TIMESTAMP_FIELDS[column]) return toTimestamp(value);
    return value;
  }

  function toText(value) {
    return String(value == null ? "" : value).trim();
  }

  function toBool(value) {
    if (typeof value === "boolean") return value;
    var normalized = toText(value).toLowerCase();
    return ["yes", "true", "1", "on", "y", "checked", "accepted"].indexOf(normalized) !== -1;
  }

  function toInteger(value) {
    if (value == null || value === "") return null;
    var parsed = parseInt(value, 10);
    return isFinite(parsed) ? parsed : null;
  }

  function toNumber(value) {
    if (value == null || value === "") return null;
    var parsed = Number(value);
    return isFinite(parsed) ? parsed : null;
  }

  function toDate(value) {
    var normalized = toText(value);
    if (!normalized) return null;
    var match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return match[1] + "-" + match[2] + "-" + match[3];
    var parsed = new Date(normalized);
    if (isNaN(parsed.getTime())) return null;
    return parsed.toISOString().slice(0, 10);
  }

  function toTimestamp(value) {
    var normalized = toText(value);
    if (!normalized) return null;
    var parsed = new Date(normalized);
    if (isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
  }

  function authToken(options, data) {
    options = options || {};
    data = data || {};
    return options.adminToken || data.adminToken || getAccessToken() || SUPABASE_KEY;
  }

  function getAccessToken() {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY) || "";
    } catch (err) {
      return "";
    }
  }

  function saveAccessToken(token) {
    try {
      if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
      else localStorage.removeItem(ACCESS_TOKEN_KEY);
      return true;
    } catch (err) {
      return false;
    }
  }

  function headers(options, data, prefer) {
    var token = authToken(options, data);
    var out = {
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + token,
      "Content-Type": "application/json"
    };
    if (prefer) out.Prefer = prefer;
    return out;
  }

  function restUrl(table, params) {
    var url = SUPABASE_URL + "/rest/v1/" + table;
    var search = new URLSearchParams(params || {});
    var query = search.toString();
    return query ? url + "?" + query : url;
  }

  function readParams(type, options) {
    options = options || {};
    var params = { select: "*" };
    var order = options.order || READ_ORDERS[type] || "created_at.desc";
    if (order) params.order = order;
    if (options.limit) params.limit = String(options.limit);
    return params;
  }

  function request(url, init) {
    return fetch(url, init || {}).then(function (response) {
      if (response.ok) {
        if (response.status === 204) return null;
        return response.text().then(function (text) {
          return text ? JSON.parse(text) : null;
        });
      }
      return response.text().then(function (text) {
        var message = text;
        try {
          var parsed = JSON.parse(text);
          message = parsed.message || parsed.error || text;
        } catch (err) {}
        throw new Error(message || "Supabase request failed with status " + response.status);
      });
    });
  }

  function fetchType(type, options, cb) {
    if (typeof options === "function") {
      cb = options;
      options = {};
    }
    options = options || {};
    if (!isActive()) {
      if (cb) cb(null, options.sample || [], true);
      return Promise.resolve(options.sample || []);
    }

    var table = tableFor(type);
    var promise = request(restUrl(table, readParams(type, options)), {
      method: "GET",
      headers: headers(options)
    }).then(function (rows) {
      return (rows || []).map(function (row) {
        return fromSupabase(type, row);
      });
    });

    if (cb) {
      promise.then(function (rows) {
        cb(null, rows, false);
      }).catch(function (err) {
        cb(err, options.sample || [], true);
      });
    }
    return promise;
  }

  function fetchAll(options, cb) {
    if (typeof options === "function") {
      cb = options;
      options = {};
    }
    options = options || {};
    var types = options.types || Object.keys(TYPE_TABLES);
    var byType = {};
    var all = [];
    var errors = [];
    var usedDemo = false;
    var pending = types.length;

    if (!pending) {
      if (cb) cb({ all: all, byType: byType, errors: errors, isDemo: !isActive() });
      return Promise.resolve({ all: all, byType: byType, errors: errors, isDemo: !isActive() });
    }

    return new Promise(function (resolve) {
      types.forEach(function (type) {
        fetchType(type, options, function (err, list, demo) {
          if (err) errors.push({ type: type, error: err });
          if (demo) usedDemo = true;
          byType[type] = list || [];
          all = all.concat(byType[type]);
          pending -= 1;
          if (!pending) {
            var payload = { all: all, byType: byType, errors: errors, isDemo: usedDemo };
            if (cb) cb(payload);
            resolve(payload);
          }
        });
      });
    });
  }

  function postRecord(type, data, options) {
    data = data || {};
    options = options || {};
    if (!isActive()) return Promise.resolve({ ok: true, demo: true });
    if (data.adminOperation === "updateRecord") return updateRecord(type, data.targetId, data, options);

    var table = tableFor(type);
    var row = toSupabase(type, data);
    return request(restUrl(table), {
      method: "POST",
      headers: headers(options, data, "return=minimal"),
      body: JSON.stringify(row)
    }).then(function () {
      return { ok: true };
    });
  }

  function updateRecord(type, targetId, updates, options) {
    options = options || {};
    if (!targetId) return Promise.reject(new Error("Missing target ID for Supabase update."));
    var table = tableFor(type);
    var row = toSupabase(type, updates || {});
    var filterColumn = looksLikeUuid(targetId) ? "id" : "legacy_sheet_id";
    var params = {};
    params[filterColumn] = "eq." + targetId;
    return request(restUrl(table, params), {
      method: "PATCH",
      headers: headers(options, updates, "return=minimal"),
      body: JSON.stringify(row)
    }).then(function () {
      return { ok: true };
    });
  }

  function fetchPublicIcalFeed(url) {
    if (!isActive()) return Promise.reject(new Error("Supabase is not the active backend."));
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error("Could not fetch that public iCal feed.");
      return response.text();
    }).then(function (content) {
      return { ok: true, content: content };
    }).catch(function () {
      throw new Error("Could not fetch that iCal feed directly. Paste the exported iCal text, or add a Supabase Edge Function proxy for feeds that block browser requests.");
    });
  }

  function signInWithPassword(email, password) {
    if (!isActive()) return Promise.reject(new Error("Supabase is not the active backend."));
    return request(SUPABASE_URL + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: headers({}, {}, null),
      body: JSON.stringify({ email: email, password: password })
    }).then(function (session) {
      if (session && session.access_token) saveAccessToken(session.access_token);
      return session;
    });
  }

  function signOut() {
    saveAccessToken("");
    return Promise.resolve({ ok: true });
  }

  function toSupabase(type, data) {
    var aliases = WRITE_ALIASES[type] || {};
    var row = {};
    var raw = {};
    Object.keys(data || {}).forEach(function (key) {
      if (key === "adminToken") return;
      raw[key] = data[key];
      if (key === "type" && type !== "investor") return;
      if (INTERNAL_FIELDS[key]) return;
      var column = aliases[key] || camelToSnake(key);
      row[column] = cleanValue(data[key], column);
    });
    if (data.id && !looksLikeUuid(data.id) && !row.legacy_sheet_id) row.legacy_sheet_id = String(data.id);
    if (data.timestamp && !row.submitted_at) row.submitted_at = cleanValue(data.timestamp, "submitted_at");
    row.raw_data = raw;
    return stripEmpty(row);
  }

  function fromSupabase(type, row) {
    row = row || {};
    var out = {};
    if (row.raw_data && typeof row.raw_data === "object" && !Array.isArray(row.raw_data)) {
      Object.keys(row.raw_data).forEach(function (key) {
        if (key !== "adminToken") out[key] = row.raw_data[key];
      });
    }
    Object.keys(row).forEach(function (column) {
      if (column === "raw_data") return;
      var key = READ_ALIASES[column] || snakeToCamel(column);
      out[key] = row[column];
    });
    out.supabaseId = row.id || "";
    out._supabaseId = row.id || "";
    out.legacySheetId = row.legacy_sheet_id || "";
    out.id = row.legacy_sheet_id || row.id || out.id;
    if (type === "event") {
      out.date = row.event_date || out.date || "";
      out.time = row.event_time || out.time || "";
    }
    if (type === "investor") out.type = row.investor_type || out.type || "";
    if (row.submitted_at) out.timestamp = row.submitted_at;
    return out;
  }

  function stripEmpty(row) {
    Object.keys(row).forEach(function (key) {
      if (row[key] === undefined) delete row[key];
    });
    return row;
  }

  function looksLikeUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
  }

  window.FBData = {
    backend: BACKEND,
    isActive: isActive,
    tableFor: tableFor,
    fetchType: fetchType,
    fetchAll: fetchAll,
    postRecord: postRecord,
    updateRecord: updateRecord,
    fetchPublicIcalFeed: fetchPublicIcalFeed,
    signInWithPassword: signInWithPassword,
    signOut: signOut,
    getAccessToken: getAccessToken,
    saveAccessToken: saveAccessToken,
    toSupabase: toSupabase,
    fromSupabase: fromSupabase
  };
})();
