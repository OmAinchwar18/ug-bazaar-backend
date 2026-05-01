const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  mobile:    { type: String, required: true, unique: true },
  email:     { type: String, unique: true, sparse: true, lowercase: true },
  password:  { type: String, minlength: 6, select: false },
  role:      { type: String, enum: ['user','admin'], default: 'user' },
  village:   String, taluka: { type: String, default: 'Talodhi' }, district: { type: String, default: 'Chandrapur' },
  addresses: [{ type: String, village: String, isDefault: Boolean }],
  isVerified:{ type: Boolean, default: false }, isActive: { type: Boolean, default: true },
  otp: { code: String, expiresAt: Date }, lastLogin: Date
}, { timestamps: true });
userSchema.pre('save', async function(next) { if (!this.isModified('password')) return next(); this.password = await bcrypt.hash(this.password, 12); next(); });
userSchema.methods.comparePassword = async function(p) { return bcrypt.compare(p, this.password); };
userSchema.methods.generateToken = function() { return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' }); };
userSchema.methods.generateOTP = function() { const otp = Math.floor(100000 + Math.random() * 900000).toString(); this.otp = { code: otp, expiresAt: new Date(Date.now() + 10*60*1000) }; return otp; };
userSchema.methods.verifyOTP = function(code) { if (!this.otp?.code) return false; if (new Date() > this.otp.expiresAt) return false; return this.otp.code === code; };
module.exports = mongoose.model('User', userSchema);
