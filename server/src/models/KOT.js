const mongoose = require('mongoose');

const kotItemSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  name: { type: String, required: true }, // snapshot
  qty: { type: Number, required: true, min: 1 },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'preparing', 'done'], default: 'pending' },
});

const kotSchema = new mongoose.Schema(
  {
    kotNumber: { type: String, required: true, unique: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: false },
    tableNumber: { type: Number, required: false }, // snapshot for quick display
    
    // Integration
    orderType: { type: String, enum: ['dine_in', 'takeaway', 'online'], default: 'dine_in' },
    source: { type: String, enum: ['pos', 'swiggy', 'zomato'], default: 'pos' },
    items: [kotItemSchema],
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('KOT', kotSchema);
