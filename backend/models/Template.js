const mongoose = require('mongoose');

const templateMilestoneSchema = new mongoose.Schema({
  title:       { type: String, required: true, maxlength: 200 },
  amount:      { type: Number, required: true, min: 1 },
  description: { type: String, default: '', maxlength: 1000 },
}, { _id: true });

const templateSchema = new mongoose.Schema({
  freelancer:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:              { type: String, required: true, trim: true, maxlength: 100 }, // template label
  projectTitle:      { type: String, required: true, trim: true, maxlength: 200 },
  projectDescription:{ type: String, required: true, trim: true, maxlength: 5000 },
  revisionsIncluded: { type: Number, default: 1, min: 0, max: 100 },
  paymentType:       { type: String, enum: ['single','milestone'], default: 'single' },
  amount:            { type: Number, default: null },
  milestones:        { type: [templateMilestoneSchema], default: [] },
}, { timestamps: true });

templateSchema.index({ freelancer: 1, createdAt: -1 });

module.exports = mongoose.model('Template', templateSchema);
