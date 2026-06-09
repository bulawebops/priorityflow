# ⚡ PriorityFlow — Setup Guide

A mobile-first PWA for AI-powered daily task prioritization.

---

## 📁 Project Structure

```
priorityflow/
├── index.html                    # PWA entry point
├── vite.config.js                # Build config
├── package.json
├── public/
│   ├── manifest.json             # PWA manifest
│   └── sw.js                     # Service worker (offline support)
└── src/
    ├── main.jsx                  # App bootstrapper + SW registration
    ├── App.jsx                   # Auth state + root routing
    ├── firebase.js               # 🔧 Firebase config (YOU EDIT THIS)
    ├── store.js                  # Zustand global state
    ├── db.js                     # Firestore data layer
    ├── prioritize.js             # Rules-based + AI prioritization
    ├── styles/
    │   └── global.css            # Design system + CSS variables
    ├── pages/
    │   ├── LoginPage.jsx         # Google sign-in screen
    │   ├── AppShell.jsx          # Bottom nav + layout shell
    │   ├── TodayView.jsx         # Main task view (drag-and-drop)
    │   ├── AnalyticsView.jsx     # Charts dashboard
    │   └── HistoryView.jsx       # Completed task history
    └── components/
        └── TaskModal.jsx         # Add/edit task bottom sheet
```

---

## 🚀 Quick Start

### Step 1 — Firebase Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (e.g. "priorityflow-prod")
3. Enable **Authentication** → Sign-in method → **Google**
4. Enable **Firestore Database** → Start in production mode
5. Go to Project Settings → Your apps → **Add web app**
6. Copy the `firebaseConfig` object

### Step 2 — Add Your Firebase Config

Open `src/firebase.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

Or use environment variables (recommended for production):

Create `.env.local`:
```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Step 3 — Firestore Security Rules

In Firebase Console → Firestore → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Step 4 — Authorized Domains

In Firebase Console → Authentication → Settings → Authorized domains:
- Add your production domain (e.g. `priorityflow.app`)
- `localhost` is already there for development

### Step 5 — Install & Run

```bash
npm install
npm run dev          # Development (http://localhost:3000)
npm run build        # Production build → /dist
```

---

## 🤖 AI Prioritization

The AI sort button calls the Anthropic API (`claude-sonnet-4-20250514`). This works automatically in Claude Artifacts. For standalone deployment, the API call goes to `https://api.anthropic.com/v1/messages` — you'll need to proxy this through a backend to protect your API key.

**Recommended approach for production:**
- Create a serverless function (Vercel/Netlify/Firebase Functions)
- Proxy the Anthropic API call server-side
- Pass your `ANTHROPIC_API_KEY` as a server env var

The rules-based auto-sort works entirely client-side with no API key needed.

---

## 📱 PWA Installation

On mobile (after deploying):
- **iOS**: Open in Safari → Share → "Add to Home Screen"
- **Android**: Open in Chrome → Menu → "Install App"

---

## 🚢 Deployment

### Vercel (recommended)
```bash
npm i -g vercel
vercel --prod
```

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # set public dir to "dist"
npm run build
firebase deploy
```

### Netlify
```bash
npm run build
# Drag /dist folder to netlify.com/drop
```

---

## 🎨 Features

| Feature | Status |
|---|---|
| Google Authentication | ✅ Firebase Auth |
| Task CRUD | ✅ Firestore |
| Category tagging (Work/Business/Church/Personal) | ✅ |
| Urgency levels (Critical/High/Medium/Low) | ✅ |
| Due dates + estimated duration | ✅ |
| Rules-based auto-prioritization | ✅ |
| AI prioritization (Claude) | ✅ |
| Drag-and-drop reordering | ✅ @dnd-kit |
| Daily completion tracking | ✅ |
| History view | ✅ |
| Analytics dashboard | ✅ Recharts |
| Offline support | ✅ Service Worker + IndexedDB |
| Mobile-first design | ✅ |
| PWA installable | ✅ |
| Private user data | ✅ Firestore rules |

---

## 🔧 Customization

### Adding more categories
Edit the `CATEGORIES` array in `TodayView.jsx` and `TaskModal.jsx`.
Add the color in `global.css` under `.cat-*` classes.

### Adjusting prioritization rules
Edit the `URGENCY_WEIGHT` and `CATEGORY_WEIGHT` objects in `prioritize.js`.

### Changing the AI model
Edit the `model` field in `prioritize.js` → `aiPrioritize()`.
