// Romang · client-side password gate for the 길랭표 (admin) page.
// Plain JS so both the React pages and the static landing can use it.
//
// Security model (per chosen "A" level): the password is never stored in
// source — only its salted SHA-256 hash is. Entry hashes the input and
// compares. A correct entry sets a per-tab session flag so navigation
// within the same tab doesn't re-prompt. This stops casual / direct-URL
// access; it is not a defense against someone reading the raw data file.

(function () {
  const SALT = 'romang-guild::';
  // SHA-256(SALT + password). Change via: see note in setup docs.
  const STORED_HASH = '3641211a091ba76847f9723acc88866d592aed21f7e15bfc288a4c355b208b64';
  const SESSION_KEY = 'romang_guild_auth_v1';

  async function sha256hex(str) {
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function verify(password) {
    try {
      const h = await sha256hex(SALT + String(password ?? ''));
      return h === STORED_HASH;
    } catch (e) {
      return false;
    }
  }

  function isAuthed() {
    try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch (e) { return false; }
  }
  function setAuthed() {
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) {}
  }
  function clear() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  window.RomangAuth = { verify, isAuthed, setAuthed, clear };
})();
