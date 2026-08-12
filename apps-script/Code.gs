/**
 * Founders & Builders — platform backend
 * Google Apps Script Web App that uses a Google Sheet as the datastore.
 * One deployment serves every hub (Profiles, Businesses, …), routed by
 * a `type` query/body param. Omitting `type` defaults to "profile" so
 * existing calls from the Member Profiles hub keep working unchanged.
 *
 * SETUP (one time):
 *   1. Open your Google Sheet.
 *   2. Extensions → Apps Script. Delete any code, paste ALL of this file.
 *   3. Click Deploy → New deployment → type "Web app".
 *        - Execute as: Me
 *        - Who has access: Anyone
 *   4. Copy the Web app URL (ends in /exec).
 *   5. Paste that URL into config.js (used by every hub).
 *
 * Each sheet tab and its header row are created automatically on first use.
 * To re-deploy after editing: Deploy → Manage deployments → Edit → Version: New.
 * (Existing deployment URLs stay the same after a new version.)
 */

// type -> { sheet name, column order, fields required to accept a submission,
// enums (allowed values for fields backed by a fixed <select> on the front end) }
//
// Field type conventions used across every entity below (see apps-script/SCHEMA.md
// for the full reference):
//   id         - server-generated, 8-char UUID slice
//   timestamp  - server-generated, ISO 8601 string
//   email      - string, validated as an email format client-side
//   *link/website/linkedin/x/instagram/github/portfolio - URL string (protocol
//              optional, normalized client-side)
//   boolean-ish fields (mentor/investor/podcast/speaker/volunteer/hiring/remote)
//              - stored as the string "Yes" or ""
//   comma-list fields (skills/products/services/stages/industries/expertise/topics)
//              - a single comma-separated string, split into tags client-side
//   `location` - a free-text city/region string (used on individual profile/job
//              style entities)
//   `city`     - a value from the platform's defined chapter list (used on
//              event/collab/podcast entities); see the `city` enum on `event`
var PUBLIC_RECORD_HEADERS = [
  'ownerKey', 'accountEmail', 'chapter', 'moderationStatus', 'verified',
  'reportCount', 'expiresAt', 'lastUpdated'
];

var ENTITIES = {
  profile: {
    sheetName: 'Profiles',
    headers: [
      'id', 'timestamp', 'name', 'building', 'business', 'stage', 'products',
      'skills', 'industry', 'location', 'email', 'website', 'linkedin', 'github',
      'x', 'portfolio', 'bio', 'goals', 'lookingFor', 'canHelp',
      'mentor', 'investor', 'podcast', 'speaker', 'volunteer'
    ],
    extraHeaders: ['needs', 'offers'],
    required: ['name', 'email'],
    enums: {
      stage: ['Idea', 'Pre-launch', 'MVP / Beta', 'Early revenue', 'Growth', 'Scaling', 'Established']
    }
  },
  business: {
    sheetName: 'Businesses',
    headers: [
      'id', 'timestamp', 'name', 'category', 'logo', 'description', 'website',
      'industry', 'team', 'products', 'services', 'hiring', 'email',
      'linkedin', 'x', 'instagram'
    ],
    required: ['name', 'email'],
    enums: {
      category: ['Startup', 'Small business', 'Agency', 'Nonprofit', 'Freelancer', 'Service provider', 'Product', 'Software', 'Physical product'],
      hiring: ['Hiring now', 'Not currently hiring', 'Open to great people']
    }
  },
  listing: {
    sheetName: 'Listings',
    headers: [
      'id', 'timestamp', 'name', 'category', 'description', 'pricing',
      'image', 'demo', 'website', 'email'
    ],
    required: ['name', 'email'],
    enums: {
      category: ['Software', 'SaaS', 'AI tools', 'Marketing services', 'Consulting', 'Graphic design', 'Web development', 'Manufacturing', 'Coaching', 'Courses', 'Templates', 'Books', 'Physical products']
    }
  },
  job: {
    sheetName: 'Jobs',
    headers: [
      'id', 'timestamp', 'title', 'company', 'category', 'location', 'remote',
      'compensation', 'description', 'applyLink', 'email'
    ],
    required: ['title', 'email'],
    enums: {
      category: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Volunteer', 'Fractional', 'Apprenticeship', 'Co-founder', 'Advisory board']
    }
  },
  mentor: {
    sheetName: 'Mentors',
    headers: [
      'id', 'timestamp', 'name', 'title', 'company', 'industry', 'expertise',
      'stages', 'experience', 'availability', 'officeHours', 'bio', 'email',
      'linkedin', 'website'
    ],
    required: ['name', 'email']
  },
  help: {
    sheetName: 'Help',
    headers: [
      'id', 'timestamp', 'name', 'title', 'category', 'urgency',
      'description', 'email', 'linkedin'
    ],
    required: ['title', 'email'],
    enums: {
      category: ['Technical co-founder', 'Beta testers', 'Intro / connection', 'Legal', 'Sales / customers', 'Feedback on MVP', 'Design', 'Marketing', 'Funding', 'Other'],
      urgency: ['ASAP', 'This month', 'No rush']
    }
  },
  raise: {
    sheetName: 'Raises',
    headers: [
      'id', 'timestamp', 'company', 'founder', 'stage', 'industry',
      'amountSeeking', 'raisedSoFar', 'useOfFunds', 'description', 'email',
      'website', 'linkedin'
    ],
    extraHeaders: ['disclaimerAccepted'],
    required: ['company', 'email'],
    enums: {
      stage: ['Idea', 'Pre-seed', 'Seed', 'Series A', 'Series B+', 'Bridge / Note']
    }
  },
  investor: {
    sheetName: 'Investors',
    headers: [
      'id', 'timestamp', 'name', 'firm', 'type', 'checkSize', 'stages',
      'industries', 'thesis', 'email', 'website', 'linkedin'
    ],
    extraHeaders: ['disclaimerAccepted'],
    required: ['name', 'email'],
    enums: {
      type: ['Angel', 'VC Fund', 'Family Office', 'Syndicate', 'Corporate VC', 'Accelerator']
    }
  },
  event: {
    sheetName: 'Events',
    headers: [
      'id', 'timestamp', 'title', 'host', 'category', 'city', 'date', 'time',
      'location', 'description', 'rsvpLink', 'email'
    ],
    extraHeaders: [
      'sourcePlatform', 'sourceName', 'sourceUrl', 'sourceEventId',
      'importStatus', 'importedFromSourceId', 'externalUpdatedAt'
    ],
    required: ['title', 'email'],
    enums: {
      category: ['Workshop', 'Meetup', 'AMA', 'Demo Day', 'Pitch Competition', 'Office Hours', 'Hack Night', 'Panel', 'Other'],
      city: ['Boise, ID', 'Atlanta, GA', 'Washington, DC', 'Madison, AL', 'Virtual', 'Other']
    }
  },
  eventSource: {
    sheetName: 'Event Sources',
    headers: [
      'id', 'timestamp', 'sourceName', 'organizerEmail', 'contactName',
      'platform', 'authMethod', 'chapter', 'sourceUrl', 'feedUrl',
      'importMode', 'cadence', 'fitNotes', 'permissionConfirmed',
      'attributionAccepted', 'reviewAccepted', 'syncStatus', 'approvalStatus',
      'secretStatus', 'lastChecked', 'lastImportCount', 'nextStep', 'notes'
    ],
    required: [
      'sourceName', 'organizerEmail', 'platform', 'authMethod',
      'permissionConfirmed', 'attributionAccepted', 'reviewAccepted'
    ],
    public: false,
    enums: {
      platform: ['Luma', 'Meetup', 'Eventbrite', 'Partiful', 'Google Calendar', 'iCal feed', 'Other website', 'Other'],
      authMethod: ['Public calendar/feed URL', 'Public organizer/event URL', 'OAuth setup request', 'API key setup request', 'Manual review only'],
      importMode: ['Curated review', 'Auto-sync when supported', 'Manual submission'],
      cadence: ['Occasional', 'Weekly', 'Monthly', 'Quarterly', 'Unknown'],
      syncStatus: ['Requested', 'Needs secure setup', 'Pending review', 'Active', 'Paused', 'Rejected', 'Error'],
      approvalStatus: ['Pending review', 'Approved', 'Rejected', 'Paused'],
      secretStatus: ['Not collected - admin follow-up required', 'No secret required', 'Stored in Script Properties', 'Revoked']
    },
    defaults: {
      importMode: 'Curated review',
      syncStatus: 'Pending review',
      approvalStatus: 'Pending review',
      secretStatus: 'No secret required'
    }
  },
  collab: {
    sheetName: 'Collabs',
    headers: [
      'id', 'timestamp', 'title', 'name', 'category', 'format', 'city',
      'description', 'email', 'linkedin'
    ],
    required: ['title', 'email'],
    enums: {
      category: ['Event', 'Workshop', 'AMA', 'Meetup', 'Cross-promotion', 'Podcast episode', 'Project', 'Other']
    }
  },
  podcast: {
    sheetName: 'Podcasts',
    headers: [
      'id', 'timestamp', 'showName', 'host', 'topics', 'format', 'lookingFor',
      'city', 'description', 'listenLink', 'email', 'linkedin'
    ],
    required: ['showName', 'email'],
    enums: {
      format: ['Interview', 'Solo', 'Co-hosted', 'Panel'],
      lookingFor: ['Guests', 'Co-host', 'Sponsors', 'Not right now']
    }
  },
  resource: {
    sheetName: 'Resources',
    headers: [
      'id', 'timestamp', 'title', 'category', 'description', 'link',
      'submittedBy', 'email'
    ],
    required: ['title', 'link'],
    enums: {
      category: ['Template', 'Playbook', 'AI Prompt', 'Startup Guide', 'Grant Database', 'Accelerator Database', 'Checklist', 'SOP', 'Software / Tool', 'Other']
    }
  },
  account: {
    sheetName: 'Accounts',
    headers: [
      'id', 'timestamp', 'ownerKey', 'name', 'email', 'chapter', 'location',
      'needs', 'offers', 'goals', 'skills', 'lastSeen', 'moderationStatus'
    ],
    required: ['email'],
    public: false,
    defaults: { moderationStatus: 'Active' }
  },
  savedItem: {
    sheetName: 'Saved Items',
    headers: [
      'id', 'timestamp', 'ownerKey', 'accountEmail', 'targetType', 'targetId',
      'targetTitle', 'notes'
    ],
    required: ['targetType', 'targetId'],
    public: false
  },
  report: {
    sheetName: 'Reports',
    headers: [
      'id', 'timestamp', 'targetType', 'targetId', 'targetTitle', 'reason',
      'details', 'reporterEmail', 'status'
    ],
    required: ['reason'],
    public: false,
    enums: {
      reason: ['Spam', 'Duplicate', 'Outdated', 'Inaccurate', 'Safety concern', 'Funding or investor concern', 'Other'],
      status: ['Open', 'Reviewing', 'Resolved', 'Dismissed']
    },
    defaults: { status: 'Open' }
  },
  adminAction: {
    sheetName: 'Admin Actions',
    headers: [
      'id', 'timestamp', 'targetType', 'targetId', 'targetTitle', 'action',
      'notes', 'adminEmail'
    ],
    required: ['action'],
    public: false,
    enums: {
      action: ['Reviewed', 'Verified', 'Needs follow-up', 'Marked duplicate', 'Hidden in Sheet', 'Rejected in Sheet']
    }
  },
  chapter: {
    sheetName: 'Chapters',
    headers: [
      'id', 'timestamp', 'name', 'city', 'slug', 'status', 'focus', 'leadName',
      'leadEmail', 'notes'
    ],
    required: ['name'],
    public: false,
    enums: {
      status: ['Launch chapter', 'Pilot', 'Planning', 'Paused']
    }
  },
  activity: {
    sheetName: 'Activity',
    headers: [
      'id', 'timestamp', 'title', 'summary', 'targetType', 'targetId', 'chapter',
      'actionLabel', 'actionUrl', 'status'
    ],
    required: ['title'],
    public: false,
    defaults: { status: 'Active' }
  },
  graphEdge: {
    sheetName: 'Graph Edges',
    headers: [
      'id', 'timestamp', 'sourceType', 'sourceId', 'sourceTitle',
      'relationship', 'targetType', 'targetId', 'targetTitle', 'basis', 'weight'
    ],
    required: ['sourceTitle', 'relationship', 'targetTitle'],
    public: false
  },
  conciergeRequest: {
    sheetName: 'Concierge Requests',
    headers: [
      'id', 'timestamp', 'question', 'email', 'context', 'matchedTypes', 'status',
      'notes'
    ],
    required: ['question'],
    public: false,
    defaults: { status: 'Open' }
  },
  seedTemplate: {
    sheetName: 'Seed Templates',
    headers: [
      'id', 'timestamp', 'title', 'targetType', 'sourcePolicy', 'templateUrl',
      'permissionStatus', 'moderationStatus', 'notes'
    ],
    required: ['title', 'targetType'],
    public: false,
    defaults: { permissionStatus: 'Template only', moderationStatus: 'Needs review' }
  }
};

function entityFor_(type) {
  var entity = ENTITIES[type || 'profile'];
  if (!entity) throw new Error('Unknown type: ' + type);
  return entity;
}

function headersFor_(entity) {
  var headers = [];
  function add(list) {
    (list || []).forEach(function (key) {
      if (headers.indexOf(key) === -1) headers.push(key);
    });
  }
  add(entity.headers);
  add(entity.extraHeaders);
  if (entity.public !== false) add(PUBLIC_RECORD_HEADERS);
  return headers;
}

function getSheet_(entity) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(entity.sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(entity.sheetName);
  }
  var expected = headersFor_(entity);
  var lastColumn = Math.max(sheet.getLastColumn(), expected.length);
  var firstRow = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  if (firstRow.join('') === '' || firstRow[0] !== 'id') {
    sheet.getRange(1, 1, 1, expected.length).setValues([expected]);
    sheet.setFrozenRows(1);
  } else {
    var current = firstRow.map(function (key) { return String(key || ''); });
    while (current.length && current[current.length - 1] === '') current.pop();
    expected.forEach(function (key) {
      if (current.indexOf(key) === -1) current.push(key);
    });
    if (current.join('|') !== firstRow.slice(0, current.length).join('|')) {
      sheet.getRange(1, 1, 1, current.length).setValues([current]);
    }
  }
  return sheet;
}

function headerFor_(sheet, entity) {
  var lastColumn = Math.max(sheet.getLastColumn(), headersFor_(entity).length);
  var header = sheet.getRange(1, 1, 1, lastColumn).getValues()[0]
    .map(function (key) { return String(key || ''); });
  while (header.length && header[header.length - 1] === '') header.pop();
  return header.length ? header : headersFor_(entity);
}

function eventSourceSecretKey_(sourceId, secretType) {
  if (!sourceId || !secretType) throw new Error('sourceId and secretType are required');
  var safeSource = String(sourceId).replace(/[^A-Za-z0-9_-]/g, '_');
  var safeType = String(secretType).replace(/[^A-Za-z0-9_-]/g, '_').toUpperCase();
  return 'EVENT_SOURCE_SECRET_' + safeSource + '_' + safeType;
}

/**
 * Manual admin helper for OAuth/API event-source credentials.
 *
 * Do not send tokens or API keys through public forms or store them in sheet rows.
 * Run this from the Apps Script editor after an organizer has explicitly approved
 * access, then mark that Event Sources row's secretStatus as "Stored in Script
 * Properties" and syncStatus as appropriate.
 */
function setEventSourceSecret(sourceId, secretType, secretValue) {
  if (!secretValue) throw new Error('secretValue is required');
  PropertiesService.getScriptProperties()
    .setProperty(eventSourceSecretKey_(sourceId, secretType), String(secretValue));
  return { ok: true, key: eventSourceSecretKey_(sourceId, secretType) };
}

function deleteEventSourceSecret(sourceId, secretType) {
  PropertiesService.getScriptProperties()
    .deleteProperty(eventSourceSecretKey_(sourceId, secretType));
  return { ok: true, key: eventSourceSecretKey_(sourceId, secretType) };
}

/** Read: returns all records for the requested type as JSON (supports ?callback= for JSONP). */
function doGet(e) {
  var out;
  try {
    var entity = entityFor_(e && e.parameter && e.parameter.type);
    var sheet = getSheet_(entity);
    var values = sheet.getDataRange().getValues();
    var header = values.shift() || headersFor_(entity);
    var records = values
      .filter(function (row) { return String(row[0]).length > 0; })
      .map(function (row) {
        var obj = {};
        header.forEach(function (key, i) { obj[key] = row[i]; });
        return obj;
      })
      .reverse(); // newest first
    out = { ok: true, count: records.length, profiles: records, records: records };
  } catch (err) {
    out = { ok: false, error: String(err) };
  }
  return respond_(out, e);
}

/** Write: appends a new record row for the requested type. */
function doPost(e) {
  var out;
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var type = data.type || (e && e.parameter && e.parameter.type);
    var entity = entityFor_(type);

    // Honeypot: bots fill hidden fields. Silently accept, don't store.
    if (data.company_website) {
      return respond_({ ok: true }, e);
    }

    var missing = entity.required.filter(function (key) { return !data[key]; });
    if (missing.length) {
      return respond_({ ok: false, error: 'Required: ' + missing.join(', ') }, e);
    }

    // Enum validation: only checks fields that are both present in the
    // submission and have a fixed set of allowed values. Empty/omitted
    // optional fields are always fine.
    var invalid = Object.keys(entity.enums || {}).filter(function (key) {
      return data[key] && entity.enums[key].indexOf(data[key]) === -1;
    });
    if (invalid.length) {
      return respond_({ ok: false, error: 'Invalid value for: ' + invalid.join(', ') }, e);
    }

    var sheet = getSheet_(entity);
    var header = headerFor_(sheet, entity);
    var id = Utilities.getUuid().slice(0, 8);
    var now = new Date().toISOString();
    var row = header.map(function (key) {
      if (key === 'id') return id;
      if (key === 'timestamp') return now;
      if (key === 'lastUpdated') return data[key] || now;
      if (data[key] != null) return data[key];
      if (entity.defaults && entity.defaults[key] != null) return entity.defaults[key];
      if (entity.public !== false && key === 'moderationStatus') return 'Active';
      if (entity.public !== false && key === 'reportCount') return '0';
      return '';
    });
    sheet.appendRow(row);

    out = { ok: true, id: id };
  } catch (err) {
    out = { ok: false, error: String(err) };
  }
  return respond_(out, e);
}

/** Serialize as JSON or JSONP depending on ?callback=. */
function respond_(obj, e) {
  var json = JSON.stringify(obj);
  var callback = e && e.parameter && e.parameter.callback;
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
