const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const dealSchema = new mongoose.Schema({
  dealId: {
    type: String,
    default: () => uuidv4().replace(/-/g, '').slice(0, 12),
    unique: true
  },
  freelancer:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  freelancerName:   { type: String, required: true, maxlength: 100 },
  freelancerUpiId:  { type: String, required: true, maxlength: 100 },
  freelancerUpiQr:  { type: String, default: null }, // snapshot of QR at deal creation time
  clientName:       { type: String, required: true, trim: true, maxlength: 100 },
  projectTitle:     { type: String, required: true, trim: true, maxlength: 200 },
  projectDescription: { type: String, required: true, trim: true, maxlength: 5000 },
  amount:           { type: Number, required: true, min: 1, max: 10000000 },
  deliveryDate:     { type: Date, required: true },
  revisionsIncluded:{ type: Number, default: 1, min: 0, max: 100 },
  status:           { type: String, enum: ['created','viewed','signed','paid'], default: 'created' },
  signatureData:    { type: String, default: null }, // base64 PNG
  signedAt:         { type: Date, default: null },
  viewedAt:         { type: Date, default: null },
  paidAt:           { type: Date, default: null }
}, { timestamps: true });

// Index for faster freelancer queries
dealSchema.index({ freelancer: 1, createdAt: -1 });
dealSchema.index({ dealId: 1 });

module.exports = mongoose.model('Deal', dealSchema);
