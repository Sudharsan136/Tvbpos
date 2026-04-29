const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  name: { type: String, required: true }, // name snapshot
  price: { type: Number, required: true }, // price snapshot at time of order
  taxRate: { type: Number, default: 5 },
  qty: { type: Number, required: true, min: 1 },
  notes: { type: String, default: '' },
  kotSent: { type: Boolean, default: false },
});

const orderSchema = new mongoose.Schema(
  {
    billNumber: { type: String, unique: true, sparse: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: false },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    items: [orderItemSchema],
    kots: [{ type: mongoose.Schema.Types.ObjectId, ref: 'KOT' }],
    
    // Order Types & Integration
    orderType: { type: String, enum: ['dine_in', 'takeaway', 'online'], default: 'dine_in' },
    source: { type: String, enum: ['pos', 'swiggy', 'zomato'], default: 'pos' },
    externalOrderId: { type: String, default: null }, // Swiggy/Zomato Order ID

    // Financials
    subtotal: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },

    // Payment
    paymentMode: {
      type: String,
      enum: ['cash', 'card', 'upi', 'split', 'pending'],
      default: 'pending',
    },
    amountPaid: { type: Number, default: 0 },
    changeReturned: { type: Number, default: 0 },

    // Status
    status: {
      type: String,
      enum: ['open', 'billed', 'paid', 'cancelled'],
      default: 'open',
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
