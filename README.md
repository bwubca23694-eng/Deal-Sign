# DealFlow 🤝

**Create deals. Collect signatures. Get paid via UPI.**

A full-stack SaaS app for Indian freelancers — send a proposal link, client signs it digitally, client pays via UPI. No payment gateway, no friction.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express, MongoDB (Mongoose) |
| Auth | JWT + Google OAuth 2.0 (Passport.js) |
| Frontend | React 18, React Router v6 |
| Payments | UPI Deep Links |
| Hosting | Render (single service — backend serves React build) |

---

## Project Structure

```
dealflow/
├── backend/
│   ├── config/passport.js   ← Google OAuth + local strategy
│   ├── middleware/auth.js   ← JWT protect middleware
│   ├── models/User.js       ← User (local + Google)
│   ├── models/Deal.js       ← Deal schema
│   ├── routes/auth.js       ← /api/auth (login, register, google, me)
│   ├── routes/deals.js      ← /api/deals (CRUD)
│   ├── routes/profile.js    ← /api/profile
│   ├── server.js            ← Entry point, serves React in prod
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Layout.js        ← Sidebar shell
    │   │   └── GoogleButton.js  ← Google OAuth button
    │   ├── context/AuthContext.js
    │   ├── pages/
    │   │   ├── Landing.js       ← Public landing page
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── AuthCallback.js  ← Google OAuth token handler
    │   │   ├── Dashboard.js
    │   │   ├── CreateDeal.js
    │   │   ├── Profile.js
    │   │   └── ClientDeal.js    ← Public deal page (no login needed)
    │   ├── App.js
    │   └── index.css
    └── .env.example
```

---

## Local Development

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Google Cloud project with OAuth credentials

### 1. Clone & install

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/dealflow
JWT_SECRET=<random 32+ char string>
SESSION_SECRET=<another random string>
GOOGLE_CLIENT_ID=<from Google Console>
GOOGLE_CLIENT_SECRET=<from Google Console>
APP_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

### 3. Configure frontend

```bash
cd frontend
cp .env.example .env
# Contains: REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Run

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm start
```

---

## Deploying to Render

This app is designed to run as a **single Render Web Service** — the Express backend serves the compiled React frontend as static files.

### Step 1: Set up MongoDB Atlas
1. Create a free cluster at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Whitelist all IPs (`0.0.0.0/0`) under Network Access
3. Copy your connection string

### Step 2: Set up Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a project → Enable Google+ API or People API
3. Create **OAuth 2.0 Client ID** (Web application)
4. Set Authorized redirect URI: `https://your-app.onrender.com/api/auth/google/callback`
5. Copy Client ID and Client Secret

### Step 3: Deploy on Render
1. Push code to GitHub
2. New Web Service → connect repo
3. Set these:
   - **Root directory**: leave blank (repo root)
   - **Build command**: `cd frontend && npm install && npm run build && cd ../backend && npm install`
   - **Start command**: `cd backend && node server.js`
4. Add environment variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Your Atlas connection string |
| `JWT_SECRET` | Long random string |
| `SESSION_SECRET` | Another long random string |
| `GOOGLE_CLIENT_ID` | From Google Console |
| `GOOGLE_CLIENT_SECRET` | From Google Console |
| `APP_URL` | `https://your-app-name.onrender.com` |

> **Note:** Do NOT set `FRONTEND_URL` in production. `APP_URL` handles everything.

5. Click **Deploy**

---

## Google OAuth Flow

```
User clicks "Continue with Google"
  → GET /api/auth/google
    → Google consent screen
      → GET /api/auth/google/callback
        → JWT generated
          → Redirect to /auth/callback?token=<jwt>
            → React saves token → redirects to /dashboard
```

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | – | Email registration |
| POST | `/api/auth/login` | – | Email login |
| GET | `/api/auth/google` | – | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | – | Google OAuth callback |
| GET | `/api/auth/me` | JWT | Get current user |

### Deals
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/deals` | JWT | Create deal |
| GET | `/api/deals` | JWT | List my deals |
| GET | `/api/deals/:id` | – | Get deal (marks as viewed) |
| PATCH | `/api/deals/:id/sign` | – | Client signs deal |
| PATCH | `/api/deals/:id/paid` | JWT | Confirm payment |
| DELETE | `/api/deals/:id` | JWT | Delete deal |

### Profile
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/profile` | JWT | Get profile |
| PATCH | `/api/profile` | JWT | Update name / UPI ID |
| PATCH | `/api/profile/password` | JWT | Change password |

---

## Deal Status Flow

```
created → viewed → signed → paid
```

---

## UPI Deep Link Format

```
upi://pay?pa=freelancer@upi&pn=Name&am=25000&cu=INR&tn=ProjectTitle
```

Supported apps: Google Pay, PhonePe, Paytm, BHIM, and all compliant UPI apps.
