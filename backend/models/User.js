const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, default: null }, // null for Google-only accounts
  upiId: { type: String, default: '', trim: true },
  googleId: { type: String, default: null },
  avatar: { type: String, default: null }, // Google profile photo URL
  authProvider: { type: String, enum: ['local', 'google', 'both'], default: 'local' }
}, { timestamps: true });

// Hash password before save (only if modified and present)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
