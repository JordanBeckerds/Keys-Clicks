/* =========================================
   ÉPHÉMÈRE — Main Application
   Single-page app, no framework, pure JS
   ========================================= */

/* ── Seed demo data ────────────────────── */
const DEMO_USERS = [
  { id: 'demo_alice', username: 'alice',  displayName: 'Alice',  emoji: '🌸', color: 'hsl(340,65%,62%)' },
  { id: 'demo_felix', username: 'felix',  displayName: 'Félix',  emoji: '🦊', color: 'hsl(28,72%,58%)'  },
  { id: 'demo_maya',  username: 'maya',   displayName: 'Maya',   emoji: '🌙', color: 'hsl(220,62%,58%)' },
  { id: 'demo_leo',   username: 'leo',    displayName: 'Léo',    emoji: '🌿', color: 'hsl(148,55%,52%)' },
];

const DEMO_MESSAGES = [
  { from:'demo_alice', text:'hey! t\'as vu mon histoire? 👀',          ago: 3*3600000 },
  { from:'demo_alice', text:'mets-moi en photo pour mon premier snap 🌸', ago: 2*3600000 },
  { from:'demo_felix', text:'c\'est quoi ton streak avec alice?? 🔥',   ago: 5*3600000 },
  { from:'demo_maya',  text:'bonne nuit 🌙✨',                           ago: 8*3600000 },
];

const DEMO_STORIES = [
  { userId:'demo_alice', text:'les couchers de soleil comme ça ça devrait être obligatoire 🌅', emoji:'🌅' },
  { userId:'demo_felix', text:'quelqu\'un a du café ? ☕',                                       emoji:'☕' },
  { userId:'demo_maya',  text:'la musique c\'est la vie 🎵🎶',                                   emoji:'🎶' },
];

const EMOJIS = ['😊','😎','🥰','🤩','🤪','🎭','🦋','🌟','🔥','💎','🌙','🌸','🦊','🌿','🎸','🏄','🦁','🐺','🦊','🎩','🎯','💫','⚡','🌈','🍀'];

function seedIfEmpty() {
  if (DB.users.all().length > 0) return;
  DEMO_USERS.forEach(u => DB.users.add(u));
}

function seedForNewUser(uid) {
  // Make demo users friends with the new user
  DEMO_USERS.forEach(d => {
    const demo = DB.users.find(d.id);
    if (!demo) return;
    if (!demo.friends) demo.friends = [];
    if (!demo.friends.includes(uid)) demo.friends.push(uid);
    DB.users.update(d.id, { friends: demo.friends });

    const me = DB.users.find(uid);
    if (!me.friends.includes(d.id)) {
      me.friends.push(d.id);
      DB.users.update(uid, { friends: me.friends });
    }
  });

  // Seed demo messages
  DEMO_MESSAGES.forEach(dm => {
    DB.messages.add({
      id:   'msg_' + Math.random().toString(36).slice(2),
      from: dm.from,
      to:   uid,
      text: dm.text,
      sentAt: Date.now() - dm.ago,
      read: false,
      saved: false
    });
  });

  // Seed demo stories
  DEMO_STORIES.forEach(ds => {
    DB.stories.add({
      id:        'story_' + Math.random().toString(36).slice(2),
      userId:    ds.userId,
      text:      ds.text,
      emoji:     ds.emoji,
      createdAt: Date.now() - Math.random()*18*3600000,
      expiresAt: Date.now() + 6*3600000,
      seen:      []
    });
  });
}

/* ── Helpers ───────────────────────────── */
function uid() { return 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2); }
function mid() { return 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2); }
function sid() { return 's_' + Date.now() + '_' + Math.random().toString(36).slice(2); }

function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 60000)    return 'maintenant';
  if (d < 3600000)  return Math.floor(d/60000) + 'min';
  if (d < 86400000) return Math.floor(d/3600000) + 'h';
  return Math.floor(d/86400000) + 'j';
}

function avatar(user, sizeClass) {
  if (!user) return '';
  const color = user.color || 'hsl(260,60%,60%)';
  return `<div class="av ${sizeClass}" style="background:radial-gradient(circle at 35% 35%, ${lighten(color)}, ${darken(color)})">
    <span>${user.emoji || '😊'}</span>
  </div>`;
}

function lighten(hsl) {
  return hsl.replace(/(\d+)%\)$/, (_, l) => `${Math.min(100, +l+22)}%)`);
}
function darken(hsl) {
  return hsl.replace(/(\d+)%\)$/, (_, l) => `${Math.max(0, +l-22)}%)`);
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Router ────────────────────────────── */
const App = {
  _currentView: null,
  _clockTimer: null,
  _orbitRAF: null,

  go(view, data, anim = 'view-enter') {
    const app = document.getElementById('app');
    if (this._clockTimer) { clearInterval(this._clockTimer); this._clockTimer = null; }
    if (this._orbitRAF)   { cancelAnimationFrame(this._orbitRAF); this._orbitRAF = null; }

    const el = document.createElement('div');
    el.className = `view ${anim}`;
    el.id = 'current-view';

    // Remove old view
    const old = document.getElementById('current-view');
    if (old) old.remove();

    app.appendChild(el);
    this._currentView = view;

    switch (view) {
      case 'auth':    Views.auth(el);          break;
      case 'home':    Views.home(el);          break;
      case 'chat':    Views.chat(el, data);    break;
      case 'stories': Views.stories(el);       break;
      case 'profile': Views.profile(el);       break;
    }
  },

  init() {
    seedIfEmpty();
    const uid = DB.session.get();
    if (uid && DB.users.find(uid)) {
      this.go('home');
    } else {
      this.go('auth', null, 'view-enter');
    }
  }
};

/* ── Views ─────────────────────────────── */
const Views = {

  /* ════════ AUTH ════════ */
  auth(root) {
    let tab = 'login';
    let chosenEmoji = EMOJIS[0];

    function render() {
      root.innerHTML = `
        <div class="auth-view">
          <div class="auth-brand">
            <span class="auth-logo">éphémère</span>
            <span class="auth-tagline">tout s'efface, rien ne s'oublie</span>
          </div>
          <div class="auth-card">
            <div class="auth-tabs">
              <button class="auth-tab ${tab==='login'?'active':''}" data-tab="login">Se connecter</button>
              <button class="auth-tab ${tab==='register'?'active':''}" data-tab="register">Créer un compte</button>
            </div>
            ${tab === 'login' ? renderLogin() : renderRegister()}
          </div>
        </div>`;
      bind();
    }

    function renderLogin() {
      return `<div class="auth-form" id="login-form">
        <div class="form-group">
          <label class="form-label">Nom d'utilisateur</label>
          <input class="form-input" id="login-username" placeholder="ton_pseudo" autocomplete="username" autocapitalize="none" spellcheck="false">
        </div>
        <div class="form-error" id="login-err"></div>
        <button class="btn-primary" id="login-btn">Entrer ✦</button>
      </div>`;
    }

    function renderRegister() {
      return `<div class="auth-form" id="reg-form">
        <div class="form-group">
          <label class="form-label">Nom d'utilisateur</label>
          <input class="form-input" id="reg-username" placeholder="ton_pseudo" autocomplete="username" autocapitalize="none" spellcheck="false">
        </div>
        <div class="form-group">
          <label class="form-label">Prénom affiché</label>
          <input class="form-input" id="reg-name" placeholder="Ton prénom" autocomplete="given-name">
        </div>
        <div class="form-group">
          <label class="form-label">Ton emoji</label>
          <div class="emoji-grid">
            ${EMOJIS.map(e => `<div class="emoji-opt${e===chosenEmoji?' chosen':''}" data-emoji="${e}">${e}</div>`).join('')}
          </div>
        </div>
        <div class="form-error" id="reg-err"></div>
        <button class="btn-primary" id="reg-btn">Créer mon compte ✦</button>
      </div>`;
    }

    function bind() {
      root.querySelectorAll('.auth-tab').forEach(t =>
        t.addEventListener('click', () => { tab = t.dataset.tab; render(); })
      );

      root.querySelectorAll('.emoji-opt').forEach(e =>
        e.addEventListener('click', () => { chosenEmoji = e.dataset.emoji; render(); })
      );

      const loginBtn = root.querySelector('#login-btn');
      if (loginBtn) loginBtn.addEventListener('click', () => {
        const username = root.querySelector('#login-username').value.trim();
        const user = DB.users.byUsername(username);
        if (!user) {
          root.querySelector('#login-err').textContent = 'Utilisateur introuvable.';
          return;
        }
        DB.session.set(user.id);
        App.go('home');
      });

      const regBtn = root.querySelector('#reg-btn');
      if (regBtn) regBtn.addEventListener('click', () => {
        const username = root.querySelector('#reg-username').value.trim().replace(/\s+/g,'_');
        const name     = root.querySelector('#reg-name').value.trim();
        const errEl    = root.querySelector('#reg-err');
        if (!username) { errEl.textContent = 'Choisis un pseudo.'; return; }
        if (!name)     { errEl.textContent = 'Indique ton prénom.'; return; }
        if (DB.users.byUsername(username)) { errEl.textContent = 'Ce pseudo est déjà pris.'; return; }
        const newUser = DB.users.add({
          id: uid(),
          username,
          displayName: name,
          emoji: chosenEmoji,
          color: `hsl(${Math.floor(Math.random()*360)},65%,60%)`,
          friends: [],
          bio: '',
          createdAt: Date.now()
        });
        DB.session.set(newUser.id);
        seedForNewUser(newUser.id);
        App.go('home');
      });

      // Enter key
      root.querySelectorAll('.form-input').forEach(inp =>
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') e.target.closest('.auth-form').querySelector('button.btn-primary').click(); })
      );
    }

    render();
  },

  /* ════════ HOME ════════ */
  home(root) {
    const me = DB.users.find(DB.session.get());
    if (!me) { App.go('auth'); return; }

    const friends = (me.friends || []).map(id => DB.users.find(id)).filter(Boolean);
    const now     = Date.now();

    // A friend is "active" if we messaged in the last 6h
    function isActive(friend) {
      const msgs = DB.messages.between(me.id, friend.id);
      if (!msgs.length) return false;
      return msgs[msgs.length - 1].sentAt > now - 6*3600000;
    }

    const active   = friends.filter(isActive);
    const inactive = friends.filter(f => !isActive(f));

    // Unread count
    const unread = DB.messages.all().filter(m => m.to === me.id && !m.read).length;

    // Pending requests
    const pending = DB.requests.all().filter(r => r.to === me.id).length;

    root.innerHTML = `
      <div class="home-view">
        <!-- Top bar -->
        <div class="topbar">
          <span class="topbar-logo">éphémère</span>
          <button class="hamburger" id="open-drawer" aria-label="Conversations">
            <span></span><span></span><span></span>
            ${unread + pending > 0 ? '<span class="notif-dot"></span>' : ''}
          </button>
        </div>

        <!-- Active zone: clock + orbits -->
        <div class="active-zone" id="active-zone">
          <div class="clock-wrap">
            <svg class="clock-svg" id="clock-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"></svg>
            <div class="orbit-container" id="orbit-container"></div>
          </div>
          ${active.length === 0 && inactive.length === 0 ? '<div class="home-empty"><p>Ajoute des amis<br>depuis ton profil ✦</p></div>' : ''}
        </div>

        <!-- Separator -->
        ${inactive.length > 0 ? `
        <div class="separator">
          <span class="separator-label">inactifs</span>
        </div>` : ''}

        <!-- Inactive floating zone -->
        <div class="inactive-zone" id="inactive-zone"></div>

        <!-- Bottom nav -->
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

    // Orbiting active contacts
    buildOrbits(active);

    // Floating inactive contacts
    buildFloaters(inactive);

    // Nav
    root.querySelectorAll('.nav-btn[data-view]').forEach(btn =>
      btn.addEventListener('click', () => {
        const v = btn.dataset.view;
        if (v !== 'home') App.go(v, null, 'view-from-right');
      })
    );

    // Hamburger → drawer
    root.querySelector('#open-drawer').addEventListener('click', () => openDrawer(me));

    function drawClock() {
      const svg = root.querySelector('#clock-svg');
      if (!svg) return;
      const t = new Date();
      const h = t.getHours() % 12, m = t.getMinutes(), s = t.getSeconds();
      const hA = (h/12)*360 + (m/60)*30;
      const mA = (m/60)*360 + (s/60)*6;
      const sA = (s/60)*360;
      const cx = 100, cy = 100;
      const pt = (angle, r) => [
        cx + r * Math.sin(angle * Math.PI/180),
        cy - r * Math.cos(angle * Math.PI/180)
      ];

      const ticks = Array.from({length: 60}, (_,i) => {
        const a = (i/60)*360;
        const isMajor = i%5===0;
        const r1 = 88, r2 = isMajor ? 78 : 83;
        const [x1,y1] = pt(a, r1), [x2,y2] = pt(a, r2);
        return `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"
          stroke="rgba(255,255,255,${isMajor?0.3:0.1})" stroke-width="${isMajor?1.5:0.8}" stroke-linecap="round"/>`;
      }).join('');

      const [hx,hy] = pt(hA, 48);
      const [mx,my] = pt(mA, 66);
      const [sx,sy] = pt(sA, 72);

      svg.innerHTML = `
        <defs>
          <radialGradient id="cg" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stop-color="rgba(255,255,255,0.07)"/>
            <stop offset="100%" stop-color="rgba(255,255,255,0.02)"/>
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <!-- Face -->
        <circle cx="100" cy="100" r="92" fill="url(#cg)" stroke="rgba(255,255,255,0.09)" stroke-width="1"/>
        <!-- Ticks -->
        ${ticks}
        <!-- Hands -->
        <line x1="100" y1="100" x2="${hx.toFixed(2)}" y2="${hy.toFixed(2)}"
          stroke="rgba(255,255,255,0.95)" stroke-width="3.5" stroke-linecap="round" filter="url(#glow)"/>
        <line x1="100" y1="100" x2="${mx.toFixed(2)}" y2="${my.toFixed(2)}"
          stroke="rgba(255,255,255,0.85)" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>
        <line x1="100" y1="100" x2="${sx.toFixed(2)}" y2="${sy.toFixed(2)}"
          stroke="#a855f7" stroke-width="1.5" stroke-linecap="round" filter="url(#glow)"/>
        <!-- Center -->
        <circle cx="100" cy="100" r="5" fill="#a855f7" filter="url(#glow)"/>
        <circle cx="100" cy="100" r="2.5" fill="white"/>`;
    }

    function buildOrbits(contacts) {
      const container = root.querySelector('#orbit-container');
      if (!contacts.length) return;
      const radii    = [118, 135, 152];
      const durations = [22, 28, 35];
      contacts.forEach((friend, i) => {
        const r   = radii[i % radii.length];
        const dur = durations[i % durations.length] + i * 3;
        const off = i / contacts.length;
        const item = document.createElement('div');
        item.className = 'orbit-item';
        item.style.cssText = `--r:${r}px; --dur:${dur}s; --offset:${off}`;
        item.innerHTML = avatar(friend, 'sz-lg') + `<span class="orbit-label">${escHtml(friend.displayName)}</span>`;
        item.addEventListener('click', () => App.go('chat', friend.id, 'view-from-right'));
        container.appendChild(item);
      });
    }

    function buildFloaters(contacts) {
      const zone = root.querySelector('#inactive-zone');
      if (!contacts.length) return;
      const zoneW = window.innerWidth;
      const zoneH = window.innerHeight * 0.35;
      contacts.forEach((friend, i) => {
        const size = 44 + (i % 3) * 8;
        const left = 10 + (i * 97 + 37) % (zoneW - size - 20);
        const top  = 12 + (i * 61 + 11) % (zoneH - size - 30);
        const dur  = 3.5 + (i % 4) * 0.7;
        const delay = -(i * 0.8 % dur);
        const item = document.createElement('div');
        item.className = 'float-bubble';
        item.style.cssText = `left:${left}px; top:${top}px; --fdur:${dur}s; --fdelay:${delay}s;`;
        item.innerHTML = `
          <div class="av" style="width:${size}px;height:${size}px;font-size:${size*0.46}px;
            background:radial-gradient(circle at 35% 35%, ${lighten(friend.color||'hsl(260,60%,60%)')}, ${darken(friend.color||'hsl(260,60%,60%)')});">
            <span>${friend.emoji||'😊'}</span>
          </div>
          <span class="bubble-label">${escHtml(friend.displayName)}</span>`;
        item.addEventListener('click', () => App.go('chat', friend.id, 'view-from-right'));
        zone.appendChild(item);
      });
    }
  },

  /* ════════ CHAT ════════ */
  chat(root, contactId) {
    const me      = DB.users.find(DB.session.get());
    const contact = DB.users.find(contactId);
    if (!me || !contact) { App.go('home'); return; }

    const streak = DB.streaks.get(me.id, contact.id);

    root.innerHTML = `
      <div class="chat-view">
        <div class="chat-header">
          <button class="back-btn" id="back-btn">‹</button>
          <div class="chat-contact">
            ${avatar(contact, 'sz-sm')}
            <span class="chat-contact-name">${escHtml(contact.displayName)}</span>
            ${streak.count > 1 ? `<span class="chat-streak">🔥${streak.count}</span>` : ''}
          </div>
          <div class="ephemeral-notice">
            <span class="ep-dot"></span>
            <span style="font-size:11px;color:var(--text-muted)">éphémère</span>
          </div>
        </div>
        <div class="messages-scroll" id="msg-scroll"></div>
        <div class="chat-input-row">
          <textarea class="chat-textarea" id="chat-input" placeholder="Message…" rows="1"></textarea>
          <button class="send-btn" id="send-btn" disabled>
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/>
            </svg>
          </button>
        </div>
      </div>`;

    const scroll   = root.querySelector('#msg-scroll');
    const input    = root.querySelector('#chat-input');
    const sendBtn  = root.querySelector('#send-btn');

    root.querySelector('#back-btn').addEventListener('click', () => App.go('home'));

    // Mark messages read & schedule ephemeral deletion
    function loadMessages() {
      const msgs = DB.messages.between(me.id, contact.id);
      scroll.innerHTML = '';
      msgs.forEach(m => renderMsg(m));
      scroll.scrollTop = scroll.scrollHeight;

      // Mark unread ones from contact as read
      msgs.filter(m => m.from === contact.id && !m.read).forEach(m => {
        DB.messages.update(m.id, { read: true });
        scheduleEphemeral(m.id);
      });
    }

    function renderMsg(m) {
      const isSent = m.from === me.id;
      const el = document.createElement('div');
      el.className = `msg ${isSent ? 'sent' : 'received'}${m.saved ? ' saved' : ''}`;
      el.dataset.id = m.id;
      el.innerHTML = `
        <div class="msg-bubble">${escHtml(m.text)}</div>
        <div class="msg-meta">
          <span>${timeAgo(m.sentAt)}</span>
          ${!m.saved && isSent ? '' : ''}
          ${!m.saved && !isSent && m.read ? `<button class="save-btn" data-id="${m.id}">✦ garder</button>` : ''}
          ${m.saved ? '<span style="color:var(--accent);font-size:10px">✦ gardé</span>' : ''}
        </div>`;
      scroll.appendChild(el);
    }

    function scheduleEphemeral(msgId, delay = 8000) {
      setTimeout(() => {
        const msg = DB.messages.all().find(m => m.id === msgId);
        if (!msg || msg.saved) return;
        const el = scroll.querySelector(`[data-id="${msgId}"]`);
        if (el) {
          el.classList.add('fading');
          setTimeout(() => {
            const list = DB.messages.all().filter(m => m.id !== msgId);
            DB.messages.save(list);
            el.remove();
          }, 800);
        }
      }, delay);
    }

    // Save button
    scroll.addEventListener('click', e => {
      const btn = e.target.closest('.save-btn');
      if (!btn) return;
      const msgId = btn.dataset.id;
      DB.messages.update(msgId, { saved: true });
      const el = scroll.querySelector(`[data-id="${msgId}"]`);
      if (el) {
        el.classList.add('saved');
        btn.replaceWith(Object.assign(document.createElement('span'), {
          style: 'color:var(--accent);font-size:10px',
          textContent: '✦ gardé'
        }));
      }
    });

    // Input auto-resize
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      sendBtn.disabled = !input.value.trim();
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
    });

    sendBtn.addEventListener('click', doSend);

    function doSend() {
      const text = input.value.trim();
      if (!text) return;
      const msg = DB.messages.add({
        id: mid(), from: me.id, to: contact.id,
        text, sentAt: Date.now(), read: false, saved: false
      });
      DB.streaks.bump(me.id, contact.id);
      input.value = '';
      input.style.height = 'auto';
      sendBtn.disabled = true;
      renderMsg(msg);
      scroll.scrollTop = scroll.scrollHeight;
    }

    loadMessages();
  },

  /* ════════ STORIES ════════ */
  stories(root) {
    const me = DB.users.find(DB.session.get());
    if (!me) { App.go('auth'); return; }

    function render() {
      const friends  = (me.friends || []).map(id => DB.users.find(id)).filter(Boolean);
      const active   = DB.stories.active();
      const myStory  = active.filter(s => s.userId === me.id);
      const friendStories = friends.map(f => ({
        user: f,
        stories: active.filter(s => s.userId === f.id)
      })).filter(fs => fs.stories.length > 0);

      root.innerHTML = `
        <div class="stories-view">
          <div class="stories-header">
            <h2>stories</h2>
            <button class="icon-btn" id="back-stories">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="stories-scroll">
            <!-- Ma story -->
            <div class="story-row">
              <div class="row-title">Ma story</div>
              <div class="story-circles">
                <div class="story-circle" id="create-story-circle">
                  <div class="create-story-ring" title="Créer une story">+</div>
                  <span class="story-name">Ajouter</span>
                </div>
                ${myStory.map(s => storyCircleHtml(me, s, true)).join('')}
              </div>
            </div>
            <!-- Amis -->
            ${friendStories.length > 0 ? `
            <div class="story-row">
              <div class="row-title">Amis</div>
              <div class="story-circles">
                ${friendStories.map(fs => storyCircleHtml(fs.user, fs.stories[0])).join('')}
              </div>
            </div>` : ''}
            ${friendStories.length === 0 && myStory.length === 0 ? `
            <div style="text-align:center;padding:60px 24px;color:var(--text-muted);font-size:14px;line-height:1.7">
              <div style="font-size:40px;margin-bottom:14px">🌙</div>
              Aucune story pour l'instant.<br>Sois le premier à partager !
            </div>` : ''}
          </div>
        </div>`;

      root.querySelector('#back-stories').addEventListener('click', () => App.go('home'));
      root.querySelector('#create-story-circle').addEventListener('click', () => openCreateStory());

      root.querySelectorAll('.story-circle[data-story-id]').forEach(el => {
        el.addEventListener('click', () => {
          const storyId = el.dataset.storyId;
          const story = DB.stories.active().find(s => s.id === storyId);
          if (story) viewStory(story);
        });
      });
    }

    function storyCircleHtml(user, story, isMine = false) {
      const seen = story.seen && story.seen.includes(me.id);
      return `<div class="story-circle" data-story-id="${story.id}">
        <div class="story-ring${seen ? ' seen' : ''}">
          <div class="story-ring-inner">
            ${avatar(user, 'sz-md')}
          </div>
        </div>
        <span class="story-name">${escHtml(isMine ? 'Moi' : user.displayName)}</span>
      </div>`;
    }

    function viewStory(story) {
      const author = DB.users.find(story.userId);
      DB.stories.markSeen(story.id, me.id);
      const overlay = document.createElement('div');
      overlay.className = 'story-viewer fade-in';
      overlay.innerHTML = `
        <div class="story-viewer-top">
          <div class="story-bar"><div class="story-bar-fill"></div></div>
          <button class="icon-btn" id="close-viewer" style="background:rgba(255,255,255,0.08)">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="story-viewer-body" id="story-tap">
          <div class="story-content-text">${escHtml(story.text)}</div>
        </div>
        <div class="story-viewer-foot">
          <div class="story-author">
            ${avatar(author, 'sz-sm')}
            <span>${escHtml(author ? author.displayName : '?')}</span>
          </div>
          <span style="font-size:12px;color:var(--text-muted)">${timeAgo(story.createdAt)}</span>
        </div>`;
      document.getElementById('app').appendChild(overlay);
      const timer = setTimeout(() => { overlay.remove(); render(); }, 5000);
      overlay.querySelector('#close-viewer').addEventListener('click', () => { clearTimeout(timer); overlay.remove(); render(); });
      overlay.querySelector('#story-tap').addEventListener('click',    () => { clearTimeout(timer); overlay.remove(); render(); });
    }

    function openCreateStory() {
      const overlay = document.createElement('div');
      overlay.className = 'sheet-overlay fade-in';
      overlay.innerHTML = `
        <div class="sheet">
          <div class="sheet-handle"></div>
          <h3>Nouvelle story</h3>
          <textarea class="story-textarea" id="story-text" placeholder="Dis quelque chose…" maxlength="280"></textarea>
          <div class="emoji-strip">
            ${['🌟','🔥','💫','🌙','🌸','❤️','😂','🤩','✨','🎉','🙏','🫶','⚡','🌈','🦋','🎶','💎','🥂','🌺','🏄'].map(e =>
              `<button class="emoji-add-btn" data-e="${e}">${e}</button>`
            ).join('')}
          </div>
          <button class="btn-primary" id="post-story">Publier ✦</button>
        </div>`;
      document.getElementById('app').appendChild(overlay);

      overlay.querySelectorAll('.emoji-add-btn').forEach(btn =>
        btn.addEventListener('click', () => {
          const ta = overlay.querySelector('#story-text');
          ta.value += btn.dataset.e;
          ta.focus();
        })
      );

      overlay.querySelector('#post-story').addEventListener('click', () => {
        const text = overlay.querySelector('#story-text').value.trim();
        if (!text) return;
        DB.stories.add({
          id: sid(), userId: me.id, text,
          createdAt: Date.now(), expiresAt: Date.now() + 24*3600000, seen: []
        });
        overlay.remove();
        render();
      });

      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    }

    render();
  },

  /* ════════ PROFILE ════════ */
  profile(root) {
    const me = DB.users.find(DB.session.get());
    if (!me) { App.go('auth'); return; }

    function render() {
      const friends  = (me.friends || []).map(id => DB.users.find(id)).filter(Boolean);
      const requests = DB.requests.all().filter(r => r.to === me.id);
      const msgCount = DB.messages.all().filter(m => m.from === me.id).length;

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
            ${me.bio ? `<div class="profile-bio">${escHtml(me.bio)}</div>` : ''}
            <div class="profile-stats">
              <div class="stat"><span class="stat-val">${friends.length}</span><span class="stat-lbl">Amis</span></div>
              <div class="stat"><span class="stat-val">${msgCount}</span><span class="stat-lbl">Messages</span></div>
              <div class="stat"><span class="stat-val">${DB.stories.active().filter(s=>s.userId===me.id).length}</span><span class="stat-lbl">Stories</span></div>
            </div>

            <!-- Add friend -->
            <div class="profile-section">
              <div class="section-hd">Ajouter un ami</div>
              <div class="add-friend-row">
                <input class="add-input" id="add-input" placeholder="@pseudo" autocapitalize="none" spellcheck="false">
                <button class="btn-accent-sm" id="add-btn">Ajouter</button>
              </div>
              <div id="add-status"></div>
            </div>

            <!-- Pending requests -->
            ${requests.length > 0 ? `
            <div class="profile-section">
              <div class="section-hd">Demandes d'amis (${requests.length})</div>
              ${requests.map(r => {
                const from = DB.users.find(r.from);
                if (!from) return '';
                return `<div class="req-item" data-from="${r.from}">
                  ${avatar(from, 'sz-md')}
                  <div class="req-info">
                    <div class="req-name">${escHtml(from.displayName)}</div>
                    <div class="req-uname">@${escHtml(from.username)}</div>
                  </div>
                  <div class="req-actions">
                    <button class="btn-ok"  data-action="accept" data-from="${r.from}">✓</button>
                    <button class="btn-no"  data-action="decline" data-from="${r.from}">✕</button>
                  </div>
                </div>`;
              }).join('')}
            </div>` : ''}

            <!-- Friends list -->
            ${friends.length > 0 ? `
            <div class="profile-section">
              <div class="section-hd">Mes amis</div>
              ${friends.map(f => `
                <div class="friend-item-row">
                  ${avatar(f, 'sz-sm')}
                  <div class="friend-info">
                    <div class="fr-name">${escHtml(f.displayName)}</div>
                    <div class="fr-uname">@${escHtml(f.username)}</div>
                  </div>
                  <button class="btn-no" data-chat="${f.id}" style="font-size:11px;padding:6px 12px">Message</button>
                </div>`).join('')}
            </div>` : ''}

            <button class="logout-btn" id="logout-btn">Se déconnecter</button>
          </div>
        </div>`;

      root.querySelector('#back-profile').addEventListener('click', () => App.go('home'));
      root.querySelector('#logout-btn').addEventListener('click', () => { DB.session.clear(); App.go('auth'); });

      // Add friend
      root.querySelector('#add-btn').addEventListener('click', () => {
        const val   = root.querySelector('#add-input').value.trim().replace(/^@/,'');
        const statusEl = root.querySelector('#add-status');
        if (!val) return;
        const target = DB.users.byUsername(val);
        if (!target) { statusEl.innerHTML = `<div class="status-msg err">Utilisateur introuvable.</div>`; return; }
        if (target.id === me.id) { statusEl.innerHTML = `<div class="status-msg err">C'est toi 😄</div>`; return; }
        if ((me.friends||[]).includes(target.id)) { statusEl.innerHTML = `<div class="status-msg ok">Déjà ami ✓</div>`; return; }
        const existing = DB.requests.all().find(r => r.from === me.id && r.to === target.id);
        if (existing) { statusEl.innerHTML = `<div class="status-msg ok">Demande déjà envoyée ✓</div>`; return; }

        // Auto-accept for demo users
        if (target.id.startsWith('demo_')) {
          const meFresh = DB.users.find(me.id);
          const friends = [...(meFresh.friends||[]), target.id];
          DB.users.update(me.id, { friends });
          const targetFriends = [...(target.friends||[]), me.id];
          DB.users.update(target.id, { friends: targetFriends });
          statusEl.innerHTML = `<div class="status-msg ok">${escHtml(target.displayName)} ajouté comme ami ✓</div>`;
          render();
          return;
        }

        DB.requests.add({ from: me.id, to: target.id, sentAt: Date.now() });
        statusEl.innerHTML = `<div class="status-msg ok">Demande envoyée à ${escHtml(target.displayName)} ✓</div>`;
        root.querySelector('#add-input').value = '';
      });

      // Accept / decline
      root.querySelectorAll('[data-action]').forEach(btn =>
        btn.addEventListener('click', () => {
          const fromId = btn.dataset.from;
          const action = btn.dataset.action;
          DB.requests.remove(fromId, me.id);
          if (action === 'accept') {
            const meFresh    = DB.users.find(me.id);
            const fromFresh  = DB.users.find(fromId);
            const mFriends   = [...(meFresh.friends||[])];
            const fFriends   = [...(fromFresh.friends||[])];
            if (!mFriends.includes(fromId)) mFriends.push(fromId);
            if (!fFriends.includes(me.id))  fFriends.push(me.id);
            DB.users.update(me.id,     { friends: mFriends });
            DB.users.update(fromId,    { friends: fFriends });
          }
          render();
        })
      );

      // Chat from friends list
      root.querySelectorAll('[data-chat]').forEach(btn =>
        btn.addEventListener('click', () => App.go('chat', btn.dataset.chat, 'view-from-right'))
      );
    }

    render();
  }
};

/* ── Drawer (chat list) ─────────────────── */
function openDrawer(me) {
  const overlay = document.createElement('div');
  overlay.className = 'drawer-overlay fade-in';

  const friends  = (me.friends||[]).map(id => DB.users.find(id)).filter(Boolean);
  const allMsgs  = DB.messages.all();

  const convs = friends.map(f => {
    const msgs = allMsgs.filter(m => (m.from===me.id&&m.to===f.id)||(m.from===f.id&&m.to===me.id));
    const last = msgs[msgs.length-1];
    const unread = msgs.filter(m=>m.from===f.id&&!m.read).length;
    const streak = DB.streaks.get(me.id, f.id);
    return { friend:f, last, unread, streak };
  }).sort((a,b) => (b.last?.sentAt||0) - (a.last?.sentAt||0));

  overlay.innerHTML = `
    <div class="drawer" id="drawer">
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
        <input class="drawer-search" id="drawer-search" placeholder="Rechercher…" autocapitalize="none">
      </div>
      <div class="conv-list" id="conv-list">
        ${convs.length === 0 ? `<div class="drawer-empty">Aucune conversation.<br>Ajoute des amis depuis ton profil ✦</div>` :
          convs.map(c => convItemHtml(c)).join('')}
      </div>
    </div>`;

  document.getElementById('app').appendChild(overlay);

  overlay.querySelector('#close-drawer').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  overlay.querySelectorAll('.conv-item').forEach(item =>
    item.addEventListener('click', () => {
      overlay.remove();
      App.go('chat', item.dataset.id, 'view-from-right');
    })
  );

  // Search
  overlay.querySelector('#drawer-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    overlay.querySelectorAll('.conv-item').forEach(item => {
      item.style.display = item.dataset.name.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  function convItemHtml({ friend, last, unread, streak }) {
    const preview = last ? (last.from===me.id ? `Toi: ${last.text}` : last.text) : 'Nouvelle conversation';
    return `<div class="conv-item" data-id="${friend.id}" data-name="${escHtml(friend.displayName)}">
      ${avatar(friend, 'sz-md')}
      <div class="conv-info">
        <div class="conv-name">${escHtml(friend.displayName)}</div>
        <div class="conv-preview">${escHtml(preview.slice(0,45))}${preview.length>45?'…':''}</div>
      </div>
      <div class="conv-meta">
        ${last ? `<span class="conv-time">${timeAgo(last.sentAt)}</span>` : ''}
        ${unread > 0 ? `<span class="unread-pill">${unread}</span>` : ''}
        ${streak.count > 1 ? `<span class="streak-tag">🔥${streak.count}</span>` : ''}
      </div>
    </div>`;
  }
}

/* ── Boot ───────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => App.init());
