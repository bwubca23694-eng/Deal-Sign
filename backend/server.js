require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('./config/passport');

const authRoutes    = require('./routes/auth');
const dealRoutes    = require('./routes/deals');
const profileRoutes = require('./routes/profile');

const app = express();
const isProd      = process.env.NODE_ENV === 'production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ── Trust proxy (required for rate limiting behind Render/nginx) ──────────
app.set('trust proxy', 1);

// ── Security headers (helmet) ─────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow Cloudinary images
  contentSecurityPolicy: false // React handles its own CSP
}));

// ── CORS ──────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000'],
  credentials: true
}));

// ── Rate limiting ──────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // strict for auth endpoints
  message: { message: 'Too many login attempts, please try again in 15 minutes.' }
});

app.use(globalLimiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Body parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// ── MongoDB injection sanitization ────────────────────────────────────────
app.use(mongoSanitize());

// ── Session ────────────────────────────────────────────────────────────────
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'dev_session_secret_change_this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProd,
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 10 * 60 * 1000 // 10 min – only used during OAuth handoff
  }
};

// ── Connect DB then start server ───────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dealflow')
  .then(() => {
    console.log('✅  MongoDB connected');

    sessionConfig.store = MongoStore.create({
      mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/dealflow'
    });

    app.use(session(sessionConfig));
    app.use(passport.initialize());
    app.use(passport.session());

    // ── Routes ──────────────────────────────────────────────────────────────
    app.use('/api/auth',    authRoutes);
    app.use('/api/deals',   dealRoutes);
    app.use('/api/profile', profileRoutes);

    app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

    // ── 404 for unknown API routes ───────────────────────────────────────────
    app.use('/api/*', (req, res) => res.status(404).json({ message: 'Not found' }));

    // ── Global error handler ─────────────────────────────────────────────────
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(err.status || 500).json({
        message: isProd ? 'Internal server error' : err.message
      });
    });

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
