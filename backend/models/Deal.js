const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const dealSchema = new mongoose.Schema({
  dealId: {
    type: String,
    default: () => uuidv4().split('-')[0] + uuidv4().split('-')[1], // short unique id
    unique: true
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  freelancerName: {
    type: String,
    required: true
  },
  freelancerUpiId: {
    type: String,
    required: true
  },
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  projectTitle: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true
  },
  projectDescription: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 1
  },
  deliveryDate: {
    type: Date,
    required: [true, 'Delivery date is required']
  },
  revisionsIncluded: {
    type: Number,
    default: 1,
    min: 0
  },
  status: {
    type: String,
    enum: ['created', 'viewed', 'signed', 'paid'],
    default: 'created'
  },
  signatureData: {
    type: String, // base64 PNG from canvas
    default: null
  },
  signedAt: {
    type: Date,
    default: null
  },
  viewedAt: {
    type: Date,
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Deal', dealSchema);
