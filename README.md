<div align="center">
  <h1>🌱 CarbonZero</h1>
  <p><strong>Track your carbon footprint. Get AI coaching. Join a community acting for a better future.</strong></p>

  <a href="https://carbon-zero-azure.vercel.app"><img src="https://img.shields.io/badge/Live%20App-carbon--zero--azure.vercel.app-1A6B3C?style=for-the-badge&logo=vercel" /></a>
  &nbsp;
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" />
  &nbsp;
  <img src="https://img.shields.io/badge/Firebase-12-FFCA28?style=for-the-badge&logo=firebase" />
  &nbsp;
  <img src="https://img.shields.io/badge/Gemini%20AI-Powered-4285F4?style=for-the-badge&logo=google" />
</div>

---

## What is CarbonZero?

CarbonZero is a **full-stack, production-grade web application** that helps individuals measure, understand, and reduce their personal carbon footprint. Built with the Indian context in mind (using real IPCC emission coefficients and Indian benchmarks), it combines science-backed calculation, AI coaching, gamification, and climate education in one platform.

**🌐 Live:** https://carbon-zero-azure.vercel.app  
**📦 GitHub:** https://github.com/samarthrbhatt10/carbon-zero

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Real Authentication** | Firebase Email/Password auth with password reset & account deletion |
| 🧮 **Carbon Calculator** | 4-step form (Transport, Energy, Diet, Shopping) using IPCC coefficients |
| 📊 **Live Dashboard** | Chart.js donut & line charts with animated visualizations |
| 🌿 **Action Library** | 58 science-backed CO₂ reduction actions with filtering |
| 🏆 **Community Leaderboard** | Points, streaks, badges and city-level rankings |
| 📖 **Educational Hub** | 6 deep-dive climate articles with reading progress tracking |
| 🤖 **AI Coach** | Gemini-powered chat with personalized advice based on your footprint |
| 📣 **Social Share** | Generate and download a shareable carbon report card |
| 👤 **Profile Page** | Edit details, change password, view badges, manage theme |
| 🌙 **Dark / Light / System Theme** | 3-way theme toggle, persisted to cloud |

---

## 🛠️ Tech Stack

### Frontend
- **React 19** + **Vite 8** (with Rolldown bundler)
- **Tailwind CSS 4** — Utility-first styling
- **Chart.js 4** + **react-chartjs-2** — Data visualizations
- **DOMPurify** — XSS input sanitization (OWASP A03)
- **html2canvas** — Screenshot-based share card generation
- **lucide-react** — Icon library

### Backend / Cloud
- **Firebase Authentication** — Session management, email/password login
- **Cloud Firestore** — NoSQL database for profiles, footprint history, actions
- **Firebase Analytics** — Production usage tracking
- **Google Gemini API** — AI coaching with rate limiting + exponential backoff

### Infrastructure
- **Vercel** — Global CDN hosting, zero-config deploys
- **GitHub** — Source control

---

## 🏗️ Architecture

```
App.jsx (State Machine)
│  view: splash → onboarding → auth → app
│  Firebase onAuthStateChanged (single source of truth)
│
├── components/    → UI layer (12 components)
├── services/      → Business logic (Firebase, Gemini, calculations)
├── data/          → JSON datasets (actions, articles, coefficients)
└── utils/         → Validators, formatters, constants
```

**Application flow for new users:**
```
Splash Screen (1.8s) → Onboarding → Register → Dashboard
```
**Application flow for returning users:**
```
Splash Screen → Firebase Auth check → Dashboard (auto-restored)
```

---

## 📐 Carbon Science

Emission coefficients are based on **IPCC 2021** data, calibrated for the Indian context:

| Category | Key coefficient |
|---|---|
| Transport | Petrol car: 0.21 kg CO₂/km |
| Energy | India grid: 0.716 kg CO₂/kWh |
| Diet | High meat: 80 kg CO₂/month |
| Shopping | New clothing: 15 kg CO₂/item |

**Grade scale** (annualized):
`A < 1.5t` · `B < 2.3t` · `C < 4.0t` · `D < 7.0t` · `E < 12.0t` · `F > 12.0t`

**Benchmarks:** India avg 1.9t · Global avg 4.7t · Paris target 2.3t

---

## 🔒 Security

- **DOMPurify** sanitization on all user inputs before processing or storage
- **CSP headers** in `vercel.json` — whitelisted domains only
- **Firestore Rules** — users can only read/write their own documents
- **Re-authentication** required for password change and account deletion
- **`.env` gitignored** — API keys never enter version control
- **Rate limiting** on Gemini API (10 calls/session + exponential backoff)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project with **Authentication** and **Firestore** enabled
- A Google AI Studio Gemini API key

### 1. Clone and install
```bash
git clone https://github.com/samarthrbhatt10/carbon-zero.git
cd carbon-zero
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in your Firebase and Gemini keys in .env
```

### 3. Firebase setup
1. [Firebase Console](https://console.firebase.google.com) → Enable **Email/Password** auth
2. Create **Firestore** database (test mode)
3. Apply security rules (see [Security Rules](#-security))

### 4. Run locally
```bash
npm run dev
# Open http://localhost:5173
```

### 5. Deploy to Vercel
```bash
npm run deploy
```
> Add your Vercel domain to Firebase Auth → Settings → Authorized Domains

---

## 📁 Project Structure

```
carbon-zero/
├── src/
│   ├── App.jsx                    ← Root state machine
│   ├── components/                ← 12 UI components
│   ├── services/
│   │   ├── firebase.js            ← Firebase SDK init
│   │   ├── authService.js         ← Auth CRUD
│   │   ├── dbService.js           ← Firestore operations
│   │   ├── carbonCalc.js          ← IPCC calculations
│   │   ├── geminiAPI.js           ← AI API wrapper
│   │   └── storage.js             ← localStorage helpers
│   ├── data/
│   │   ├── actions.json           ← 58 reduction actions
│   │   ├── articles.json          ← 6 climate articles
│   │   └── coefficients.json      ← IPCC emission factors
│   └── utils/
│       ├── validators.js          ← DOMPurify sanitization
│       ├── constants.js           ← App-wide enums
│       └── formatters.js          ← Number formatting
├── vercel.json                    ← CSP + deployment config
├── vite.config.js                 ← Build + chunk splitting
└── .env.example                   ← Environment variable template
```

---

## 📊 Bundle Size (Production)

| Chunk | Gzipped |
|---|---|
| Firebase SDK | 174 KB |
| React | 60 KB |
| Charts | 62 KB |
| Utilities | 57 KB |
| App code | 56 KB |
| **Total** | **~409 KB** |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feat/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

---

<div align="center">
  <p>Built with ❤️ for the planet</p>
  <p><strong>CarbonZero v1.0.0</strong></p>
</div>
