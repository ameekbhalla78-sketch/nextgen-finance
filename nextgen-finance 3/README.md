# NextGen Finance 📊

> A stock market simulation platform for high school students.
> 100% virtual — no real money involved. Learn investing risk-free.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run locally
npm run dev
# → Opens at http://localhost:5173

# 3. Build for production
npm run build

# 4. Preview the production build
npm run preview
```

---

## 📁 Project Structure

```
nextgen-finance/
├── src/
│   ├── App.jsx       ← Entire app (all components, pages, logic)
│   └── main.jsx      ← React entry point
├── public/
│   └── favicon.svg   ← App icon
├── index.html        ← HTML shell
├── package.json      ← Dependencies
├── vite.config.js    ← Vite config
└── README.md
```

---

## 🌐 Deploy to Netlify (Free)

```bash
npm run build
```
Then drag the `/dist` folder to **netlify.com/drop**

**Connect your domain:**
1. Netlify → Site Settings → Domain Management → Add custom domain
2. Add these DNS records at your domain registrar:
   ```
   A Record:     @    →  75.2.60.5
   CNAME Record: www  →  your-site.netlify.app
   ```

---

## 🌐 Deploy to Vercel (Free)

```bash
npm install -g vercel
vercel
```
Add your domain in Vercel → Project Settings → Domains.

```
A Record:     @    →  76.76.21.21
CNAME Record: www  →  cname.vercel-dns.com
```

---

## 🔥 Add Firebase (Persistent Accounts)

Right now user data saves to `localStorage`. To enable real cross-device accounts:

1. Go to **console.firebase.google.com** → New Project
2. Enable **Authentication** → Email/Password
3. Enable **Firestore Database**
4. Create `src/firebase.js`:

```js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

Then install: `npm install firebase`

---

## ✨ Features

| Page | Description |
|------|-------------|
| 🏠 Dashboard | Portfolio overview, watchlist, challenges, activity feed |
| 📈 Markets | 16 simulated stocks with live price animation |
| 💼 Portfolio | Holdings table, P&L, sector pie chart, trade log |
| 📚 Learn Hub | 12 lessons with quizzes and XP rewards |
| 🤖 AI Coach | Chat with Claude AI for finance tutoring |
| 🧪 Simulator | Test aggressive vs conservative strategies |
| ⚡ Challenges | Milestone badges and XP system |
| 🏆 Leaderboard | Global and XP rankings |
| 🌡️ Market Mood | Fear/Greed index + sector heat map |
| ⚖️ Compare | Side-by-side stock comparison with AI analysis |
| 🏆 Tournaments | Timed competitions with live countdown |
| 📖 Glossary | 20 finance terms with AI explanations |
| 📋 My Report | Weekly AI-generated progress summary |

---

## ⚠️ Disclaimer

This is a **100% educational simulation**. All stock prices are simulated
and do not reflect real market data. No real money is ever involved.
Always consult a licensed financial advisor for real investment decisions.
