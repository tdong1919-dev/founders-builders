// Public connection settings only. Leave disabled until hosted RLS/auth tests pass.
// Never put a service-role or secret key here. Existing FB_CONFIG / Sheets stays separate.
window.FB_SECURE_CONFIG = Object.freeze({
  enabled: false,
  url: '',
  publishableKey: ''
});
