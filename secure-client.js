/* Isolated Supabase client: no Sheets fallback, tokens or project data in browser storage. */
(function (root) {
  'use strict';
  function createClient(config, transport) {
    var base, session = null, generation = 0, pending = new Set();
    try { base = new URL(config.url); } catch (_) { /* disabled */ }
    var enabled = config.enabled === true && base && base.protocol === 'https:' &&
      /^[a-z0-9]+\.supabase\.co$/.test(base.hostname) && base.pathname === '/' &&
      !base.username && !base.password && !base.search && !base.hash &&
      /^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey || '');
    var send = transport || root.fetch.bind(root);
    function clear() { session = null; generation++; pending.forEach(function (controller) { controller.abort(); }); }
    function current() {
      if (session && session.expires_at * 1000 <= Date.now()) clear();
      return session;
    }
    async function request(path, body, authenticated) {
      if (!enabled) throw new Error('Secure workspace is not configured yet.');
      var active = current(), version = generation;
      if (authenticated && !active) throw new Error('Please sign in again.');
      var headers = { apikey: config.publishableKey, 'Content-Type': 'application/json' };
      if (active) headers.Authorization = 'Bearer ' + active.access_token;
      var controller = new AbortController(), timedOut = false;
      pending.add(controller);
      var timeout = setTimeout(function () { timedOut = true; controller.abort(); }, 20000);
      try {
        var response = await send(base.origin + path, {
          method: 'POST', headers: headers, body: JSON.stringify(body), signal: controller.signal,
          cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'
        });
        var data = await response.json().catch(function () { return null; });
        if (timedOut) throw new Error('Request timed out. Please try again.');
        if (version !== generation) throw new Error('Session changed. Please retry.');
        if (!response.ok) {
          if (response.status === 401) clear();
          throw new Error(response.status === 429 ? 'Too many requests. Please try later.' :
            'Request could not be completed. Check your sign-in and permissions.');
        }
        if (authenticated && !current()) throw new Error('Please sign in again.');
        return data;
      } catch (error) {
        if (version !== generation) throw new Error('Session changed. Please retry.');
        if (timedOut) throw new Error('Request timed out. Please try again.');
        if (error.name === 'AbortError') throw new Error('Request cancelled.');
        throw error;
      } finally {
        clearTimeout(timeout); pending.delete(controller);
      }
    }
    return Object.freeze({
      enabled: !!enabled,
      user: function () { var s = current(); return s ? s.user : null; },
      sendCode: function (email) { return request('/auth/v1/otp', { email: email, create_user: false }, false); },
      verifyCode: async function (email, token) {
        var data = await request('/auth/v1/verify', { email: email, token: token, type: 'email' }, false);
        if (!data || !data.access_token || !data.user || !data.user.id || !data.user.email_confirmed_at || !data.expires_in)
          throw new Error('A verified email session is required.');
        session = { access_token: data.access_token, user: data.user, expires_at: Date.now()/1000 + data.expires_in };
        generation++;
        return data.user;
      },
      signOut: async function () {
        var previous = current(); clear();
        if (enabled && previous) {
          var result = await send(base.origin + '/auth/v1/logout?scope=local', {
            method: 'POST', headers: { apikey: config.publishableKey, Authorization: 'Bearer ' + previous.access_token },
            cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'
          });
          if (!result.ok) throw new Error('Signed out here. Server session revocation could not be confirmed.');
        }
      },
      rpc: function (name, params, authenticated) {
        if (!/^fb_[a-z_]+$/.test(name)) throw new Error('Invalid operation.');
        return request('/rest/v1/rpc/' + name, params || {}, authenticated !== false);
      }
    });
  }
  root.FBSecureClient = { create: createClient };
})(typeof window !== 'undefined' ? window : globalThis);
