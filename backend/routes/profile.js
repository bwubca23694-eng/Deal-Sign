const express  = require('express');
const multer   = require('multer');
const xss      = require('xss');
const User     = require('../models/User');
const { protect } = require('../middleware/auth');
const cloudinary  = require('../config/cloudinary');

const router = express.Router();

// Multer – memory storage, 2MB limit, images only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  }
});

const sanitize = (str) => str ? xss(str.trim()) : str;

// GET /api/profile
router.get('/', protect, (req, res) => {
  const u = req.user;
  res.json({ id: u._id, name: u.name, email: u.email, upiId: u.upiId, upiQrUrl: u.upiQrUrl, avatar: u.avatar, authProvider: u.authProvider });
});

// PATCH /api/profile
router.patch('/', protect, async (req, res) => {
  try {
    const updates = {};
    if (req.body.name  !== undefined) updates.name  = sanitize(req.body.name);
    if (req.body.upiId !== undefined) updates.upiId = sanitize(req.body.upiId);

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
    res.json({ id: user._id, name: user.name, email: user.email, upiId: user.upiId, upiQrUrl: user.upiQrUrl, avatar: user.avatar, authProvider: user.authProvider });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/profile/upi-qr  – upload QR image to Cloudinary
router.post('/upi-qr', protect, upload.single('qr'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file provided' });

    const user = await User.findById(req.user._id);

    // Delete old QR from Cloudinary if exists
    if (user.upiQrPublicId) {
      await cloudinary.uploader.destroy(user.upiQrPublicId).catch(() => {});
    }

    // Upload new QR
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'dealflow/upi-qr', resource_type: 'image', transformation: [{ width: 400, height: 400, crop: 'limit' }] },
        (error, result) => error ? reject(error) : resolve(result)
      );
      stream.end(req.file.buffer);
    });

    user.upiQrUrl      = result.secure_url;
    user.upiQrPublicId = result.public_id;
    await user.save();

    res.json({ upiQrUrl: user.upiQrUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/profile/upi-qr
router.delete('/upi-qr', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.upiQrPublicId) {
      await cloudinary.uploader.destroy(user.upiQrPublicId).catch(() => {});
    }
    user.upiQrUrl = null;
    user.upiQrPublicId = null;
    await user.save();
    res.json({ message: 'QR removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/profile/password
router.patch('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Both fields are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters' });

    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(currentPassword)))
      return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
