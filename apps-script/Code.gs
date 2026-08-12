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

var ADMIN_TOKEN_PROPERTY = 'FB_ADMIN_TOKEN';
var ADMIN_WRITE_TYPES = {
  adminAction: true,
  chapter: true,
  activity: true,
  graphEdge: true,
  seedTemplate: true
};
var ADMIN_UPDATE_FIELDS = [
  'moderationStatus', 'verified', 'reportCount', 'expiresAt', 'lastUpdated',
  'syncStatus', 'approvalStatus', 'secretStatus', 'lastChecked',
  'lastImportCount', 'nextStep', 'notes', 'connectorStatus', 'oauthStatus',
  'lastProviderSyncAt', 'providerNotes', 'providerAccountId',
  'providerCalendarId', 'providerOrganizationId', 'providerEndpoint',
  'providerScope', 'importStatus', 'externalUpdatedAt'
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
    extraHeaders: [
      'providerAccountId', 'providerCalendarId', 'providerOrganizationId',
      'providerEndpoint', 'providerScope', 'oauthStatus', 'connectorStatus',
      'lastProviderSyncAt', 'providerNotes'
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
      'feedUrl', 'organizerEmail', 'importCount', 'adminOperation',
      'duplicateCount', 'archivedCount', 'provider', 'providerOperation'
    ],
    required: ['action'],
    public: false,
    enums: {
      action: [
        'Reviewed', 'Verified', 'Needs follow-up', 'Marked duplicate',
        'Hidden in Sheet', 'Rejected in Sheet', 'Event source approved',
        'Event source rejected', 'Event source paused',
        'Event source needs secure setup', 'Event source ready for manual import',
        'Imported events from source', 'Archived expired events',
        'Configured provider connector'
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

function configuredAdminToken_() {
  return PropertiesService.getScriptProperties().getProperty(ADMIN_TOKEN_PROPERTY) || '';
}

function requestAdminToken_(data, e) {
  return String(
    data && data.adminToken ||
    e && e.parameter && e.parameter.adminToken ||
    ''
  );
}

function requireAdmin_(data, e) {
  var expected = configuredAdminToken_();
  if (!expected) {
    throw new Error('Admin token is not configured. Run setAdminToken(token) in Apps Script.');
  }
  if (requestAdminToken_(data, e) !== expected) {
    throw new Error('Admin token required.');
  }
}

function setAdminToken(token) {
  token = String(token || '').trim();
  if (token.length < 24) throw new Error('Use an admin token with at least 24 characters.');
  PropertiesService.getScriptProperties().setProperty(ADMIN_TOKEN_PROPERTY, token);
  return { ok: true, property: ADMIN_TOKEN_PROPERTY };
}

function clearAdminToken() {
  PropertiesService.getScriptProperties().deleteProperty(ADMIN_TOKEN_PROPERTY);
  return { ok: true, property: ADMIN_TOKEN_PROPERTY };
}

function isAdminWrite_(type, data) {
  if (data && data.adminOperation) return true;
  if (ADMIN_WRITE_TYPES[type]) return true;
  if (type === 'event') {
    return !!(
      data.sourcePlatform ||
      data.sourceName ||
      data.sourceUrl ||
      data.sourceEventId ||
      data.importedFromSourceId ||
      data.importStatus ||
      data.externalUpdatedAt
    );
  }
  return false;
}

function safeCallback_(callback) {
  callback = String(callback || '');
  if (!/^[A-Za-z_$][0-9A-Za-z_$]*(?:\.[A-Za-z_$][0-9A-Za-z_$]*)*$/.test(callback)) {
    throw new Error('Invalid callback');
  }
  return callback;
}

function eventSourceSecretKey_(sourceId, secretType) {
  if (!sourceId || !secretType) throw new Error('sourceId and secretType are required');
  var safeSource = String(sourceId).replace(/[^A-Za-z0-9_-]/g, '_');
  var safeType = String(secretType).replace(/[^A-Za-z0-9_-]/g, '_').toUpperCase();
  return 'EVENT_SOURCE_SECRET_' + safeSource + '_' + safeType;
}

function eventSourceProviderSecretKey_(sourceId, provider, secretType) {
  if (!sourceId || !provider || !secretType) {
    throw new Error('sourceId, provider, and secretType are required');
  }
  var safeSource = String(sourceId).replace(/[^A-Za-z0-9_-]/g, '_');
  var safeProvider = String(provider).replace(/[^A-Za-z0-9_-]/g, '_').toUpperCase();
  var safeType = String(secretType).replace(/[^A-Za-z0-9_-]/g, '_').toUpperCase();
  return 'EVENT_SOURCE_' + safeProvider + '_' + safeSource + '_' + safeType;
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

function setEventSourceProviderCredential(sourceId, provider, secretType, secretValue) {
  if (!secretValue) throw new Error('secretValue is required');
  var key = eventSourceProviderSecretKey_(sourceId, provider, secretType);
  PropertiesService.getScriptProperties().setProperty(key, String(secretValue));
  return { ok: true, key: key };
}

function deleteEventSourceProviderCredential(sourceId, provider, secretType) {
  var key = eventSourceProviderSecretKey_(sourceId, provider, secretType);
  PropertiesService.getScriptProperties().deleteProperty(key);
  return { ok: true, key: key };
}

function isPrivateIpv4_(host) {
  var parts = String(host || '').split('.');
  if (parts.length !== 4) return false;
  var nums = parts.map(function (part) { return Number(part); });
  if (nums.some(function (num) { return isNaN(num) || num < 0 || num > 255; })) return false;
  return nums[0] === 10 ||
    nums[0] === 127 ||
    (nums[0] === 169 && nums[1] === 254) ||
    (nums[0] === 172 && nums[1] >= 16 && nums[1] <= 31) ||
    (nums[0] === 192 && nums[1] === 168) ||
    nums[0] === 0;
}

function validatePublicFetchUrl_(url) {
  url = String(url || '').trim();
  if (!/^https?:\/\//i.test(url)) throw new Error('Only http(s) feed URLs are supported.');
  var match = url.match(/^https?:\/\/([^\/?#:]+)(?::\d+)?/i);
  if (!match) throw new Error('Invalid feed URL.');
  var host = match[1].toLowerCase();
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host.indexOf('127.') === 0 ||
    host.slice(-6) === '.local' ||
    isPrivateIpv4_(host)
  ) {
    throw new Error('Private or local feed URLs are not allowed.');
  }
  return url;
}

function fetchPublicIcal_(url) {
  url = validatePublicFetchUrl_(url);
  var response = UrlFetchApp.fetch(url, {
    followRedirects: true,
    muteHttpExceptions: true,
    headers: {
      Accept: 'text/calendar,text/plain,application/octet-stream,*/*'
    }
  });
  var code = response.getResponseCode();
  if (code < 200 || code >= 400) {
    throw new Error('Feed request failed with status ' + code);
  }
  var content = response.getContentText() || '';
  if (content.length > 750000) content = content.slice(0, 750000);
  return {
    ok: true,
    sourceUrl: url,
    fetchedAt: new Date().toISOString(),
    content: content
  };
}

function parseUpdates_(data) {
  var raw = data.updates;
  var updates = {};
  if (raw) {
    if (typeof raw === 'string') raw = JSON.parse(raw);
    Object.keys(raw || {}).forEach(function (key) {
      if (ADMIN_UPDATE_FIELDS.indexOf(key) !== -1) updates[key] = raw[key];
    });
  }
  ADMIN_UPDATE_FIELDS.forEach(function (key) {
    if (data[key] != null) updates[key] = data[key];
  });
  delete updates.id;
  delete updates.timestamp;
  return updates;
}

function updateRecord_(type, data) {
  var entity = entityFor_(type);
  var targetId = String(data.targetId || data.id || '').trim();
  if (!targetId) throw new Error('targetId is required for updateRecord.');
  var updates = parseUpdates_(data);
  var updateKeys = Object.keys(updates);
  if (!updateKeys.length) throw new Error('No allowed update fields were provided.');

  var sheet = getSheet_(entity);
  var header = headerFor_(sheet, entity);
  var idIndex = header.indexOf('id');
  if (idIndex === -1) throw new Error('No id column on target sheet.');
  var values = sheet.getDataRange().getValues();
  var rowIndex = -1;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idIndex]) === targetId) {
      rowIndex = i + 1;
      break;
    }
  }
  if (rowIndex === -1) throw new Error('Record not found: ' + targetId);

  updateKeys.forEach(function (key) {
    var colIndex = header.indexOf(key);
    if (colIndex === -1) return;
    sheet.getRange(rowIndex, colIndex + 1).setValue(updates[key]);
  });

  return { ok: true, id: targetId, updatedFields: updateKeys };
}

/** Read: returns all records for the requested type as JSON (supports ?callback= for JSONP). */
function doGet(e) {
  var out;
  try {
    var params = e && e.parameter || {};
    if (params.action === 'fetchIcal') {
      requireAdmin_({}, e);
      return respond_(fetchPublicIcal_(params.url), e);
    }
    var entity = entityFor_(params.type);
    if (entity.public === false) requireAdmin_({}, e);
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

    if (data.adminOperation === 'updateRecord') {
      requireAdmin_(data, e);
      return respond_(updateRecord_(type, data), e);
    }

    if (isAdminWrite_(type, data)) requireAdmin_(data, e);

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
      .createTextOutput(safeCallback_(callback) + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
