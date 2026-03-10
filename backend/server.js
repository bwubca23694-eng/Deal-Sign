require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const passport = require('./config/passport');

const authRoutes = require('./routes/auth');
const dealRoutes = require('./routes/deals');
const profileRoutes = require('./routes/profile');

const app = express();
const isProd = process.env.NODE_ENV === 'production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ── CORS – always required (frontend & backend on separate domains in prod) ──
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Session (needed for OAuth callback hand-off only) ────────────────────────
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'dev_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: isProd, httpOnly: true, maxAge: 10 * 60 * 1000 }
};

// ── Connect to MongoDB ────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dealflow')
  .then(() => {
    console.log('✅  MongoDB connected');

    sessionConfig.store = MongoStore.create({
      mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/dealflow'
    });
    app.use(session(sessionConfig));
    app.use(passport.initialize());
    app.use(passport.session());

    // ── API Routes ────────────────────────────────────────────────────────────
    app.use('/api/auth', authRoutes);
    app.use('/api/deals', dealRoutes);
    app.use('/api/profile', profileRoutes);
    app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`🚀  Server on port ${PORT}  [${isProd ? 'production' : 'development'}]`)
    );
  })
  .catch(err => {
    console.error('❌  MongoDB error:', err.message);
    process.exit(1);
  });

module.exports = app;
