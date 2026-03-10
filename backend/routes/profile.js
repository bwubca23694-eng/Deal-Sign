const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/profile — get freelancer profile
router.get('/', protect, async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    upiId: req.user.upiId
  });
});

// PATCH /api/profile — update profile (name, upiId)
router.patch('/', protect, async (req, res) => {
  try {
    const { name, upiId } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (upiId !== undefined) updates.upiId = upiId;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      upiId: user.upiId
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/profile/password — change password
router.patch('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
