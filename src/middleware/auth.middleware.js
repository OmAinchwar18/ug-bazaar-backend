const jwt = require('jsonwebtoken');
const User = require('../models/User');
const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Login karein pehle' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ success: false, message: 'User nahi mila' });
    next();
  } catch(e) { res.status(401).json({ success: false, message: 'Token invalid' }); }
};
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
};
const optionalAuth = async (req, res, next) => {
  try { const token = req.headers.authorization?.split(' ')[1]; if (token) { const d = jwt.verify(token, process.env.JWT_SECRET); req.user = await User.findById(d.id); } } catch(e) {}
  next();
};
module.exports = { protect, adminOnly, optionalAuth };
