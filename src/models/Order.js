const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, name: String, price: Number, qty: Number, total: Number }],
  subtotal: Number, discount: { type: Number, default: 0 }, couponCode: String, couponSaving: { type: Number, default: 0 },
  deliveryCharge: { type: Number, default: 0 }, total: Number,
  type: { type: String, enum: ['delivery','pickup'], required: true },
  deliveryAddress: { name: String, mobile: String, line: String, village: String, taluka: String, district: String, pincode: String, landmark: String },
  status: { type: String, enum: ['Pending','Confirmed','Packed','Out for Delivery','Ready for Pickup','Delivered','Picked Up','Cancelled','Refunded'], default: 'Pending' },
  statusHistory: [{ status: String, updatedAt: { type: Date, default: Date.now }, note: String }],
  payment: { method: { type: String, enum: ['upi','card','netbanking','cod'], required: true }, status: { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' }, razorpayOrderId: String, razorpayPaymentId: String, paidAt: Date },
  adminNotes: String
}, { timestamps: true });
orderSchema.pre('save', async function(next) {
  if (!this.orderId) { const count = await this.constructor.countDocuments(); this.orderId = `#UG${String(10001 + count).padStart(5,'0')}`; }
  next();
});
module.exports = mongoose.model('Order', orderSchema);
