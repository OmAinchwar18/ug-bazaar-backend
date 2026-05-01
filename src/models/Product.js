const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, nameHindi: String, nameMarathi: String, description: String,
  dept: { type: String, required: true, enum: ['Grocery','General Store','Hardware','Electrical','Electronics','Furniture','Krushi Kendra'] },
  price: { type: Number, required: true }, mrp: { type: Number, required: true }, cost: Number,
  stock: { type: Number, default: 0 }, images: [String], emoji: { type: String, default: '🛍' },
  badge: { type: String, enum: ['Popular','Hot','Best Buy','Farmer Pick','New',''] }, tags: [String],
  ratings: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
  isActive: { type: Boolean, default: true }, isFeatured: { type: Boolean, default: false }
}, { timestamps: true });
productSchema.index({ name: 'text', nameHindi: 'text', nameMarathi: 'text', description: 'text', tags: 'text' });
module.exports = mongoose.model('Product', productSchema);
