#!/usr/bin/env node

/*
 * Founders & Builders Google Sheets -> Supabase migration bridge.
 *
 * Required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional:
 *   FB_APPS_SCRIPT_URL          Defaults to config.js PROFILES_API.
 *   FB_APPS_SCRIPT_ADMIN_TOKEN  Required for private tabs.
 *   FB_MIGRATION_TYPES          Comma-separated entity list.
 *   FB_MIGRATION_DRY_RUN        "1" to fetch/map without writing.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_PATH = path.join(ROOT, "config.js");

const DEFAULT_TYPES = [
  "profile",
  "business",
  "listing",
  "job",
  "mentor",
  "help",
  "raise",
  "investor",
  "eventSource",
  "event",
  "collab",
  "podcast",
  "resource",
  "account",
  "savedItem",
  "report",
  "adminAction",
  "chapter",
  "activity",
  "graphEdge",
  "conciergeRequest",
  "seedTemplate"
];

const PRIVATE_TYPES = new Set([
  "eventSource",
  "account",
  "savedItem",
  "report",
  "adminAction",
  "chapter",
  "activity",
  "graphEdge",
  "conciergeRequest",
  "seedTemplate"
]);

const TYPE_TABLES = {
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
  seedTemplate: "fb_seed_templates"
};

const SOURCE_IMPORT_ORDER = DEFAULT_TYPES.filter((type) => type !== "event")
  .concat(["event"]);

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run") || process.env.FB_MIGRATION_DRY_RUN === "1";
const selectedTypes = (process.env.FB_MIGRATION_TYPES || "")
  .split(",")
  .map((type) => type.trim())
  .filter(Boolean);

const types = (selectedTypes.length ? selectedTypes : SOURCE_IMPORT_ORDER)
  .filter((type) => TYPE_TABLES[type]);

const supabaseUrl = stripSlash(process.env.SUPABASE_URL || "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const appsScriptUrl = stripSlash(process.env.FB_APPS_SCRIPT_URL || readApiFromConfig());
const appsScriptAdminToken = process.env.FB_APPS_SCRIPT_ADMIN_TOKEN || "";

if (!appsScriptUrl) fail("Missing FB_APPS_SCRIPT_URL and no PROFILES_API found in config.js.");
if (!dryRun && (!supabaseUrl || !serviceRoleKey)) {
  fail("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Use --dry-run to preview without writing.");
}

const sourceIdMap = new Map();

main().catch((error) => {
  console.error(`Migration failed: ${error.message}`);
  process.exit(1);
});

async function main() {
  const totals = [];

  for (const type of types) {
    if (PRIVATE_TYPES.has(type) && !appsScriptAdminToken) {
      totals.push({ type, table: TYPE_TABLES[type], fetched: 0, written: 0, skipped: "needs FB_APPS_SCRIPT_ADMIN_TOKEN" });
      continue;
    }

    const records = await fetchAppsScriptRecords(type);
    const rows = records
      .map((record) => mapRecord(type, record))
      .filter(Boolean);

    if (!dryRun && rows.length) {
      await upsertRows(TYPE_TABLES[type], rows);
    }

    totals.push({ type, table: TYPE_TABLES[type], fetched: records.length, written: dryRun ? 0 : rows.length });

    if (type === "eventSource" && !dryRun) {
      await refreshEventSourceMap();
    }
  }

  console.table(totals);
  console.log(dryRun
    ? "Dry run complete. No Supabase rows were written."
    : "Migration complete. Check Supabase row counts and spot-check records before switching the frontend.");
}

function readApiFromConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return "";
  const config = fs.readFileSync(CONFIG_PATH, "utf8");
  const match = config.match(/PROFILES_API:\s*["']([^"']+)["']/);
  return match ? match[1] : "";
}

function stripSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function fetchAppsScriptRecords(type) {
  const url = new URL(appsScriptUrl);
  url.searchParams.set("type", type);
  if (PRIVATE_TYPES.has(type) && appsScriptAdminToken) {
    url.searchParams.set("adminToken", appsScriptAdminToken);
  }
  const response = await safeFetch(url, `Apps Script ${type}`);
  if (!response.ok) {
    throw new Error(`Apps Script ${type} fetch failed: ${response.status}`);
  }
  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(`Apps Script ${type} error: ${payload.error || "unknown error"}`);
  }
  return Array.isArray(payload.records || payload.profiles)
    ? payload.records || payload.profiles
    : [];
}

async function upsertRows(table, rows) {
  for (const chunk of chunks(rows, 100)) {
    const response = await safeFetch(`${supabaseUrl}/rest/v1/${table}?on_conflict=legacy_sheet_id`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(chunk)
    }, `Supabase ${table}`);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Supabase upsert failed for ${table}: ${response.status} ${text}`);
    }
  }
}

async function refreshEventSourceMap() {
  const response = await safeFetch(`${supabaseUrl}/rest/v1/fb_event_sources?select=id,legacy_sheet_id`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`
    }
  }, "Supabase event source map");
  if (!response.ok) return;
  const rows = await response.json();
  rows.forEach((row) => {
    if (row.legacy_sheet_id) sourceIdMap.set(row.legacy_sheet_id, row.id);
  });
}

async function safeFetch(input, initOrLabel, maybeLabel) {
  const init = typeof initOrLabel === "string" ? undefined : initOrLabel;
  const label = typeof initOrLabel === "string" ? initOrLabel : maybeLabel;
  try {
    return await fetch(input, init);
  } catch (error) {
    const url = typeof input === "string" ? input : input.toString();
    throw new Error(`${label || "Request"} request failed. Check network access and URL: ${url}`);
  }
}

function chunks(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

function mapRecord(type, record) {
  const common = {
    legacy_sheet_id: text(record.id),
    submitted_at: timestamp(record.timestamp),
    raw_data: record || {}
  };

  if (!common.legacy_sheet_id) return null;

  const publicFields = {
    owner_key: text(record.ownerKey),
    account_email: text(record.accountEmail),
    chapter: text(record.chapter),
    moderation_status: text(record.moderationStatus) || "Active",
    verified: bool(record.verified),
    report_count: integer(record.reportCount, 0),
    expires_at: timestamp(record.expiresAt),
    last_updated: timestamp(record.lastUpdated)
  };

  switch (type) {
    case "profile":
      return clean({
        ...common,
        ...publicFields,
        name: required(record.name, "profile.name"),
        building: text(record.building),
        business: text(record.business),
        stage: text(record.stage),
        products: text(record.products),
        skills: text(record.skills),
        industry: text(record.industry),
        location: text(record.location),
        email: required(record.email, "profile.email"),
        website: text(record.website),
        linkedin: text(record.linkedin),
        github: text(record.github),
        x: text(record.x),
        portfolio: text(record.portfolio),
        bio: text(record.bio),
        goals: text(record.goals),
        looking_for: text(record.lookingFor),
        can_help: text(record.canHelp),
        mentor: bool(record.mentor),
        investor: bool(record.investor),
        podcast: bool(record.podcast),
        speaker: bool(record.speaker),
        volunteer: bool(record.volunteer),
        needs: text(record.needs),
        offers: text(record.offers)
      });
    case "business":
      return clean({
        ...common,
        ...publicFields,
        name: required(record.name, "business.name"),
        category: text(record.category),
        logo: text(record.logo),
        description: text(record.description),
        website: text(record.website),
        industry: text(record.industry),
        team: text(record.team),
        products: text(record.products),
        services: text(record.services),
        hiring: text(record.hiring),
        email: required(record.email, "business.email"),
        linkedin: text(record.linkedin),
        x: text(record.x),
        instagram: text(record.instagram)
      });
    case "listing":
      return clean({
        ...common,
        ...publicFields,
        name: required(record.name, "listing.name"),
        category: text(record.category),
        description: text(record.description),
        pricing: text(record.pricing),
        image: text(record.image),
        demo: text(record.demo),
        website: text(record.website),
        email: required(record.email, "listing.email")
      });
    case "job":
      return clean({
        ...common,
        ...publicFields,
        title: required(record.title, "job.title"),
        company: text(record.company),
        category: text(record.category),
        location: text(record.location),
        remote: bool(record.remote),
        compensation: text(record.compensation),
        description: text(record.description),
        apply_link: text(record.applyLink),
        email: required(record.email, "job.email")
      });
    case "mentor":
      return clean({
        ...common,
        ...publicFields,
        name: required(record.name, "mentor.name"),
        title: text(record.title),
        company: text(record.company),
        industry: text(record.industry),
        expertise: text(record.expertise),
        stages: text(record.stages),
        experience: text(record.experience),
        availability: text(record.availability),
        office_hours: text(record.officeHours),
        bio: text(record.bio),
        email: required(record.email, "mentor.email"),
        linkedin: text(record.linkedin),
        website: text(record.website)
      });
    case "help":
      return clean({
        ...common,
        ...publicFields,
        name: text(record.name),
        title: required(record.title, "help.title"),
        category: text(record.category),
        urgency: text(record.urgency),
        description: text(record.description),
        email: required(record.email, "help.email"),
        linkedin: text(record.linkedin)
      });
    case "raise":
      return clean({
        ...common,
        ...publicFields,
        company: required(record.company, "raise.company"),
        founder: text(record.founder),
        stage: text(record.stage),
        industry: text(record.industry),
        amount_seeking: text(record.amountSeeking),
        raised_so_far: text(record.raisedSoFar),
        use_of_funds: text(record.useOfFunds),
        description: text(record.description),
        email: required(record.email, "raise.email"),
        website: text(record.website),
        linkedin: text(record.linkedin),
        disclaimer_accepted: bool(record.disclaimerAccepted)
      });
    case "investor":
      return clean({
        ...common,
        ...publicFields,
        name: required(record.name, "investor.name"),
        firm: text(record.firm),
        investor_type: text(record.type),
        check_size: text(record.checkSize),
        stages: text(record.stages),
        industries: text(record.industries),
        thesis: text(record.thesis),
        email: required(record.email, "investor.email"),
        website: text(record.website),
        linkedin: text(record.linkedin),
        disclaimer_accepted: bool(record.disclaimerAccepted)
      });
    case "eventSource":
      return clean({
        ...common,
        source_name: required(record.sourceName, "eventSource.sourceName"),
        organizer_email: required(record.organizerEmail, "eventSource.organizerEmail"),
        contact_name: text(record.contactName),
        platform: required(record.platform, "eventSource.platform"),
        auth_method: required(record.authMethod, "eventSource.authMethod"),
        chapter: text(record.chapter),
        source_url: text(record.sourceUrl),
        feed_url: text(record.feedUrl),
        import_mode: text(record.importMode) || "Curated review",
        cadence: text(record.cadence),
        fit_notes: text(record.fitNotes),
        permission_confirmed: bool(record.permissionConfirmed),
        attribution_accepted: bool(record.attributionAccepted),
        review_accepted: bool(record.reviewAccepted),
        sync_status: text(record.syncStatus) || "Pending review",
        approval_status: text(record.approvalStatus) || "Pending review",
        secret_status: text(record.secretStatus) || "No secret required",
        last_checked: timestamp(record.lastChecked),
        last_import_count: integer(record.lastImportCount),
        next_step: text(record.nextStep),
        notes: text(record.notes),
        provider_account_id: text(record.providerAccountId),
        provider_calendar_id: text(record.providerCalendarId),
        provider_organization_id: text(record.providerOrganizationId),
        provider_endpoint: text(record.providerEndpoint),
        provider_scope: text(record.providerScope),
        oauth_status: text(record.oauthStatus),
        connector_status: text(record.connectorStatus),
        last_provider_sync_at: timestamp(record.lastProviderSyncAt),
        provider_notes: text(record.providerNotes)
      });
    case "event":
      return clean({
        ...common,
        ...publicFields,
        title: required(record.title, "event.title"),
        host: text(record.host),
        category: text(record.category),
        city: text(record.city),
        event_date: date(record.date),
        event_time: text(record.time),
        location: text(record.location),
        description: text(record.description),
        rsvp_link: text(record.rsvpLink),
        email: required(record.email, "event.email"),
        source_platform: text(record.sourcePlatform),
        source_name: text(record.sourceName),
        source_url: text(record.sourceUrl),
        source_event_id: text(record.sourceEventId),
        import_status: text(record.importStatus),
        imported_from_source_id: text(record.importedFromSourceId),
        event_source_id: sourceIdMap.get(text(record.importedFromSourceId)) || null,
        external_updated_at: timestamp(record.externalUpdatedAt)
      });
    case "collab":
      return clean({
        ...common,
        ...publicFields,
        title: required(record.title, "collab.title"),
        name: text(record.name),
        category: text(record.category),
        format: text(record.format),
        city: text(record.city),
        description: text(record.description),
        email: required(record.email, "collab.email"),
        linkedin: text(record.linkedin)
      });
    case "podcast":
      return clean({
        ...common,
        ...publicFields,
        show_name: required(record.showName, "podcast.showName"),
        host: text(record.host),
        topics: text(record.topics),
        format: text(record.format),
        looking_for: text(record.lookingFor),
        city: text(record.city),
        description: text(record.description),
        listen_link: text(record.listenLink),
        email: required(record.email, "podcast.email"),
        linkedin: text(record.linkedin)
      });
    case "resource":
      return clean({
        ...common,
        ...publicFields,
        title: required(record.title, "resource.title"),
        category: text(record.category),
        description: text(record.description),
        link: required(record.link, "resource.link"),
        submitted_by: text(record.submittedBy),
        email: text(record.email)
      });
    case "account":
      return clean({
        ...common,
        owner_key: text(record.ownerKey),
        name: text(record.name),
        email: required(record.email, "account.email"),
        chapter: text(record.chapter),
        location: text(record.location),
        needs: text(record.needs),
        offers: text(record.offers),
        goals: text(record.goals),
        skills: text(record.skills),
        last_seen: timestamp(record.lastSeen),
        moderation_status: text(record.moderationStatus) || "Active"
      });
    case "savedItem":
      return clean({
        ...common,
        owner_key: text(record.ownerKey),
        account_email: text(record.accountEmail),
        target_type: required(record.targetType, "savedItem.targetType"),
        target_id: required(record.targetId, "savedItem.targetId"),
        target_title: text(record.targetTitle),
        notes: text(record.notes)
      });
    case "report":
      return clean({
        ...common,
        target_type: text(record.targetType),
        target_id: text(record.targetId),
        target_title: text(record.targetTitle),
        reason: required(record.reason, "report.reason"),
        details: text(record.details),
        reporter_email: text(record.reporterEmail),
        status: text(record.status) || "Open"
      });
    case "adminAction":
      return clean({
        ...common,
        target_type: text(record.targetType),
        target_id: text(record.targetId),
        target_title: text(record.targetTitle),
        action: required(record.action, "adminAction.action"),
        notes: text(record.notes),
        admin_email: text(record.adminEmail),
        recommended_approval_status: text(record.recommendedApprovalStatus),
        recommended_sync_status: text(record.recommendedSyncStatus),
        recommended_secret_status: text(record.recommendedSecretStatus),
        import_plan: text(record.importPlan),
        source_platform: text(record.sourcePlatform),
        source_url: text(record.sourceUrl),
        feed_url: text(record.feedUrl),
        organizer_email: text(record.organizerEmail),
        import_count: integer(record.importCount),
        duplicate_count: integer(record.duplicateCount),
        archived_count: integer(record.archivedCount),
        admin_operation: text(record.adminOperation),
        provider: text(record.provider),
        provider_operation: text(record.providerOperation)
      });
    case "chapter":
      return clean({
        ...common,
        name: required(record.name, "chapter.name"),
        city: text(record.city),
        slug: text(record.slug),
        status: text(record.status) || "Planning",
        focus: text(record.focus),
        lead_name: text(record.leadName),
        lead_email: text(record.leadEmail),
        notes: text(record.notes)
      });
    case "activity":
      return clean({
        ...common,
        title: required(record.title, "activity.title"),
        summary: text(record.summary),
        target_type: text(record.targetType),
        target_id: text(record.targetId),
        chapter: text(record.chapter),
        action_label: text(record.actionLabel),
        action_url: text(record.actionUrl),
        status: text(record.status) || "Active"
      });
    case "graphEdge":
      return clean({
        ...common,
        source_type: text(record.sourceType),
        source_id: text(record.sourceId),
        source_title: required(record.sourceTitle, "graphEdge.sourceTitle"),
        relationship: required(record.relationship, "graphEdge.relationship"),
        target_type: text(record.targetType),
        target_id: text(record.targetId),
        target_title: required(record.targetTitle, "graphEdge.targetTitle"),
        basis: text(record.basis),
        weight: number(record.weight),
        moderation_status: text(record.moderationStatus) || "Active"
      });
    case "conciergeRequest":
      return clean({
        ...common,
        question: required(record.question, "conciergeRequest.question"),
        email: text(record.email),
        context: text(record.context),
        matched_types: text(record.matchedTypes),
        status: text(record.status) || "Open",
        notes: text(record.notes)
      });
    case "seedTemplate":
      return clean({
        ...common,
        title: required(record.title, "seedTemplate.title"),
        target_type: required(record.targetType, "seedTemplate.targetType"),
        source_policy: text(record.sourcePolicy),
        template_url: text(record.templateUrl),
        permission_status: text(record.permissionStatus) || "Template only",
        moderation_status: text(record.moderationStatus) || "Needs review",
        notes: text(record.notes)
      });
    default:
      return null;
  }
}

function clean(row) {
  Object.keys(row).forEach((key) => {
    if (row[key] === "" || row[key] === undefined) row[key] = null;
  });
  return row;
}

function required(value, label) {
  const out = text(value);
  if (!out) throw new Error(`Missing required field ${label}`);
  return out;
}

function text(value) {
  if (value == null) return "";
  return String(value).trim();
}

function bool(value) {
  const normalized = text(value).toLowerCase();
  return ["yes", "true", "1", "y", "checked", "accepted"].includes(normalized);
}

function integer(value, fallback = null) {
  const normalized = text(value);
  if (!normalized) return fallback;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function number(value) {
  const normalized = text(value);
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function timestamp(value) {
  const normalized = text(value);
  if (!normalized) return null;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function date(value) {
  const normalized = text(value);
  if (!normalized) return null;
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}
