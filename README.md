# DealFlow — Freelancer Deal App

A full-stack MVP for freelancers to create project deals, share links with clients, collect digital signatures, and receive UPI payments.

---

## Tech Stack

- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT Auth
- **Frontend**: React 18, React Router v6, Axios
- **Payments**: UPI Deep Links (no payment gateway needed)
- **Signatures**: HTML5 Canvas (touch + mouse)

---

## Project Structure

```
freelancer-deal-app/
├── backend/
│   ├── models/         # Mongoose models (User, Deal)
│   ├── routes/         # Express routes (auth, deals, profile)
│   ├── middleware/      # JWT auth middleware
│   ├── server.js       # Entry point
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/      # Login, Register, Dashboard, CreateDeal, Profile, ClientDeal
│   │   ├── components/ # Layout (sidebar nav)
│   │   ├── context/    # AuthContext (JWT + user state)
│   │   ├── App.js      # Routes
│   │   └── index.css   # Global styles
│   └── .env.example
└── README.md
```

---

## Setup Instructions

### Prerequisites
- Node.js v16+
- MongoDB (local or Atlas)

---

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/freelancer-deal-app
JWT_SECRET=change_this_to_a_long_random_string
FRONTEND_URL=http://localhost:3000
```

Start the backend:
```bash
npm run dev      # development (with nodemon)
npm start        # production
```

Backend runs at: `http://localhost:5000`

---

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start the frontend:
```bash
npm start
```

Frontend runs at: `http://localhost:3000`

---

## Usage Guide

### Freelancer
1. Register at `/register` with name, email, password
2. Go to **Settings** and add your UPI ID (e.g. `yourname@upi`)
3. Click **New Deal** and fill in project details
4. Copy the generated deal link and share with client

### Client
1. Open the deal link (e.g. `http://yourdomain.com/deal/abc123`)
2. Review project details
3. Sign the agreement using touch/mouse signature pad
4. Tap **Pay via UPI** to open any UPI app and complete payment

### After Payment
- Freelancer goes to Dashboard and clicks **Mark as Paid** on the signed deal

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new freelancer |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user (auth required) |

### Deals
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/deals` | Create deal (auth required) |
| GET | `/api/deals` | List all your deals (auth required) |
| GET | `/api/deals/:dealId` | Get deal by ID (public, marks as viewed) |
| PATCH | `/api/deals/:dealId/sign` | Client signs deal (public) |
| PATCH | `/api/deals/:dealId/paid` | Confirm payment (auth required) |
| DELETE | `/api/deals/:dealId` | Delete deal (auth required) |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get profile (auth required) |
| PATCH | `/api/profile` | Update name/UPI ID (auth required) |
| PATCH | `/api/profile/password` | Change password (auth required) |

---

## Deal Status Flow

```
created → viewed → signed → paid
```

- **created**: Deal was created by freelancer
- **viewed**: Client opened the deal link
- **signed**: Client drew and confirmed their signature
- **paid**: Freelancer manually confirmed payment received

---

## UPI Deep Link Format

```
upi://pay?pa=freelancer@upi&pn=FreelancerName&am=25000&cu=INR&tn=ProjectTitle
```

Opens supported apps: Google Pay, PhonePe, Paytm, BHIM, and all UPI-compatible apps.

---

## Production Deployment

### Backend (e.g. Railway, Render, EC2)
1. Set environment variables
2. Use `npm start`
3. Point `MONGO_URI` to MongoDB Atlas

### Frontend (e.g. Vercel, Netlify)
1. Set `REACT_APP_API_URL` to your deployed backend URL
2. Run `npm run build`
3. Deploy the `build/` folder

---

## Notes

- Signature data is stored as base64 PNG in MongoDB (consider S3 for production at scale)
- UPI payment confirmation is manual — integrate a payment webhook for automation
- JWT tokens expire in 30 days
