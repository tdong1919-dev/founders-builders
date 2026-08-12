/**
 * Founders & Builders — front-end config
 *
 * DATA_BACKEND controls the active public datastore:
 *   "google-sheets" keeps the current Apps Script backend live.
 *   "supabase" reads/writes through supabase-adapter.js.
 *
 * Keep this on "google-sheets" until Sheet data is migrated and spot-checked
 * in Supabase.
 */
window.FB_CONFIG = {
  DATA_BACKEND: "google-sheets",
  PROFILES_API: "https://script.google.com/macros/s/AKfycbxkUEG4blNbl-wXjj7FG7HTECMRvJv8zuAMCnGKIS_RIxhh9fVtb-Azo103LteFX0xXOA/exec",
  SUPABASE_URL: "https://hgnkpyfxghglsxqprphy.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_U4Ey_YBoFgWSJmnc_-38ZQ_OxY52HcP"
};
