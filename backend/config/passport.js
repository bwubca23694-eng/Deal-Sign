const passport      = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

const APP_URL = process.env.APP_URL || 'http://localhost:5000';

// ── Local strategy ────────────────────────────────────────────────────────
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const user = await User.findOne({ email });
    if (!user) return done(null, false, { message: 'Invalid email or password' });
    if (!user.password) return done(null, false, { message: 'This account uses Google Sign-In. Please use that instead.' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return done(null, false, { message: 'Invalid email or password' });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// ── Google strategy (only if credentials are present) ────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;

  passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  `${APP_URL}/api/auth/google/callback`,
    scope: ['profile', 'email'],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('No email from Google'), null);

      let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

      if (user) {
        if (!user.googleId) {
          user.googleId     = profile.id;
          user.authProvider = 'both';
          user.avatar       = user.avatar || profile.photos?.[0]?.value;
          await user.save();
        }
      } else {
        user = await User.create({
          name:         profile.displayName,
          email,
          googleId:     profile.id,
          avatar:       profile.photos?.[0]?.value,
          authProvider: 'google',
          password:     null,
        });
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
} else {
  console.warn('⚠  GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — Google OAuth disabled');
}

passport.serializeUser((user, done)   => done(null, user._id.toString()));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
