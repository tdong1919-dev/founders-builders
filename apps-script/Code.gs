/**
 * Founders & Builders — platform backend
 * Google Apps Script Web App that uses a Google Sheet as the datastore.
 * Anonymous access serves public directories and one-way intake only. Private
 * accounts and administrative operations require a separate authenticated backend.
 * Public requests are routed by
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
    extraHeaders: [
      'recommendedApprovalStatus', 'recommendedSyncStatus',
      'recommendedSecretStatus', 'importPlan', 'sourcePlatform', 'sourceUrl',
      'feedUrl', 'organizerEmail', 'importCount'
    ],
    required: ['action'],
    public: false,
    enums: {
      action: [
        'Reviewed', 'Verified', 'Needs follow-up', 'Marked duplicate',
        'Hidden in Sheet', 'Rejected in Sheet', 'Event source approved',
        'Event source rejected', 'Event source paused',
        'Event source needs secure setup', 'Event source ready for manual import',
        'Imported events from source'
      ],
      recommendedApprovalStatus: ['Pending review', 'Approved', 'Rejected', 'Paused'],
      recommendedSyncStatus: ['Requested', 'Needs secure setup', 'Pending review', 'Active', 'Paused', 'Rejected', 'Error'],
      recommendedSecretStatus: ['Not collected - admin follow-up required', 'No secret required', 'Stored in Script Properties', 'Revoked'],
      importPlan: ['No import yet', 'Manual import approved', 'Curated review only', 'Auto-sync when supported', 'Needs organizer follow-up']
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

// Explicit anonymous surfaces: a new entity or column is private until allowed here.
var PUBLIC_FORM_FIELDS = {
  profile: 'name building business stage products skills industry location email website linkedin github x portfolio bio goals lookingFor canHelp mentor investor podcast speaker volunteer needs offers'.split(' '),
  business: 'name category logo description website industry team products services hiring email linkedin x instagram'.split(' '),
  listing: 'name category description pricing image demo website email'.split(' '),
  job: 'title company category location remote compensation description applyLink email'.split(' '),
  mentor: 'name title company industry expertise stages experience availability officeHours bio email linkedin website'.split(' '),
  help: 'name title category urgency description email linkedin'.split(' '),
  raise: 'company founder stage industry amountSeeking raisedSoFar useOfFunds description email website linkedin disclaimerAccepted'.split(' '),
  investor: 'name firm type checkSize stages industries thesis email website linkedin disclaimerAccepted'.split(' '),
  event: 'title host category city date time location description rsvpLink email sourcePlatform sourceName sourceUrl sourceEventId externalUpdatedAt'.split(' '),
  collab: 'title name category format city description email linkedin'.split(' '),
  podcast: 'showName host topics format lookingFor city description listenLink email linkedin'.split(' '),
  resource: 'title category description link submittedBy email'.split(' ')
};
// These forms may append a private request, but can never read requests or admin notes.
var PRIVATE_INTAKE_FIELDS = {
  report: 'targetType targetId targetTitle reason details reporterEmail'.split(' '),
  eventSource: 'sourceName organizerEmail contactName platform authMethod chapter sourceUrl feedUrl importMode cadence fitNotes permissionConfirmed attributionAccepted reviewAccepted'.split(' '),
  conciergeRequest: 'question email context matchedTypes'.split(' ')
};
var PUBLIC_READ_METADATA = ['id', 'timestamp', 'chapter', 'moderationStatus', 'verified', 'expiresAt', 'lastUpdated'];
var PUBLIC_STATUSES = ['', 'active', 'approved', 'public', 'published', 'open'];

function requestError_(message) { var err = new Error(message); err.publicMessage = message; return err; }
function hasOwn_(object, key) { return Object.prototype.hasOwnProperty.call(object, key); }
function entityFor_(type) {
  var key = type || 'profile';
  if (typeof key !== 'string' || !hasOwn_(ENTITIES, key)) throw requestError_('Unsupported record type.');
  return ENTITIES[key];
}
function validCallback_(e) {
  var callback = e && e.parameter && e.parameter.callback;
  return callback == null || callback === '' || (typeof callback === 'string' && /^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(callback));
}
function isPublicRow_(record) {
  var visibility = String(record.visibility == null ? '' : record.visibility).trim().toLowerCase();
  if (visibility && visibility !== 'public') return false;
  if (record.isPublic != null && record.isPublic !== '' && ['true', 'yes', '1'].indexOf(String(record.isPublic).trim().toLowerCase()) === -1) return false;
  return !['status', 'moderationStatus'].some(function (key) {
    return PUBLIC_STATUSES.indexOf(String(record[key] == null ? '' : record[key]).trim().toLowerCase()) === -1;
  });
}
function publicFields_(type) {
  return PUBLIC_READ_METADATA.concat(PUBLIC_FORM_FIELDS[type].filter(function (key) { return key !== 'disclaimerAccepted'; }), ['chapter']);
}
function submission_(type, raw, fields) {
  var data = {};
  fields.forEach(function (key) {
    var value = hasOwn_(raw, key) ? raw[key] : undefined;
    // Keep routing `type` separate from an investor's classification.
    if (type === 'investor' && key === 'type') value = raw.investorType != null ? raw.investorType : raw.type === 'investor' ? '' : raw.type;
    if (value == null) return;
    if (['string', 'number', 'boolean'].indexOf(typeof value) === -1 || String(value).length > 20000) throw requestError_('Invalid submission field.');
    data[key] = String(value).trim();
  });
  ['email', 'organizerEmail', 'reporterEmail'].forEach(function (key) {
    if (data[key] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data[key])) throw requestError_('Enter a valid email address.');
  });
  return data;
}
function sheetText_(value) {
  var text = String(value == null ? '' : value);
  // Public submissions are literal text, never executable spreadsheet formulas.
  return /^[=+\-@]/.test(text) ? "'" + text : text;
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

/** Anonymous read: public entities, visible rows and explicitly allowed fields only. */
function doGet(e) {
  var out;
  try {
    if (!validCallback_(e)) throw requestError_('Invalid callback.');
    var type = e && e.parameter && e.parameter.type || 'profile';
    var entity = entityFor_(type);
    if (entity.public === false || !hasOwn_(PUBLIC_FORM_FIELDS, type)) throw requestError_('Private records require authenticated access.');
    var sheet = getSheet_(entity);
    var values = sheet.getDataRange().getValues();
    var header = values.shift() || headersFor_(entity);
    var allowed = publicFields_(type);
    var records = values.filter(function (row) { return row[0] != null && String(row[0]).length > 0; }).map(function (row) {
      var raw = Object.create(null);
      header.forEach(function (key, i) { raw[key] = row[i]; });
      if (!isPublicRow_(raw)) return null;
      var record = {};
      allowed.forEach(function (key) { if (hasOwn_(raw, key)) record[key] = raw[key]; });
      return record;
    }).filter(function (record) { return record !== null; }).reverse();
    out = { ok: true, count: records.length, profiles: records, records: records };
  } catch (err) {
    out = { ok: false, error: err && err.publicMessage || 'Unable to read public records.' };
  }
  return respond_(out, e);
}

/** Anonymous append: public listings or explicitly allowed one-way private intake. */
function doPost(e) {
  var out;
  try {
    if (!validCallback_(e)) throw requestError_('Invalid callback.');
    var raw = {};
    if (e && e.postData && e.postData.contents) {
      if (e.postData.contents.length > 100000) throw requestError_('Submission is too large.');
      try { raw = JSON.parse(e.postData.contents); } catch (parseError) { throw requestError_('Invalid submission.'); }
    } else if (e && e.parameter) raw = e.parameter;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw requestError_('Invalid submission.');
    var type = e && e.parameter && e.parameter.type || raw.type || 'profile';
    var entity = entityFor_(type);
    var publicType = entity.public !== false && hasOwn_(PUBLIC_FORM_FIELDS, type);
    var fields = publicType ? PUBLIC_FORM_FIELDS[type].concat(['chapter']) : hasOwn_(PRIVATE_INTAKE_FIELDS, type) ? PRIVATE_INTAKE_FIELDS[type] : null;
    if (!fields) throw requestError_('Private operations require authenticated access.');
    if (publicType && !isPublicRow_(raw)) throw requestError_('This endpoint accepts public listings only.');
    if (raw.company_website) return respond_({ ok: true }, e);
    var data = submission_(type, raw, fields);
    var missing = entity.required.filter(function (key) { return !data[key]; });
    if (missing.length) return respond_({ ok: false, error: 'Required: ' + missing.join(', ') }, e);
    var invalid = Object.keys(entity.enums || {}).filter(function (key) { return data[key] && entity.enums[key].indexOf(data[key]) === -1; });
    if (invalid.length) return respond_({ ok: false, error: 'Invalid value for: ' + invalid.join(', ') }, e);
    if (type === 'eventSource' && ['permissionConfirmed', 'attributionAccepted', 'reviewAccepted'].some(function (key) { return ['yes', 'true', '1', 'on'].indexOf(String(data[key]).toLowerCase()) === -1; })) throw requestError_('Confirm the event-source permissions.');
    var sheet = getSheet_(entity);
    var header = headerFor_(sheet, entity);
    var id = Utilities.getUuid().slice(0, 8);
    var now = new Date().toISOString();
    var row = header.map(function (key) {
      if (key === 'id') return id;
      if (key === 'timestamp' || (publicType && key === 'lastUpdated')) return now;
      if (publicType && key === 'moderationStatus') return 'Active';
      if (publicType && key === 'reportCount') return '0';
      if (entity.defaults && hasOwn_(entity.defaults, key)) return entity.defaults[key];
      return fields.indexOf(key) !== -1 && data[key] != null ? sheetText_(data[key]) : '';
    });
    sheet.appendRow(row);
    out = { ok: true, id: id };
  } catch (err) {
    out = { ok: false, error: err && err.publicMessage || 'Unable to save this submission.' };
  }
  return respond_(out, e);
}

/** Serialize as JSON or JSONP depending on ?callback=. */
function respond_(obj, e) {
  if (!validCallback_(e)) return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Invalid callback.' })).setMimeType(ContentService.MimeType.JSON);
  var json = JSON.stringify(obj).replace(/[<\u2028\u2029]/g, function (c) { return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4); });
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
