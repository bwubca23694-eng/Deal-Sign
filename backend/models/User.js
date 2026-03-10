const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true, maxlength: 100 },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 200 },
  password:     { type: String, default: null },
  upiId:        { type: String, default: '', trim: true, maxlength: 100 },
  upiQrUrl:     { type: String, default: null }, // Cloudinary URL of UPI QR image
  upiQrPublicId:{ type: String, default: null }, // Cloudinary public_id for deletion
  googleId:     { type: String, default: null },
  avatar:       { type: String, default: null },
  authProvider: { type: String, enum: ['local', 'google', 'both'], default: 'local' }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

// Never leak password in JSON responses
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
