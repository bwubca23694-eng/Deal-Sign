const express  = require('express');
const xss      = require('xss');
const Template = require('../models/Template');
const { protect } = require('../middleware/auth');

const router   = express.Router();
const sanitize = str => str ? xss(String(str).trim()) : str;

// GET /api/templates
router.get('/', protect, async (req, res) => {
  try {
    const templates = await Template.find({ freelancer: req.user._id }).sort({ createdAt: -1 });
    res.json(templates);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/templates
router.post('/', protect, async (req, res) => {
  try {
    const { name, projectTitle, projectDescription, revisionsIncluded, paymentType, amount, milestones } = req.body;
    if (!name || !projectTitle)
      return res.status(400).json({ message: 'name and projectTitle are required' });

    const count = await Template.countDocuments({ freelancer: req.user._id });
    if (count >= 50) return res.status(400).json({ message: 'Template limit reached (50 max)' });

    const tmpl = await Template.create({
      freelancer:         req.user._id,
      name:               sanitize(name),
      projectTitle:       sanitize(projectTitle),
      projectDescription: sanitize(projectDescription),
      revisionsIncluded:  Number(revisionsIncluded) || 1,
      paymentType:        paymentType || 'single',
      amount:             paymentType === 'milestone' ? null : (Number(amount) || null),
      milestones:         paymentType === 'milestone'
        ? milestones.map(m => ({ title: sanitize(m.title), amount: Number(m.amount), description: sanitize(m.description || '') }))
        : [],
    });
    res.status(201).json(tmpl);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/templates/:id — rename only
router.patch('/:id', protect, async (req, res) => {
  try {
    const tmpl = await Template.findOneAndUpdate(
      { _id: req.params.id, freelancer: req.user._id },
      { $set: { name: sanitize(req.body.name) } },
      { new: true }
    );
    if (!tmpl) return res.status(404).json({ message: 'Template not found' });
    res.json(tmpl);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/templates/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const tmpl = await Template.findOneAndDelete({ _id: req.params.id, freelancer: req.user._id });
    if (!tmpl) return res.status(404).json({ message: 'Template not found' });
    res.json({ message: 'Template deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;