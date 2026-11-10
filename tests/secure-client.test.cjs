const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../secure-client.js');
const config = { enabled: true, url: 'https://exampleproject.supabase.co', publishableKey: 'sb_publishable_test' };
const user = { id: 'owner', email: 'owner@example.com', email_confirmed_at: '2026-10-18' };
const ok = data => ({ ok: true, status: 200, json: async () => data });
const session = () => ok({ access_token: 'test-user-jwt', expires_in: 3600, user });
test('disabled configuration never sends private data', async () => {
 let calls = 0; const c = FBSecureClient.create({ enabled: false }, async () => calls++);
 await assert.rejects(c.rpc('fb_create_project', { p_private_brief: 'secret' }), /not configured/); assert.equal(calls, 0);
});
test('rejects secret, service-role, non-Supabase and credential-bearing configurations', () => {
 for (const publishableKey of ['sb_secret_test', 'eyJhbGciOiJIUzI1NiJ9.service-role', ''])
  assert.equal(FBSecureClient.create({ ...config, publishableKey }, async () => {}).enabled, false);
 for (const url of ['http://exampleproject.supabase.co', 'https://supabase.co.attacker.test', 'https://user:password@exampleproject.supabase.co'])
  assert.equal(FBSecureClient.create({ ...config, url }, async () => {}).enabled, false);
});
test('private operations require authentication', async () => {
 let calls = 0; const c = FBSecureClient.create(config, async () => calls++);
 await assert.rejects(c.rpc('fb_get_project'), /sign in/); assert.equal(calls, 0);
});
test('OTP is invite-only and never falls back to Sheets', async () => {
 const calls = []; const c = FBSecureClient.create(config, async (url, options) => { calls.push({ url, options }); return ok({}); });
 await c.sendCode('member@example.com'); assert.deepEqual(JSON.parse(calls[0].options.body), { email: 'member@example.com', create_user: false });
 assert.equal(calls[0].url, config.url + '/auth/v1/otp'); assert.equal(calls[0].options.credentials, 'omit');
});
test('verified JWT is sent only to Supabase and signout clears access', async () => {
 const calls = []; const c = FBSecureClient.create(config, async (url, options) => { calls.push({ url, options }); return url.endsWith('/verify') ? session() : ok([]); });
 await c.verifyCode(user.email, '123456'); await c.rpc('fb_get_project', { p_project: 'test' });
 assert.equal(calls[1].options.headers.Authorization, 'Bearer test-user-jwt');
 assert.equal(calls[1].options.cache, 'no-store'); assert.equal(c.user().id, user.id);
 await c.signOut(); assert.equal(c.user(), null); await assert.rejects(c.rpc('fb_get_project'), /sign in/);
});
test('signout discards responses from previous authenticated session', async () => {
 let resolve; const c = FBSecureClient.create(config, async url => {
  if (url.endsWith('/verify')) return session();
  if (url.includes('/rpc/')) return new Promise(r => resolve = r);
  return ok({});
 });
 await c.verifyCode(user.email, '123456'); const pending = c.rpc('fb_get_project');
 await c.signOut(); resolve(ok([{ private_brief: 'must not render' }]));
 await assert.rejects(pending, /Session changed/);
});
test('server errors never echo confidential submitted content', async () => {
 const c = FBSecureClient.create(config, async () => ({ ok: false, status: 400, json: async () => ({ message: 'PRIVATE BRIEF' }) }));
 await assert.rejects(c.sendCode(user.email), error => !error.message.includes('PRIVATE BRIEF'));
});
test('unverified sessions are not accepted', async () => {
 const c = FBSecureClient.create(config, async () => ok({ access_token: 'test', expires_in: 3600, user: { id: 'unverified' } }));
 await assert.rejects(c.verifyCode(user.email, '123456'), /verified email/); assert.equal(c.user(), null);
});
test('expired session cannot read private data', async () => {
 const c = FBSecureClient.create(config, async () => ok({ access_token: 'test', expires_in: -1, user }));
 await c.verifyCode(user.email, '123456'); await assert.rejects(c.rpc('fb_get_project'), /sign in/); assert.equal(c.user(), null);
});
test('signout aborts an ongoing private request immediately', async () => {
 let signal;
 const c = FBSecureClient.create(config, async (url, options) => {
  if (url.endsWith('/verify')) return session();
  if (!url.includes('/rpc/')) return ok({});
  signal = options.signal;
  return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))));
 });
 await c.verifyCode(user.email, '123456');
 const pending = c.rpc('fb_get_project');
 const rejected = assert.rejects(pending, /Session changed/);
 await c.signOut(); assert.equal(signal.aborted, true); assert.equal(c.user(), null); await rejected;
});
test('failed server signout still clears local access', async () => {
 const c = FBSecureClient.create(config, async url => url.endsWith('/verify') ? session() : { ok: false });
 await c.verifyCode(user.email, '123456');
 await assert.rejects(c.signOut(), /revocation could not be confirmed/);
 assert.equal(c.user(), null); await assert.rejects(c.rpc('fb_get_project'), /sign in/);
});
test('stalled private requests time out and abort without exposing content', async t => {
 t.mock.timers.enable({ apis: ['setTimeout'] });
 const c = FBSecureClient.create(config, async (url, options) => {
  if (url.endsWith('/verify')) return session();
  return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))));
 });
 await c.verifyCode(user.email, '123456');
 const request = c.rpc('fb_get_project'); const rejected = assert.rejects(request, /Request timed out/);
 t.mock.timers.tick(20000); await rejected;
});
