# Keys & Click

Browser-based performance testing suite with four independent tools. No login, no server required — open and test.

**[Live demo → jordanbeckerds.github.io/Keys-Clicks](https://jordanbeckerds.github.io/Keys-Clicks/)**

---

## Tests

| Test | Measures | Options |
|------|----------|--------|
| **Typing Speed** | WPM + accuracy | 15 / 30 / 60 / 120 s · 20 / 40 / 80 words |
| **Click Speed (CPS)** | Clicks per second | 5 / 10 / 15 / 30 / 60 s |
| **Key Reaction** | Key accuracy + count | 30 / 60 / 120 s · physical or on-screen keypad |
| **Mouse Aim** | Hit rate on a moving target | Slow / Normal / Fast / Insane · S / M / L · 15–60 s |

Full EN / FR language toggle on every page.

---

## Run locally

**Static — no install required**
```bash
# open Public/index.html directly, or use any static file server:
npx serve Public
```

**Node.js dev server**
```bash
npm install
npm start        # → http://localhost:3000
npm run dev      # nodemon — auto-reload on save
```

---

## Deploy

The app is fully static. The Node server is optional convenience only.

| Platform | Config |
|----------|--------|
| **GitHub Pages** | Repo Settings → Pages → Source: `main`, folder: `/Public` |
| **Netlify / Vercel** | Set publish directory to `Public` |
| **Self-hosted** | Serve the `Public/` folder with nginx / caddy / apache |

---

## Structure

```
Keys-Clicks/
├── Public/
│   ├── index.html          # app shell (tabs, results modal)
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js          # tab routing, results modal
│       ├── i18n.js         # EN / FR translations
│       ├── typing.js       # Typing Speed module
│       ├── cps.js          # Click Speed module
│       ├── keypress.js     # Key Reaction module
│       └── mouse.js        # Mouse Aim module
├── server.js               # optional Express static server
├── package.json
└── index.html              # root redirect → Public/index.html
```

---

## License

GPL-3.0 — see [LICENSE](LICENSE).
