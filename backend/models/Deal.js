const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const milestoneSchema = new mongoose.Schema({
  title:       { type: String, required: true, maxlength: 200 },
  amount:      { type: Number, required: true, min: 1 },
  dueDate:     { type: Date,   required: true },
  description: { type: String, default: '', maxlength: 1000 },
  status:      { type: String, enum: ['pending','paid'], default: 'pending' },
  paidAt:      { type: Date, default: null },
}, { _id: true });

const dealSchema = new mongoose.Schema({
  dealId: {
    type: String,
    default: () => uuidv4().replace(/-/g, '').slice(0, 12),
    unique: true,
  },

  freelancer:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  freelancerName:      { type: String, required: true, maxlength: 100 },
  freelancerUpiId:     { type: String, required: true, maxlength: 100 },
  freelancerUpiQr:     { type: String, default: null },
  freelancerSignature: { type: String, default: null },

  clientName:          { type: String, required: true, trim: true, maxlength: 100 },
  clientEmail:         { type: String, default: '', trim: true, maxlength: 200 },

  projectTitle:        { type: String, required: true, trim: true, maxlength: 200 },
  projectDescription:  { type: String, default: '', trim: true, maxlength: 5000 },
  deliveryDate:        { type: Date, default: null },
  revisionsIncluded:   { type: Number, default: 0, min: 0, max: 100 },

  // 'single' | 'milestone' | 'quickpay'
  paymentType:         { type: String, enum: ['single','milestone','quickpay'], default: 'single' },
  amount:              { type: Number, default: null },
  milestones:          { type: [milestoneSchema], default: [] },

  expiresAt:           { type: Date, default: null },

  // quickpay note (shown below amount on client page)
  quickPayNote:        { type: String, default: '', maxlength: 500 },

  status:              { type: String, enum: ['created','viewed','signed','paid','expired'], default: 'created' },
  signatureData:       { type: String, default: null },
  signedAt:            { type: Date, default: null },
  viewedAt:            { type: Date, default: null },
  paidAt:              { type: Date, default: null },

  fromTemplate:        { type: mongoose.Schema.Types.ObjectId, ref: 'Template', default: null },
}, { timestamps: true });

dealSchema.index({ freelancer: 1, createdAt: -1 });
dealSchema.index({ dealId: 1 });

dealSchema.virtual('totalAmount').get(function () {
  if (this.paymentType === 'milestone')
    return this.milestones.reduce((s, m) => s + m.amount, 0);
  return this.amount || 0;
});

module.exports = mongoose.model('Deal', dealSchema);