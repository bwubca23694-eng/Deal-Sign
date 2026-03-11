const express    = require('express');
const multer     = require('multer');
const xss        = require('xss');
const User       = require('../models/User');
const { protect }  = require('../middleware/auth');
const cloudinary   = require('../config/cloudinary');

const router   = express.Router();
const sanitize = str => str ? xss(str.trim()) : str;

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 3 * 1024 * 1024 },   // 3 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Images only'), false);
    cb(null, true);
  },
});

// GET /api/profile
router.get('/', protect, (req, res) => {
  const u = req.user;
  res.json({
    id: u._id, name: u.name, email: u.email, upiId: u.upiId,
    upiQrUrl: u.upiQrUrl, avatar: u.avatar, authProvider: u.authProvider,
    signatureUrl: u.signatureUrl,
  });
});

// PATCH /api/profile
router.patch('/', protect, async (req, res) => {
  try {
    const updates = {};
    if (req.body.name  !== undefined) updates.name  = sanitize(req.body.name);
    if (req.body.upiId !== undefined) updates.upiId = sanitize(req.body.upiId);
    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
    res.json({ id: user._id, name: user.name, email: user.email, upiId: user.upiId, upiQrUrl: user.upiQrUrl, avatar: user.avatar, authProvider: user.authProvider, signatureUrl: user.signatureUrl });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/profile/upi-qr
router.post('/upi-qr', protect, upload.single('qr'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file provided' });
    const user = await User.findById(req.user._id);
    if (user.upiQrPublicId) await cloudinary.uploader.destroy(user.upiQrPublicId).catch(() => {});

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'dealflow/upi-qr', resource_type: 'image', transformation: [{ width: 400, height: 400, crop: 'limit' }] },
        (err, r) => err ? reject(err) : resolve(r)
      );
      stream.end(req.file.buffer);
    });

    user.upiQrUrl = result.secure_url; user.upiQrPublicId = result.public_id;
    await user.save();
    res.json({ upiQrUrl: user.upiQrUrl });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/profile/upi-qr
router.delete('/upi-qr', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.upiQrPublicId) await cloudinary.uploader.destroy(user.upiQrPublicId).catch(() => {});
    user.upiQrUrl = null; user.upiQrPublicId = null;
    await user.save();
    res.json({ message: 'QR removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/profile/signature — upload signature image to Cloudinary
router.post('/signature', protect, upload.single('signature'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file provided' });

    const user = await User.findById(req.user._id);
    // Delete old signature
    if (user.signaturePublicId) await cloudinary.uploader.destroy(user.signaturePublicId).catch(() => {});

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'dealflow/signatures',
          resource_type: 'image',
          transformation: [{ width: 600, height: 200, crop: 'limit', background: 'white' }],
        },
        (err, r) => err ? reject(err) : resolve(r)
      );
      stream.end(req.file.buffer);
    });

    user.signatureUrl      = result.secure_url;
    user.signaturePublicId = result.public_id;
    await user.save();
    res.json({ signatureUrl: user.signatureUrl });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/profile/signature
router.delete('/signature', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.signaturePublicId) await cloudinary.uploader.destroy(user.signaturePublicId).catch(() => {});
    user.signatureUrl = null; user.signaturePublicId = null;
    await user.save();
    res.json({ message: 'Signature removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
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
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
