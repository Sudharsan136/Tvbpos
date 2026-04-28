const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 5 }, // GST %: 0, 5, 12, 18
    unit: { type: String, default: 'plate' }, // plate, glass, piece
    isVeg: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    imageUrl: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Item', itemSchema);
