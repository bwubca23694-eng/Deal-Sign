require('dotenv').config();

// ── Hard-fail on missing critical env vars ───────────────────────────────
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET', 'SESSION_SECRET'];
const MISSING = REQUIRED_ENV.filter(k => !process.env[k]);
if (MISSING.length) {
  console.error(`❌  Missing required environment variables: ${MISSING.join(', ')}`);
  console.error('    Copy .env.example to .env and fill in all values.');
  process.exit(1);
}

const express       = require('express');
const cors          = require('cors');
const helmet        = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit     = require('express-rate-limit');
const mongoose      = require('mongoose');
const session       = require('express-session');
const MongoStore    = require('connect-mongo');
const passport      = require('./config/passport');

const authRoutes    = require('./routes/auth');
const dealRoutes    = require('./routes/deals');
const profileRoutes = require('./routes/profile');

const app = express();
const isProd       = process.env.NODE_ENV === 'production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ── Trust proxy ───────────────────────────────────────────────────────────
app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// ── CORS ──────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000'],
  credentials: true,
}));

// ── Rate limiting ──────────────────────────────────────────────────────────
const limiter = (max) => rateLimit({
  windowMs: 15 * 60 * 1000,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

app.use(limiter(200));                              // global
app.use('/api/auth/login',       limiter(20));      // brute-force protection
app.use('/api/auth/register',    limiter(20));
app.use('/api/profile/password', limiter(10));      // password change protection

// ── Body parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));            // reduced from 15mb — sig capped at 500KB
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── MongoDB injection sanitization ────────────────────────────────────────
app.use(mongoSanitize());

// ── Connect DB then boot ───────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected');

    // ── Session (only used during OAuth handoff) ──────────────────────────
    app.use(session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
      cookie: {
        secure: isProd,
        httpOnly: true,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 10 * 60 * 1000,  // 10 min – only needed for OAuth handoff
      },
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    // ── Routes ─────────────────────────────────────────────────────────────
    app.use('/api/auth',    authRoutes);
    app.use('/api/deals',   dealRoutes);
    app.use('/api/profile', profileRoutes);

    app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

    app.use('/api/*', (req, res) => res.status(404).json({ message: 'Not found' }));

    // ── Global error handler ────────────────────────────────────────────────
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(err.status || 500).json({
        message: isProd ? 'Internal server error' : err.message,
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
