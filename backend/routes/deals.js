const express = require('express');
const xss     = require('xss');
const Deal    = require('../models/Deal');
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();
const sanitize = str => str ? xss(String(str).trim()) : str;

// POST /api/deals — create a new deal
router.post('/', protect, async (req, res) => {
  try {
    const { clientName, projectTitle, projectDescription, amount, deliveryDate, revisionsIncluded } = req.body;

    if (!clientName || !projectTitle || !projectDescription || !deliveryDate)
      return res.status(400).json({ message: 'All required fields must be provided' });

    const parsedAmount = Number(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount < 1)
      return res.status(400).json({ message: 'Amount must be a positive number' });

    if (!req.user.upiId)
      return res.status(400).json({ message: 'Please set your UPI ID in Settings first' });

    const deal = await Deal.create({
      freelancer:         req.user._id,
      freelancerName:     req.user.name,
      freelancerUpiId:    req.user.upiId,
      freelancerUpiQr:    req.user.upiQrUrl || null,
      clientName:         sanitize(clientName),
      projectTitle:       sanitize(projectTitle),
      projectDescription: sanitize(projectDescription),
      amount:             parsedAmount,
      deliveryDate,
      revisionsIncluded:  Math.max(0, Math.abs(Number(revisionsIncluded) || 1)),
    });

    res.status(201).json(deal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/deals — list all deals for current user
router.get('/', protect, async (req, res) => {
  try {
    const deals = await Deal.find({ freelancer: req.user._id })
      .select('-signatureData')   // never send sig data in list view
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(deals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/deals/:dealId — public, for client viewing (strips signature for safety)
router.get('/:dealId', async (req, res) => {
  try {
    if (!/^[a-zA-Z0-9]{8,16}$/.test(req.params.dealId))
      return res.status(404).json({ message: 'Deal not found' });

    const deal = await Deal.findOne({ dealId: req.params.dealId })
      .select('-signatureData');  // signature not needed for display; only for PDF (separate endpoint)

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

// PATCH /api/deals/:dealId/sign — public (client signs)
router.patch('/:dealId/sign', async (req, res) => {
  try {
    const { signatureData } = req.body;
    if (!signatureData) return res.status(400).json({ message: 'Signature data is required' });
    if (!signatureData.startsWith('data:image/'))
      return res.status(400).json({ message: 'Invalid signature format' });

    // Cap signature size at 500KB to prevent MongoDB bloat
    const sizeKB = Math.round(signatureData.length * 0.75 / 1024);
    if (sizeKB > 500)
      return res.status(400).json({ message: 'Signature image too large. Please clear and redraw.' });

    if (!/^[a-zA-Z0-9]{8,16}$/.test(req.params.dealId))
      return res.status(404).json({ message: 'Deal not found' });

    const deal = await Deal.findOne({ dealId: req.params.dealId });
    if (!deal) return res.status(404).json({ message: 'Deal not found' });

    // Prevent re-signing once signed or paid
    if (['signed', 'paid'].includes(deal.status))
      return res.status(400).json({ message: 'This deal has already been signed.' });

    deal.status        = 'signed';
    deal.signatureData = signatureData;
    deal.signedAt      = new Date();
    await deal.save();

    // Return deal WITHOUT signature data (client already has it locally)
    const dealOut = deal.toObject();
    delete dealOut.signatureData;
    res.json({ message: 'Signed successfully', deal: dealOut });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/deals/:dealId/contract — auth-gated, returns signature for PDF generation
router.get('/:dealId/contract', protect, async (req, res) => {
  try {
    if (!/^[a-zA-Z0-9]{8,16}$/.test(req.params.dealId))
      return res.status(404).json({ message: 'Deal not found' });

    const deal = await Deal.findOne({ dealId: req.params.dealId, freelancer: req.user._id });
    if (!deal) return res.status(404).json({ message: 'Deal not found' });
    if (!deal.signatureData) return res.status(400).json({ message: 'Deal has not been signed yet' });

    res.json(deal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/deals/:dealId/paid — auth-gated, freelancer marks as paid
router.patch('/:dealId/paid', protect, async (req, res) => {
  try {
    const deal = await Deal.findOne({ dealId: req.params.dealId, freelancer: req.user._id });
    if (!deal) return res.status(404).json({ message: 'Deal not found' });

    deal.status = 'paid';
    deal.paidAt = new Date();
    await deal.save();

    const dealOut = deal.toObject();
    delete dealOut.signatureData;
    res.json({ message: 'Payment confirmed', deal: dealOut });
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
