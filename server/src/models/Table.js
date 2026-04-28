const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, unique: true },
    name: { type: String, required: true }, // e.g. "T-1", "VIP-2"
    capacity: { type: Number, default: 4 },
    status: {
      type: String,
      enum: ['available', 'occupied', 'billed'],
      default: 'available',
    },
    currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    section: { type: String, default: 'Main Hall' }, // e.g. Outdoor, AC, Bar
  },
  { timestamps: true }
);

module.exports = mongoose.model('Table', tableSchema);
