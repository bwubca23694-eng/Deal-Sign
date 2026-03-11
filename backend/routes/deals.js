const express = require('express');
const xss     = require('xss');
const Deal    = require('../models/Deal');
const { protect } = require('../middleware/auth');

const router   = express.Router();
const sanitize = str => str ? xss(String(str).trim()) : str;

function isExpired(deal) {
  return deal.expiresAt && new Date() > new Date(deal.expiresAt);
}

function totalAmount(deal) {
  if (deal.paymentType === 'milestone')
    return deal.milestones.reduce((s, m) => s + m.amount, 0);
  return deal.amount || 0;
}

// ── POST /api/deals ───────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const {
      clientName, clientEmail, projectTitle, projectDescription,
      deliveryDate, revisionsIncluded, paymentType,
      amount, milestones, expiresAt, fromTemplate, quickPayNote,
    } = req.body;

    if (!clientName || !projectTitle)
      return res.status(400).json({ message: 'clientName and projectTitle are required' });
    if (!req.user.upiId)
      return res.status(400).json({ message: 'Please set your UPI ID in Settings before creating a deal' });

    const type = paymentType || 'single';

    // Quickpay: only needs title, amount, client name — no description/deliveryDate required
    if (type === 'quickpay') {
      const parsed = Number(amount);
      if (!amount || isNaN(parsed) || parsed < 1)
        return res.status(400).json({ message: 'Amount must be a positive number' });
    } else if (type === 'milestone') {
      if (!projectDescription || !deliveryDate)
        return res.status(400).json({ message: 'projectDescription and deliveryDate are required' });
      if (!Array.isArray(milestones) || milestones.length < 2)
        return res.status(400).json({ message: 'Milestone deals need at least 2 milestones' });
      for (const m of milestones) {
        if (!m.title || !m.amount || !m.dueDate)
          return res.status(400).json({ message: 'Each milestone needs title, amount and dueDate' });
        if (Number(m.amount) < 1)
          return res.status(400).json({ message: 'Each milestone amount must be at least Rs.1' });
      }
    } else {
      if (!projectDescription || !deliveryDate)
        return res.status(400).json({ message: 'projectDescription and deliveryDate are required' });
      const parsed = Number(amount);
      if (!amount || isNaN(parsed) || parsed < 1)
        return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    const deal = await Deal.create({
      freelancer:          req.user._id,
      freelancerName:      req.user.name,
      freelancerUpiId:     req.user.upiId,
      freelancerUpiQr:     req.user.upiQrUrl   || null,
      freelancerSignature: req.user.signatureUrl || null,
      clientName:          sanitize(clientName),
      clientEmail:         clientEmail ? sanitize(clientEmail) : '',
      projectTitle:        sanitize(projectTitle),
      projectDescription:  projectDescription ? sanitize(projectDescription) : '',
      deliveryDate:        deliveryDate || null,
      revisionsIncluded:   Math.max(0, Number(revisionsIncluded) || 1),
      paymentType:         type,
      amount:              type === 'milestone' ? null : Number(amount),
      milestones:          type === 'milestone'
        ? milestones.map(m => ({ title: sanitize(m.title), amount: Number(m.amount), dueDate: m.dueDate, description: sanitize(m.description || '') }))
        : [],
      expiresAt:           expiresAt ? new Date(expiresAt) : null,
      fromTemplate:        fromTemplate || null,
      quickPayNote:        quickPayNote ? sanitize(quickPayNote) : '',
    });

    res.status(201).json(deal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/deals ────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const deals = await Deal.find({ freelancer: req.user._id })
      .select('-signatureData')
      .sort({ createdAt: -1 })
      .limit(500);
    res.json(deals);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GET /api/deals/:dealId — public ──────────────────────────────────────
router.get('/:dealId', async (req, res) => {
  try {
    if (!/^[a-zA-Z0-9]{8,16}$/.test(req.params.dealId))
      return res.status(404).json({ message: 'Deal not found' });

    const deal = await Deal.findOne({ dealId: req.params.dealId }).select('-signatureData');
    if (!deal) return res.status(404).json({ message: 'Deal not found' });

    if (isExpired(deal) && !['signed','paid'].includes(deal.status)) {
      deal.status = 'expired'; await deal.save();
    }
    if (deal.status === 'created') {
      deal.status = 'viewed'; deal.viewedAt = new Date(); await deal.save();
    }
    res.json(deal);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GET /api/deals/:dealId/full — auth-gated, includes signatureData ──────
router.get('/:dealId/full', protect, async (req, res) => {
  try {
    if (!/^[a-zA-Z0-9]{8,16}$/.test(req.params.dealId))
      return res.status(404).json({ message: 'Deal not found' });
    const deal = await Deal.findOne({ dealId: req.params.dealId, freelancer: req.user._id });
    if (!deal) return res.status(404).json({ message: 'Deal not found' });
    res.json(deal);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── PATCH /api/deals/:dealId — edit (only if created) ────────────────────
router.patch('/:dealId', protect, async (req, res) => {
  try {
    const deal = await Deal.findOne({ dealId: req.params.dealId, freelancer: req.user._id });
    if (!deal) return res.status(404).json({ message: 'Deal not found' });
    if (deal.status !== 'created')
      return res.status(400).json({ message: 'Deal can only be edited before the client views it' });

    const allowed = ['clientName','clientEmail','projectTitle','projectDescription',
                     'deliveryDate','revisionsIncluded','paymentType','amount',
                     'milestones','expiresAt','quickPayNote'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (['clientName','clientEmail','projectTitle','projectDescription','quickPayNote'].includes(key))
          deal[key] = sanitize(req.body[key]);
        else
          deal[key] = req.body[key];
      }
    }
    if (deal.paymentType === 'milestone') {
      deal.amount = null;
      deal.milestones = (req.body.milestones || []).map(m => ({
        title: sanitize(m.title), amount: Number(m.amount),
        dueDate: m.dueDate, description: sanitize(m.description || ''),
      }));
    } else { deal.milestones = []; }

    await deal.save();
    const out = deal.toObject(); delete out.signatureData;
    res.json(out);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── PATCH /api/deals/:dealId/sign — public (client signs, not used for quickpay)
router.patch('/:dealId/sign', async (req, res) => {
  try {
    const { signatureData } = req.body;
    if (!signatureData) return res.status(400).json({ message: 'Signature data required' });
    if (!signatureData.startsWith('data:image/'))
      return res.status(400).json({ message: 'Invalid signature format' });
    const sizeKB = Math.round(signatureData.length * 0.75 / 1024);
    if (sizeKB > 500) return res.status(400).json({ message: 'Signature too large, please clear and redraw' });

    if (!/^[a-zA-Z0-9]{8,16}$/.test(req.params.dealId))
      return res.status(404).json({ message: 'Deal not found' });

    const deal = await Deal.findOne({ dealId: req.params.dealId });
    if (!deal) return res.status(404).json({ message: 'Deal not found' });
    if (deal.paymentType === 'quickpay')
      return res.status(400).json({ message: 'Quick Pay deals do not require signing' });
    if (isExpired(deal))
      return res.status(400).json({ message: 'This proposal has expired.' });
    if (['signed','paid'].includes(deal.status))
      return res.status(400).json({ message: 'This deal has already been signed.' });

    deal.status = 'signed'; deal.signatureData = signatureData; deal.signedAt = new Date();
    await deal.save();
    const out = deal.toObject(); delete out.signatureData;
    res.json({ message: 'Signed successfully', deal: out });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── PATCH /api/deals/:dealId/extend ──────────────────────────────────────
router.patch('/:dealId/extend', protect, async (req, res) => {
  try {
    const d = Number(req.body.days);
    if (!d || d < 1 || d > 365) return res.status(400).json({ message: 'Days must be 1–365' });

    const deal = await Deal.findOne({ dealId: req.params.dealId, freelancer: req.user._id });
    if (!deal) return res.status(404).json({ message: 'Deal not found' });
    if (['signed','paid'].includes(deal.status))
      return res.status(400).json({ message: 'Cannot extend a signed or paid deal' });

    const base    = deal.expiresAt && new Date(deal.expiresAt) > new Date() ? new Date(deal.expiresAt) : new Date();
    deal.expiresAt = new Date(base.getTime() + d * 24 * 60 * 60 * 1000);
    if (deal.status === 'expired') deal.status = deal.viewedAt ? 'viewed' : 'created';
    await deal.save();
    const out = deal.toObject(); delete out.signatureData;
    res.json({ message: 'Extended', deal: out });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── PATCH /api/deals/:dealId/paid ────────────────────────────────────────
router.patch('/:dealId/paid', protect, async (req, res) => {
  try {
    const deal = await Deal.findOne({ dealId: req.params.dealId, freelancer: req.user._id });
    if (!deal) return res.status(404).json({ message: 'Deal not found' });
    deal.status = 'paid'; deal.paidAt = new Date();
    await deal.save();
    const out = deal.toObject(); delete out.signatureData;
    res.json({ message: 'Payment confirmed', deal: out });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── PATCH /api/deals/:dealId/milestones/:mId/paid ────────────────────────
router.patch('/:dealId/milestones/:mId/paid', protect, async (req, res) => {
  try {
    const deal = await Deal.findOne({ dealId: req.params.dealId, freelancer: req.user._id });
    if (!deal) return res.status(404).json({ message: 'Deal not found' });
    if (deal.paymentType !== 'milestone') return res.status(400).json({ message: 'Not a milestone deal' });

    const milestone = deal.milestones.id(req.params.mId);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    milestone.status = 'paid'; milestone.paidAt = new Date();
    if (deal.milestones.every(m => m.status === 'paid')) {
      deal.status = 'paid'; deal.paidAt = new Date();
    }
    await deal.save();
    const out = deal.toObject(); delete out.signatureData;
    res.json({ message: 'Milestone paid', deal: out });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── DELETE /api/deals/:dealId ─────────────────────────────────────────────
router.delete('/:dealId', protect, async (req, res) => {
  try {
    const deal = await Deal.findOneAndDelete({ dealId: req.params.dealId, freelancer: req.user._id });
    if (!deal) return res.status(404).json({ message: 'Deal not found' });
    res.json({ message: 'Deal deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;