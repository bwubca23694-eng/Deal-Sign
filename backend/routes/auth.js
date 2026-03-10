const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();
const APP_URL = process.env.APP_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const isProd = process.env.NODE_ENV === 'production';

const makeToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '30d' });

// ── Local register ─────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, upiId } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });

    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, upiId: upiId || '', authProvider: 'local' });

    res.status(201).json({
      token: makeToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, upiId: user.upiId, avatar: user.avatar }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Local login ────────────────────────────────────────────────────────────
router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info?.message || 'Invalid credentials' });
    res.json({
      token: makeToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, upiId: user.upiId, avatar: user.avatar }
    });
  })(req, res, next);
});

// ── Google OAuth – initiate ────────────────────────────────────────────────
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// ── Google OAuth – callback ────────────────────────────────────────────────
router.get('/google/callback',
  passport.authenticate('google', { session: true, failureRedirect: `${FRONTEND_URL}/login?error=google_failed` }),
  (req, res) => {
    // Always redirect to FRONTEND_URL — backend and frontend are on separate domains
    const token = makeToken(req.user._id);
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// ── Get current user ───────────────────────────────────────────────────────
router.get('/me', protect, (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    upiId: req.user.upiId,
    avatar: req.user.avatar,
    authProvider: req.user.authProvider
  });
});

module.exports = router;
