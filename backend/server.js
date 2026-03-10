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
const APP_URL = process.env.APP_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ── CORS (dev only – in prod we serve React statically) ──────────────────────
if (!isProd) {
  app.use(cors({ origin: FRONTEND_URL, credentials: true }));app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
}

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Session (needed for OAuth callback hand-off only) ─────────────────────────
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'dev_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: isProd, httpOnly: true, maxAge: 10 * 60 * 1000 } // 10 min, just for OAuth
};

// ── Mongoose connect first so MongoStore can use it ───────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dealflow')
  .then(() => {
    console.log('✅  MongoDB connected');

    // Attach session store after DB is up
    sessionConfig.store = MongoStore.create({ mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/dealflow' });
    app.use(session(sessionConfig));
    app.use(passport.initialize());
    app.use(passport.session());

    // ── API Routes ───────────────────────────────────────────────────────────
    app.use('/api/auth', authRoutes);
    app.use('/api/deals', dealRoutes);
    app.use('/api/profile', profileRoutes);
    app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Only serve React build if SERVE_FRONTEND is explicitly set
    if (isProd && process.env.SERVE_FRONTEND === 'true') {
      const buildPath = path.join(__dirname, '../frontend/build');
      app.use(express.static(buildPath));
      app.get('*', (req, res) => {
        if (req.path.startsWith('/api/')) return res.status(404).json({ message: 'Not found' });
        res.sendFile(path.join(buildPath, 'index.html'));
      });
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀  Server on port ${PORT}  [${isProd ? 'production' : 'development'}]`));
  })
  .catch(err => {
    console.error('❌  MongoDB error:', err.message);
    process.exit(1);
  });

module.exports = app;
