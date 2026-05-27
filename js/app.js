/* =========================================
   ÉPHÉMÈRE — App (Firebase real-time)
   ========================================= */

const EMOJIS = ['😊','😎','🥰','🤩','🤪','🦋','🌟','🔥','💎','🌙','🌸','🦊','🌿','🎸','🏄',
                '🦁','🐺','🎩','🎯','💫','⚡','🌈','🍀','🎭','🌺','🦄','🐉','🎪','🌊','🏔️'];

function showToast(msg, duration = 2000) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.getElementById('app').appendChild(t);
  requestAnimationFrame(() => { t.classList.add('show'); });
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, duration);
}

/* ── Helpers ───────────────────────────── */
function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function timeAgo(ts) {
  if (!ts) return '';
  const d = Date.now() - ts;
  if (d < 60000)    return 'maintenant';
  if (d < 3600000)  return Math.floor(d/60000) + 'min';
  if (d < 86400000) return Math.floor(d/3600000) + 'h';
  return Math.floor(d/86400000) + 'j';
}

function avatar(user, sizeClass) {
  if (!user) return '';
  const c = user.color || 'hsl(260,60%,60%)';
  const light = c.replace(/(\d+)%\)$/, (_,l) => `${Math.min(100,+l+22)}%)`);
  const dark  = c.replace(/(\d+)%\)$/, (_,l) => `${Math.max(0, +l-22)}%)`);
  return `<div class="av ${sizeClass}" style="background:radial-gradient(circle at 35% 35%,${light},${dark})">
    <span>${escHtml(user.emoji||'😊')}</span>
  </div>`;
}

function genColor() { return `hsl(${Math.floor(Math.random()*360)},65%,60%)`; }
function genSid()   { return 's_'+Date.now()+'_'+Math.random().toString(36).slice(2); }

function getSession() {
  try { return JSON.parse(sessionStorage.getItem('ephem_me')); } catch { return null; }
}

function saveSession(user) {
  sessionStorage.setItem('ephem_me', JSON.stringify(user));
  sessionStorage.setItem('ephem_sid', user.sessionId);
}

function clearSession() {
  sessionStorage.removeItem('ephem_me');
  sessionStorage.removeItem('ephem_sid');
}

/* ── Router ────────────────────────────── */
const App = {
  _clockTimer: null,
  _unsubs: [],

  go(view, data, anim = 'view-enter') {
    if (this._clockTimer) { clearInterval(this._clockTimer); this._clockTimer = null; }
    this._unsubs.forEach(fn => fn());
    this._unsubs = [];

    const app = document.getElementById('app');
    const old = document.getElementById('cv');
    if (old) old.remove();

    const el = document.createElement('div');
    el.className = `view ${anim}`;
    el.id = 'cv';
    app.appendChild(el);

    ({ auth: Views.auth, home: Views.home, chat: Views.chat,
       stories: Views.stories, profile: Views.profile, setup: Views.setup }
    )[view]?.(el, data);
  },

  async init() {
    const cfg = window.EPHEM_CONFIG;

    // Show setup screen if Firebase not configured
    if (!cfg || cfg.apiKey === 'SETUP_NEEDED' || cfg.databaseURL === 'SETUP_NEEDED') {
      this.go('setup');
      return;
    }

    // Show loading
    document.getElementById('app').innerHTML =
      `<div style="height:100dvh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px">
        <div style="font-size:28px;font-weight:200;letter-spacing:.14em;opacity:.7">éphémère</div>
        <div style="width:32px;height:32px;border:2px solid rgba(168,85,247,.3);border-top-color:#a855f7;border-radius:50%;animation:spin .8s linear infinite"></div>
        <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
       </div>`;

    try {
      DB.init(cfg);
    } catch (e) {
      this.go('setup', { error: 'Firebase introuvable. Vérifie ta config.' });
      return;
    }

    // Try to restore session (page refresh = keep account)
    const session = getSession();
    if (session) {
      const claimed = await DB.claimUsername(session.username, session);
      if (claimed) { this.go('home'); return; }
      clearSession();
    }

    this.go('auth');
  }
};

/* ── Views ─────────────────────────────── */
const Views = {

  /* ════════ SETUP GUIDE ════════ */
  setup(root, opts = {}) {
    root.innerHTML = `
      <div class="auth-view" style="gap:0">
        <div class="auth-brand" style="margin-bottom:32px">
          <span class="auth-logo">éphémère</span>
        </div>
        <div class="auth-card" style="max-width:420px">
          <div style="padding:24px;border-bottom:1px solid var(--border)">
            <div style="font-size:16px;font-weight:400;margin-bottom:6px">Configuration Firebase requise</div>
            <div style="font-size:13px;color:var(--text-muted);line-height:1.6">Pour que les utilisateurs puissent vraiment communiquer entre eux, il faut connecter une base de données gratuite.</div>
            ${opts.error ? `<div style="margin-top:12px;padding:10px 14px;border-radius:10px;background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.3);color:#f87171;font-size:13px">${escHtml(opts.error)}</div>` : ''}
          </div>
          <div style="padding:24px;display:flex;flex-direction:column;gap:14px">
            ${[
              ['1', 'Créer le projet', 'Va sur <a href="https://console.firebase.google.com" target="_blank" style="color:var(--accent)">console.firebase.google.com</a> → "Créer un projet"'],
              ['2', 'Activer la base de données', 'Menu gauche → <b>Realtime Database</b> → "Créer" → choisir <b>Mode test</b>'],
              ['3', 'Copier la config', 'Icône ⚙️ → Paramètres → Vos applications → Web → copier <code style="background:rgba(255,255,255,.08);padding:1px 5px;border-radius:4px">apiKey</code> et <code style="background:rgba(255,255,255,.08);padding:1px 5px;border-radius:4px">databaseURL</code>'],
              ['4', 'Coller ci-dessous', 'Remplis les deux champs et clique Connecter'],
            ].map(([n,t,d]) => `
              <div style="display:flex;gap:12px">
                <div style="width:26px;height:26px;border-radius:50%;background:var(--accent-dim);border:1px solid var(--accent);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--accent);flex-shrink:0;margin-top:2px">${n}</div>
                <div><div style="font-size:14px;font-weight:400;margin-bottom:3px">${t}</div><div style="font-size:13px;color:var(--text-muted);line-height:1.5">${d}</div></div>
              </div>`).join('')}
            <div style="padding-top:8px;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:10px">
              <input class="form-input" id="s-key" placeholder="apiKey" autocomplete="off" spellcheck="false">
              <input class="form-input" id="s-url" placeholder="databaseURL  (https://...firebaseio.com)" autocomplete="off" spellcheck="false">
              <div class="form-error" id="s-err"></div>
              <button class="btn-primary" id="s-save">Connecter ✦</button>
            </div>
          </div>
        </div>
      </div>`;

    root.querySelector('#s-save').addEventListener('click', async () => {
      const key = root.querySelector('#s-key').value.trim();
      const url = root.querySelector('#s-url').value.trim();
      const err = root.querySelector('#s-err');
      if (!key || !url) { err.textContent = 'Remplis les deux champs.'; return; }
      if (!url.includes('firebaseio.com')) { err.textContent = 'databaseURL invalide.'; return; }
      window.EPHEM_CONFIG = { apiKey: key, databaseURL: url };
      // Persist in localStorage so the owner only needs to do this once
      localStorage.setItem('ephem_firebase_config', JSON.stringify({ apiKey: key, databaseURL: url }));
      await App.init();
    });
  },

  /* ════════ AUTH ════════ */
  auth(root) {
    let chosen = EMOJIS[0];

    function render() {
      root.innerHTML = `
        <div class="auth-view">
          <div class="auth-brand">
            <span class="auth-logo">éphémère</span>
            <span class="auth-tagline">chaque session est unique · tout disparaît</span>
          </div>
          <div class="auth-card">
            <div style="padding:20px 24px 14px;border-bottom:1px solid var(--border)">
              <div style="font-size:15px;font-weight:400;margin-bottom:4px">Créer ton compte</div>
              <div style="font-size:12px;color:var(--text-muted);line-height:1.5">Ton compte existe le temps de ta session. Quand tu quittes le site, il disparaît.</div>
            </div>
            <div class="auth-form">
              <div class="form-group">
                <label class="form-label">Pseudo</label>
                <input class="form-input" id="a-username" placeholder="ton_pseudo" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="24">
              </div>
              <div class="form-group">
                <label class="form-label">Prénom affiché</label>
                <input class="form-input" id="a-name" placeholder="Ton prénom" autocomplete="given-name" maxlength="32">
              </div>
              <div class="form-group">
                <label class="form-label">Ton emoji</label>
                <div class="emoji-grid">
                  ${EMOJIS.map(e => `<div class="emoji-opt${e===chosen?' chosen':''}" data-emoji="${e}">${e}</div>`).join('')}
                </div>
              </div>
              <div class="form-error" id="a-err"></div>
              <button class="btn-primary" id="a-btn">Entrer ✦</button>
            </div>
          </div>
        </div>`;
      bind();
    }

    function bind() {
      root.querySelectorAll('.emoji-opt').forEach(e =>
        e.addEventListener('click', () => { chosen = e.dataset.emoji; render(); })
      );

      root.querySelector('#a-btn').addEventListener('click', doCreate);
      root.querySelectorAll('.form-input').forEach(inp =>
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') doCreate(); })
      );
    }

    async function doCreate() {
      const usernameRaw = root.querySelector('#a-username').value.trim();
      const name        = root.querySelector('#a-name').value.trim();
      const errEl       = root.querySelector('#a-err');
      const btn         = root.querySelector('#a-btn');

      if (!usernameRaw) { errEl.textContent = 'Choisis un pseudo.'; return; }
      if (!name)        { errEl.textContent = 'Indique ton prénom.'; return; }

      const username = usernameRaw.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      if (username.length < 2) { errEl.textContent = 'Pseudo trop court (min 2 caractères).'; return; }

      btn.textContent = '…';
      btn.disabled = true;

      const free = await DB.isUsernameFree(username);
      if (!free) {
        errEl.textContent = `@${username} est déjà pris en ce moment. Essaie un autre pseudo.`;
        btn.textContent = 'Entrer ✦';
        btn.disabled = false;
        return;
      }

      const sid   = genSid();
      const user  = { username, displayName: name, emoji: chosen, color: genColor(), sessionId: sid, joinedAt: Date.now() };
      const ok    = await DB.claimUsername(username, user);

      if (!ok) {
        errEl.textContent = `@${username} vient d'être pris. Essaie un autre.`;
        btn.textContent = 'Entrer ✦';
        btn.disabled = false;
        return;
      }

      saveSession(user);
      App.go('home');
    }

    render();
  },

  /* ════════ HOME ════════ */
  home(root) {
    const me = getSession();
    if (!me) { App.go('auth'); return; }

    let onlineUsers = {};
    let chatted = new Set(JSON.parse(sessionStorage.getItem('ephem_chatted')||'[]'));

    function isChatted(u) { return chatted.has(u.username); }

    root.innerHTML = `
      <div class="home-view" id="home-wrap">
        <div class="topbar">
          <span class="topbar-logo">éphémère <span id="online-count" style="font-size:13px;color:var(--success);margin-left:8px">● 0 en ligne</span></span>
          <button class="hamburger" id="open-drawer" aria-label="Conversations">
            <span></span><span></span><span></span>
            <span class="notif-dot hidden" id="notif-dot"></span>
          </button>
        </div>

        <!-- Active zone: clock + orbits -->
        <div class="active-zone" id="active-zone">
          <div class="clock-wrap">
            <svg class="clock-svg" id="clock-svg" viewBox="0 0 200 200"></svg>
            <div class="orbit-container" id="orbit-ct"></div>
          </div>
        </div>

        <!-- Separator (shown only if there are inactive) -->
        <div class="separator hidden" id="sep">
          <span class="separator-label">autres</span>
        </div>

        <!-- Inactive floating zone -->
        <div class="inactive-zone" id="inactive-zone"></div>

        <nav class="bottom-nav">
          <button class="nav-btn" data-view="stories">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>
            </svg>
            Stories
          </button>
          <button class="nav-btn active" data-view="home">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
            </svg>
            Accueil
          </button>
          <button class="nav-btn" data-view="profile">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            Profil
          </button>
        </nav>
      </div>`;

    // Clock
    drawClock();
    App._clockTimer = setInterval(drawClock, 1000);

    // Listen online users
    DB.watchOnline(users => {
      onlineUsers = users;
      renderContacts();
      // Update online count in topbar
      const countEl = root.querySelector('#online-count');
      if (countEl) {
        const n = Object.values(users).filter(u => u.username !== me.username).length;
        countEl.textContent = `● ${n} en ligne`;
      }
    });
    App._unsubs.push(() => DB.offOnline());

    // Single persistent unread watcher
    firebase.database().ref('/messages').on('value', snap => {
      const dot = root.querySelector('#notif-dot');
      if (!dot) return;
      let hasUnread = false;
      snap.forEach(conv => {
        conv.forEach(msg => {
          const v = msg.val();
          if (v.to === me.username && !v.read) hasUnread = true;
        });
      });
      dot.classList.toggle('hidden', !hasUnread);
    });
    App._unsubs.push(() => firebase.database().ref('/messages').off());

    // Nav
    root.querySelectorAll('.nav-btn[data-view]').forEach(btn =>
      btn.addEventListener('click', () => {
        const v = btn.dataset.view;
        if (v !== 'home') App.go(v, null, 'view-from-right');
      })
    );
    root.querySelector('#open-drawer').addEventListener('click', () => openDrawer(me, onlineUsers));

    function renderContacts() {
      const others   = Object.values(onlineUsers).filter(u => u.username !== me.username);
      const active   = others.filter(u => isChatted(u));
      const inactive = others.filter(u => !isChatted(u));

      // Separator
      const sep = root.querySelector('#sep');
      sep.classList.toggle('hidden', inactive.length === 0 || active.length === 0);

      // Orbit
      buildOrbits(active);

      // Floaters
      buildFloaters(inactive);

      // Empty state
      const wrap = root.querySelector('#home-wrap');
      let empty = wrap.querySelector('.home-empty');
      if (others.length === 0) {
        if (!empty) {
          empty = document.createElement('div');
          empty.className = 'home-empty';
          empty.innerHTML = '<p>Personne en ligne pour l\'instant…<br>Partage le lien avec tes amis ✦</p>';
          wrap.appendChild(empty);
        }
      } else {
        empty?.remove();
      }
    }

    function buildOrbits(contacts) {
      const ct = root.querySelector('#orbit-ct');
      ct.innerHTML = '';
      if (!contacts.length) return;
      const radii    = [118, 136, 155];
      const durations = [22, 28, 36];
      contacts.forEach((u, i) => {
        const r   = radii[i % radii.length];
        const dur = durations[i % durations.length] + i * 3;
        const off = i / contacts.length;
        const el  = document.createElement('div');
        el.className = 'orbit-item';
        el.style.cssText = `--r:${r}px;--dur:${dur}s;--offset:${off}`;
        el.innerHTML = avatar(u, 'sz-lg') + `<span class="orbit-label">${escHtml(u.displayName)}</span>`;
        el.addEventListener('click', () => App.go('chat', u, 'view-from-right'));
        ct.appendChild(el);
      });
    }

    function buildFloaters(contacts) {
      const zone = root.querySelector('#inactive-zone');
      zone.innerHTML = '';
      if (!contacts.length) return;
      const zW = window.innerWidth;
      const zH = window.innerHeight * 0.35;
      contacts.forEach((u, i) => {
        const sz    = 44 + (i % 3) * 8;
        const left  = 10 + (i * 97 + 37) % Math.max(zW - sz - 20, 1);
        const top   = 12 + (i * 61 + 11) % Math.max(zH - sz - 30, 1);
        const dur   = 3.5 + (i % 4) * 0.7;
        const delay = -(i * 0.8 % dur);
        const el    = document.createElement('div');
        el.className = 'float-bubble';
        el.style.cssText = `left:${left}px;top:${top}px;--fdur:${dur}s;--fdelay:${delay}s`;
        el.innerHTML = avatar(u, '') +
          `<span class="bubble-label">${escHtml(u.displayName)}</span>`;
        const avEl = el.querySelector('.av');
        if (avEl) { avEl.style.cssText += `;width:${sz}px;height:${sz}px;font-size:${Math.round(sz*.46)}px`; }
        el.addEventListener('click', () => App.go('chat', u, 'view-from-right'));
        zone.appendChild(el);
      });
    }

    function drawClock() {
      const svg = root.querySelector('#clock-svg');
      if (!svg) return;
      const t = new Date();
      const h = t.getHours()%12, m = t.getMinutes(), s = t.getSeconds();
      const hA = (h/12)*360+(m/60)*30;
      const mA = (m/60)*360+(s/60)*6;
      const sA = (s/60)*360;
      const pt = (a, r) => [100+r*Math.sin(a*Math.PI/180), 100-r*Math.cos(a*Math.PI/180)];
      const ticks = Array.from({length:60},(_,i)=>{
        const maj = i%5===0;
        const [x1,y1]=pt((i/60)*360,88), [x2,y2]=pt((i/60)*360,maj?78:83);
        return `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"
          stroke="rgba(255,255,255,${maj?.28:.1})" stroke-width="${maj?1.5:.8}" stroke-linecap="round"/>`;
      }).join('');
      const [hx,hy]=pt(hA,48), [mx,my]=pt(mA,66), [sx,sy]=pt(sA,72);
      svg.innerHTML=`<defs>
        <radialGradient id="cg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="rgba(255,255,255,.07)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,.02)"/>
        </radialGradient>
        <filter id="gw"><feGaussianBlur stdDeviation="2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter></defs>
        <circle cx="100" cy="100" r="92" fill="url(#cg)" stroke="rgba(255,255,255,.08)" stroke-width="1"/>
        ${ticks}
        <line x1="100" y1="100" x2="${hx.toFixed(2)}" y2="${hy.toFixed(2)}"
          stroke="rgba(255,255,255,.95)" stroke-width="3.5" stroke-linecap="round" filter="url(#gw)"/>
        <line x1="100" y1="100" x2="${mx.toFixed(2)}" y2="${my.toFixed(2)}"
          stroke="rgba(255,255,255,.85)" stroke-width="2.5" stroke-linecap="round" filter="url(#gw)"/>
        <line x1="100" y1="100" x2="${sx.toFixed(2)}" y2="${sy.toFixed(2)}"
          stroke="#a855f7" stroke-width="1.5" stroke-linecap="round" filter="url(#gw)"/>
        <circle cx="100" cy="100" r="5" fill="#a855f7" filter="url(#gw)"/>
        <circle cx="100" cy="100" r="2.5" fill="white"/>`;
    }
  },

  /* ════════ CHAT ════════ */
  chat(root, contact) {
    const me = getSession();
    if (!me || !contact) { App.go('home'); return; }

    // Track chatted users
    const chatted = new Set(JSON.parse(sessionStorage.getItem('ephem_chatted')||'[]'));
    chatted.add(contact.username);
    sessionStorage.setItem('ephem_chatted', JSON.stringify([...chatted]));

    const cid = DB.convId(me.username, contact.username);

    root.innerHTML = `
      <div class="chat-view">
        <div class="chat-header">
          <button class="back-btn" id="back">‹</button>
          <div class="chat-contact">
            ${avatar(contact, 'sz-sm')}
            <span class="chat-contact-name">${escHtml(contact.displayName)}</span>
            <span id="contact-status" style="font-size:11px;color:var(--success);margin-left:2px">● en ligne</span>
          </div>
          <div class="ephemeral-notice">
            <span class="ep-dot"></span>
            <span style="font-size:11px;color:var(--text-muted)">éphémère</span>
          </div>
        </div>
        <div class="messages-scroll" id="msg-scroll">
          <div class="ephemeral-notice" style="padding-top:16px">
            <span class="ep-dot"></span>
            <span>Les messages disparaissent après lecture</span>
          </div>
        </div>
        <div class="chat-input-row">
          <textarea class="chat-textarea" id="chat-in" placeholder="Message…" rows="1"></textarea>
          <button class="send-btn" id="send-btn" disabled>
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/>
            </svg>
          </button>
        </div>
      </div>`;

    const scroll  = root.querySelector('#msg-scroll');
    const input   = root.querySelector('#chat-in');
    const sendBtn = root.querySelector('#send-btn');

    root.querySelector('#back').addEventListener('click', () => App.go('home'));

    // Watch contact online status
    DB.watchOnline(users => {
      const statusEl = root.querySelector('#contact-status');
      if (!statusEl) return;
      if (users[contact.username]) {
        statusEl.textContent = '● en ligne';
        statusEl.style.color = 'var(--success)';
      } else {
        statusEl.textContent = '● hors ligne';
        statusEl.style.color = 'var(--text-muted)';
      }
    });
    App._unsubs.push(() => DB.offOnline());

    const rendered = new Set();

    function addMsgEl(msg) {
      if (rendered.has(msg.id)) {
        // Update existing
        const el = scroll.querySelector(`[data-id="${msg.id}"]`);
        if (!el) return;
        if (msg.saved) el.classList.add('saved');
        return;
      }
      rendered.add(msg.id);

      const isSent = msg.from === me.username;
      const el = document.createElement('div');
      el.className = `msg ${isSent ? 'sent' : 'received'}${msg.saved ? ' saved' : ''}`;
      el.dataset.id = msg.id;
      el.innerHTML = `
        <div class="msg-bubble">${escHtml(msg.text)}</div>
        <div class="msg-meta">
          <span>${timeAgo(msg.sentAt)}</span>
          ${!isSent && !msg.saved ? `<button class="save-btn" data-id="${msg.id}">✦ garder</button>` : ''}
          ${msg.saved ? '<span style="color:var(--accent);font-size:10px">✦ gardé</span>' : ''}
        </div>`;
      scroll.appendChild(el);
      scroll.scrollTop = scroll.scrollHeight;

      // Mark received as read and schedule ephemeral delete
      if (!isSent && !msg.read) {
        DB.updateMessage(cid, msg.id, { read: true });
        if (!msg.saved) scheduleDelete(msg.id);
      }
    }

    function scheduleDelete(msgId, delay = 10000) {
      setTimeout(async () => {
        const snap = await firebase.database().ref(`/messages/${cid}/${msgId}`).get();
        if (!snap.exists() || snap.val().saved) return;
        const el = scroll.querySelector(`[data-id="${msgId}"]`);
        if (el) {
          el.classList.add('fading');
          setTimeout(() => {
            DB.deleteMessage(cid, msgId);
            el.remove();
          }, 800);
        }
      }, delay);
    }

    // Save button
    scroll.addEventListener('click', e => {
      const btn = e.target.closest('.save-btn');
      if (!btn) return;
      const id = btn.dataset.id;
      DB.updateMessage(cid, id, { saved: true });
      const el = scroll.querySelector(`[data-id="${id}"]`);
      if (el) {
        el.classList.add('saved');
        btn.replaceWith(Object.assign(document.createElement('span'),
          { style: 'color:var(--accent);font-size:10px', textContent: '✦ gardé' }));
      }
    });

    // Real-time messages
    DB.watchMessages(cid, addMsgEl, addMsgEl);
    App._unsubs.push(() => DB.offMessages(cid));

    // Input
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      sendBtn.disabled = !input.value.trim();
    });
    input.addEventListener('keydown', e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); doSend(); } });
    sendBtn.addEventListener('click', doSend);

    function doSend() {
      const text = input.value.trim();
      if (!text) return;
      DB.sendMessage(cid, {
        from: me.username, fromDisplay: me.displayName,
        fromEmoji: me.emoji, fromColor: me.color,
        to: contact.username,
        text, sentAt: Date.now(), read: false, saved: false
      });
      input.value = '';
      input.style.height = 'auto';
      sendBtn.disabled = true;
    }
  },

  /* ════════ STORIES ════════ */
  stories(root) {
    const me = getSession();
    if (!me) { App.go('auth'); return; }

    let allStories = [];
    let onlineMap  = {};

    function render() {
      const myStories = allStories.filter(s => s.userId === me.username);
      const friends   = Object.values(onlineMap).filter(u => u.username !== me.username);
      const theirStories = friends.map(f => ({
        user: f,
        stories: allStories.filter(s => s.userId === f.username)
      })).filter(fs => fs.stories.length > 0);

      root.innerHTML = `
        <div class="stories-view">
          <div class="stories-header">
            <h2>stories</h2>
            <button class="icon-btn" id="back-stories">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="stories-scroll">
            <div class="story-row">
              <div class="row-title">Ma story</div>
              <div class="story-circles">
                <div class="story-circle" id="create-story">
                  <div class="create-story-ring">+</div>
                  <span class="story-name">Ajouter</span>
                </div>
                ${myStories.map(s => ringHtml(me, s, true)).join('')}
              </div>
            </div>
            ${theirStories.length ? `
            <div class="story-row">
              <div class="row-title">En ligne</div>
              <div class="story-circles">
                ${theirStories.map(fs => ringHtml(fs.user, fs.stories[0])).join('')}
              </div>
            </div>` : ''}
            ${!theirStories.length && !myStories.length ? `
            <div style="text-align:center;padding:60px 24px;color:var(--text-muted);font-size:14px;line-height:1.7">
              <div style="font-size:40px;margin-bottom:14px">🌙</div>
              Aucune story pour l'instant.<br>Sois le premier à partager !
            </div>` : ''}
          </div>
        </div>`;

      root.querySelector('#back-stories').addEventListener('click', () => App.go('home'));
      root.querySelector('#create-story').addEventListener('click', openCreate);
      root.querySelectorAll('.story-circle[data-sid]').forEach(el =>
        el.addEventListener('click', () => {
          const s = allStories.find(x => x.id === el.dataset.sid);
          if (s) viewStory(s);
        })
      );
    }

    function ringHtml(user, story, isMine = false) {
      const seen = story.seen?.[me.username];
      return `<div class="story-circle" data-sid="${story.id}">
        <div class="story-ring${seen?' seen':''}">
          <div class="story-ring-inner">${avatar(user,'sz-md')}</div>
        </div>
        <span class="story-name">${escHtml(isMine ? 'Moi' : user.displayName)}</span>
      </div>`;
    }

    function viewStory(story) {
      DB.markStorySeen(story.id, me.username);
      const onlineUser = onlineMap[story.userId];
      const author = onlineUser || { username: story.userId, displayName: story.userDisplay || story.userId, emoji: story.userEmoji || '😊', color: story.userColor || 'hsl(260,60%,60%)' };
      const ov = document.createElement('div');
      ov.className = 'story-viewer fade-in';
      ov.innerHTML = `
        <div class="story-viewer-top">
          <div class="story-bar"><div class="story-bar-fill"></div></div>
          <button class="icon-btn" id="sv-close" style="background:rgba(255,255,255,.08)">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="story-viewer-body" id="sv-tap">
          <div class="story-content-text">${escHtml(story.text)}</div>
        </div>
        <div class="story-viewer-foot">
          <div class="story-author">${avatar(author,'sz-sm')}<span>${escHtml(author.displayName)}</span></div>
          <span style="font-size:12px;color:var(--text-muted)">${timeAgo(story.createdAt)}</span>
        </div>`;
      document.getElementById('app').appendChild(ov);
      const timer = setTimeout(() => { ov.remove(); render(); }, 5000);
      const close = () => { clearTimeout(timer); ov.remove(); render(); };
      ov.querySelector('#sv-close').addEventListener('click', close);
      ov.querySelector('#sv-tap').addEventListener('click', close);
    }

    function openCreate() {
      const ov = document.createElement('div');
      ov.className = 'sheet-overlay fade-in';
      ov.innerHTML = `
        <div class="sheet">
          <div class="sheet-handle"></div>
          <h3>Nouvelle story</h3>
          <textarea class="story-textarea" id="st-text" placeholder="Dis quelque chose…" maxlength="280"></textarea>
          <div class="emoji-strip">
            ${['🌟','🔥','💫','🌙','🌸','❤️','😂','🤩','✨','🎉','🙏','🫶','⚡','🌈','🦋','🎶','💎','🥂','🌺','🏄'].map(e =>
              `<button class="emoji-add-btn" data-e="${e}">${e}</button>`).join('')}
          </div>
          <button class="btn-primary" id="st-post">Publier ✦</button>
        </div>`;
      document.getElementById('app').appendChild(ov);

      ov.querySelectorAll('.emoji-add-btn').forEach(b =>
        b.addEventListener('click', () => {
          const ta = ov.querySelector('#st-text');
          ta.value += b.dataset.e; ta.focus();
        })
      );
      ov.querySelector('#st-post').addEventListener('click', () => {
        const text = ov.querySelector('#st-text').value.trim();
        if (!text) return;
        DB.addStory({
          userId: me.username, userDisplay: me.displayName,
          userEmoji: me.emoji, userColor: me.color,
          text, createdAt: Date.now(), expiresAt: Date.now() + 24*3600000, seen: {}
        });
        ov.remove(); render();
      });
      ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
    }

    // Watch both online users and stories
    DB.watchOnline(users => { onlineMap = users; render(); });
    DB.watchStories(stories => { allStories = stories; render(); });
    App._unsubs.push(() => { DB.offOnline(); DB.offStories(); });

    render();
  },

  /* ════════ PROFILE ════════ */
  profile(root) {
    const me = getSession();
    if (!me) { App.go('auth'); return; }

    let onlineUsers = {};
    let pendingRequests = [];

    function render() {
      const others = Object.values(onlineUsers).filter(u => u.username !== me.username);

      root.innerHTML = `
        <div class="profile-view">
          <div class="profile-header">
            <button class="back-btn" id="back-profile">‹</button>
            <h2>profil</h2>
            <div style="width:34px"></div>
          </div>
          <div class="profile-body">
            ${avatar(me, 'sz-2xl')}
            <div class="profile-name">${escHtml(me.displayName)}</div>
            <div class="profile-username">@${escHtml(me.username)}</div>

            <div class="profile-stats">
              <div class="stat">
                <span class="stat-val" id="online-stat">${others.length}</span>
                <span class="stat-lbl">En ligne</span>
              </div>
              <div class="stat">
                <span class="stat-val" id="msg-count">…</span>
                <span class="stat-lbl">Messages</span>
              </div>
            </div>

            <!-- Share link -->
            <div class="profile-section">
              <div class="section-hd">Inviter</div>
              <button class="btn-accent-sm" id="copy-link-btn" style="width:100%;padding:13px;font-size:14px;border-radius:var(--r-sm)">Copier le lien ✦</button>
            </div>

            ${pendingRequests.length > 0 ? `
            <div class="profile-section">
              <div class="section-hd">Demandes (${pendingRequests.length})</div>
              ${pendingRequests.map(r => `
                <div class="req-item">
                  <div class="req-info">
                    <div class="req-name">${escHtml(r.fromDisplay || r.from)}</div>
                    <div class="req-uname">@${escHtml(r.from)}</div>
                  </div>
                  <div class="req-actions">
                    <button class="btn-ok" data-accept="${escHtml(r.from)}">Accepter</button>
                    <button class="btn-no" data-decline="${escHtml(r.from)}">Refuser</button>
                  </div>
                </div>`).join('')}
            </div>` : ''}

            <!-- Online users -->
            ${others.length > 0 ? `
            <div class="profile-section">
              <div class="section-hd">En ligne maintenant (${others.length})</div>
              ${others.map(u => `
                <div class="friend-item-row">
                  ${avatar(u, 'sz-sm')}
                  <div class="friend-info">
                    <div class="fr-name">${escHtml(u.displayName)}</div>
                    <div class="fr-uname">@${escHtml(u.username)}</div>
                  </div>
                  <button class="btn-accent-sm" data-chat="${u.username}" style="font-size:12px;padding:8px 14px">Message</button>
                </div>`).join('')}
            </div>` : `
            <div style="text-align:center;padding:24px;color:var(--text-muted);font-size:14px;line-height:1.7">
              <div style="font-size:36px;margin-bottom:10px">🌙</div>
              Personne en ligne pour l'instant.<br>Partage le lien à tes amis !
            </div>`}

            <button class="logout-btn" id="logout-btn">Quitter et supprimer mon compte</button>
          </div>
        </div>`;

      root.querySelector('#back-profile').addEventListener('click', () => App.go('home'));
      root.querySelector('#logout-btn').addEventListener('click', () => {
        DB.releaseUsername(me.username);
        clearSession();
        App.go('auth');
      });

      root.querySelector('#copy-link-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
          showToast('Lien copié ✓');
        }).catch(() => {
          showToast('Impossible de copier');
        });
      });

      root.querySelectorAll('[data-chat]').forEach(btn =>
        btn.addEventListener('click', () => {
          const u = onlineUsers[btn.dataset.chat];
          if (u) App.go('chat', u, 'view-from-right');
        })
      );

      root.querySelectorAll('[data-accept]').forEach(btn =>
        btn.addEventListener('click', () => {
          DB.removeRequest(me.username, btn.dataset.accept);
        })
      );
      root.querySelectorAll('[data-decline]').forEach(btn =>
        btn.addEventListener('click', () => {
          DB.removeRequest(me.username, btn.dataset.decline);
        })
      );

      // Count messages
      let count = 0;
      Object.values(onlineUsers).forEach(u => {
        if (u.username === me.username) return;
        firebase.database().ref(`/messages/${DB.convId(me.username, u.username)}`)
          .once('value', s => {
            count += s.numChildren();
            const el = root.querySelector('#msg-count');
            if (el) el.textContent = count;
          });
      });
    }

    DB.watchOnline(users => { onlineUsers = users; render(); });
    App._unsubs.push(() => DB.offOnline());

    DB.watchRequests(me.username, reqs => { pendingRequests = reqs; render(); });
    App._unsubs.push(() => DB.offRequests(me.username));

    render();
  }
};

/* ── Drawer ─────────────────────────────── */
function openDrawer(me, onlineUsers) {
  const chatted  = new Set(JSON.parse(sessionStorage.getItem('ephem_chatted')||'[]'));
  const contacts = [...chatted]
    .map(u => onlineUsers[u])
    .filter(Boolean)
    .filter(u => u.username !== me.username);

  const ov = document.createElement('div');
  ov.className = 'drawer-overlay fade-in';
  ov.innerHTML = `
    <div class="drawer">
      <div class="drawer-header">
        <span class="drawer-title">messages</span>
        <button class="icon-btn" id="close-drawer">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="drawer-search-wrap">
        <span class="search-ico">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input class="drawer-search" id="d-search" placeholder="Rechercher…" autocapitalize="none">
      </div>
      <div class="conv-list" id="d-list">
        ${contacts.length === 0
          ? `<div class="drawer-empty">Aucune conversation.<br>Clique sur un utilisateur en ligne pour écrire ✦</div>`
          : contacts.map(u => convHtml(u)).join('')}
      </div>
    </div>`;

  document.getElementById('app').appendChild(ov);
  ov.querySelector('#close-drawer').addEventListener('click', () => ov.remove());
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });

  ov.querySelectorAll('.conv-item').forEach(el =>
    el.addEventListener('click', () => {
      const u = onlineUsers[el.dataset.u];
      if (u) { ov.remove(); App.go('chat', u, 'view-from-right'); }
    })
  );

  ov.querySelector('#d-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    ov.querySelectorAll('.conv-item').forEach(el => {
      el.style.display = el.dataset.name.includes(q) ? '' : 'none';
    });
  });

  function convHtml(u) {
    return `<div class="conv-item" data-u="${escHtml(u.username)}" data-name="${u.displayName.toLowerCase()}">
      ${avatar(u, 'sz-md')}
      <div class="conv-info">
        <div class="conv-name">${escHtml(u.displayName)}</div>
        <div class="conv-preview" style="display:flex;align-items:center;gap:5px">
          <span style="width:6px;height:6px;border-radius:50%;background:var(--success);display:inline-block;flex-shrink:0"></span>
          en ligne
        </div>
      </div>
    </div>`;
  }
}

/* ── Boot ───────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Restore Firebase config from localStorage if the owner already configured it
  const stored = localStorage.getItem('ephem_firebase_config');
  if (stored) {
    try {
      const c = JSON.parse(stored);
      if (c.apiKey && c.apiKey !== 'SETUP_NEEDED') {
        window.EPHEM_CONFIG = c;
      }
    } catch {}
  }
  App.init();
});
