const express = require('express');
const xss     = require('xss');
const Deal    = require('../models/Deal');
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const sanitize = (str) => str ? xss(String(str).trim()) : str;

// POST /api/deals
router.post('/', protect, async (req, res) => {
  try {
    const { clientName, projectTitle, projectDescription, amount, deliveryDate, revisionsIncluded } = req.body;
    if (!clientName || !projectTitle || !projectDescription || !amount || !deliveryDate)
      return res.status(400).json({ message: 'All required fields must be provided' });

    if (!req.user.upiId)
      return res.status(400).json({ message: 'Please set your UPI ID in Settings first' });

    const deal = await Deal.create({
      freelancer:           req.user._id,
      freelancerName:       req.user.name,
      freelancerUpiId:      req.user.upiId,
      freelancerUpiQr:      req.user.upiQrUrl || null,
      clientName:           sanitize(clientName),
      projectTitle:         sanitize(projectTitle),
      projectDescription:   sanitize(projectDescription),
      amount:               Math.abs(Number(amount)),
      deliveryDate,
      revisionsIncluded:    Math.abs(Number(revisionsIncluded) || 1)
    });

    res.status(201).json(deal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/deals
router.get('/', protect, async (req, res) => {
  try {
    const deals = await Deal.find({ freelancer: req.user._id }).sort({ createdAt: -1 }).limit(200);
    res.json(deals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/deals/:dealId  (public)
router.get('/:dealId', async (req, res) => {
  try {
    // Validate dealId format to prevent injection
    if (!/^[a-zA-Z0-9]{8,16}$/.test(req.params.dealId))
      return res.status(404).json({ message: 'Deal not found' });

    const deal = await Deal.findOne({ dealId: req.params.dealId });
    if (!deal) return res.status(404).json({ message: 'Deal not found' });

    if (deal.status === 'created') {
      deal.status   = 'viewed';
      deal.viewedAt = new Date();
      await deal.save();
    }

    res.json(deal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/deals/:dealId/sign  (public – client signs)
router.patch('/:dealId/sign', async (req, res) => {
  try {
    const { signatureData } = req.body;
    if (!signatureData) return res.status(400).json({ message: 'Signature data is required' });
    // Basic check – must be a base64 PNG data URL
    if (!signatureData.startsWith('data:image/')) return res.status(400).json({ message: 'Invalid signature format' });

    if (!/^[a-zA-Z0-9]{8,16}$/.test(req.params.dealId))
      return res.status(404).json({ message: 'Deal not found' });

    const deal = await Deal.findOne({ dealId: req.params.dealId });
    if (!deal) return res.status(404).json({ message: 'Deal not found' });
    if (deal.status === 'paid') return res.status(400).json({ message: 'This deal is already completed' });

    deal.status        = 'signed';
    deal.signatureData = signatureData;
    deal.signedAt      = new Date();
    await deal.save();

    res.json({ message: 'Signed successfully', deal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/deals/:dealId/paid
router.patch('/:dealId/paid', protect, async (req, res) => {
  try {
    const deal = await Deal.findOne({ dealId: req.params.dealId, freelancer: req.user._id });
    if (!deal) return res.status(404).json({ message: 'Deal not found' });

    deal.status = 'paid';
    deal.paidAt = new Date();
    await deal.save();

    res.json({ message: 'Payment confirmed', deal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/deals/:dealId
router.delete('/:dealId', protect, async (req, res) => {
  try {
    const deal = await Deal.findOneAndDelete({ dealId: req.params.dealId, freelancer: req.user._id });
    if (!deal) return res.status(404).json({ message: 'Deal not found' });
    res.json({ message: 'Deal deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
