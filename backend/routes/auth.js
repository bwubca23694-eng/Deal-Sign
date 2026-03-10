const express  = require('express');
const jwt      = require('jsonwebtoken');
const passport = require('passport');
const User     = require('../models/User');
const { protect } = require('../middleware/auth');

const router       = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// JWT_SECRET is guaranteed to exist — server.js hard-fails if missing
const makeToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ── Register ──────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, upiId } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, upiId: upiId || '', authProvider: 'local' });

    res.status(201).json({
      token: makeToken(user._id),
      user:  { id: user._id, name: user.name, email: user.email, upiId: user.upiId, avatar: user.avatar },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────
router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info?.message || 'Invalid credentials' });
    res.json({
      token: makeToken(user._id),
      user:  { id: user._id, name: user.name, email: user.email, upiId: user.upiId, avatar: user.avatar },
    });
  })(req, res, next);
});

// ── Google OAuth ──────────────────────────────────────────────────────────
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID)
    return res.status(503).json({ message: 'Google OAuth is not configured on this server' });
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', {
    session: true,
    failureRedirect: `${FRONTEND_URL}/login?error=google_failed`,
  }),
  (req, res) => {
    const token = makeToken(req.user._id);
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// ── Get current user ───────────────────────────────────────────────────────
router.get('/me', protect, (req, res) => {
  const u = req.user;
  res.json({
    id: u._id, name: u.name, email: u.email,
    upiId: u.upiId, avatar: u.avatar, authProvider: u.authProvider,
  });
});

module.exports = router;
