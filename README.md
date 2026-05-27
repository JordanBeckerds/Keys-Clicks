# éphémère

> *chaque session est unique · tout disparaît*

An ephemeral social media app where accounts exist only for the duration of your browser session. The moment you close the tab, your account is gone — no trace, no history.

Live demo → **[ephemere-8381b.web.app](https://ephemere-8381b.web.app)**

---

## Features

- **Session accounts** — No sign-up, no password. Pick a username and an emoji. When you close the tab, your account disappears automatically (Firebase `onDisconnect()`)
- **Username uniqueness** — Two people can't have the same username at the same time. Enforced in real-time across all connected users
- **Real-time messaging** — Instant messages via Firebase Realtime Database. See users appear and disappear live
- **Ephemeral messages** — Messages auto-delete after being read. Tap ✦ to save one before it vanishes
- **Stories** — Post text/emoji stories visible to all online users. They expire after 24 hours
- **Animated home screen** — SVG analog clock at the center with recently-chatted users orbiting it, and other online users floating below as bubbles

## Design

Built to feel like something between a dream and a memory — everything glows softly and nothing lasts.

- Aurora animated background (pure CSS)
- Glassmorphism panels with backdrop blur
- SVG analog clock with animated hands
- CSS orbit animations for active contacts
- Floating bubble animations for idle contacts
- Mobile-first, notch/safe-area aware

## Stack

| Layer | Tech |
|---|---|
| Frontend | HTML · CSS · Vanilla JS |
| Database | Firebase Realtime Database |
| Hosting | Firebase Hosting |
| Auth | None — session-based identity only |
| Dependencies | Zero |

## Setup

```bash
# 1. Clone
git clone https://github.com/JordanBeckerds/ephemere
cd ephemere

# 2. Add your Firebase config in js/config.js
# (Replace the existing values with your own project)

# 3. Deploy
npm install -g firebase-tools
firebase login
firebase deploy
```

To create your own Firebase project:
1. [console.firebase.google.com](https://console.firebase.google.com) → Create project
2. Realtime Database → Create → **Test mode**
3. Project Settings → Your Apps → Web → copy `apiKey` + `databaseURL`
4. Paste into `js/config.js`

## Structure

```
ephemere/
├── index.html          # App shell
├── css/
│   └── style.css       # All styles (design system, animations, components)
├── js/
│   ├── config.js       # Firebase project config
│   ├── db.js           # Firebase data layer (presence, messages, stories)
│   └── app.js          # Router + all views (auth, home, chat, stories, profile)
├── firebase.json       # Firebase Hosting config
└── .firebaserc         # Firebase project binding
```

---

*Built for a class project · no security model · open database rules*
