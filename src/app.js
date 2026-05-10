const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({
  origin: '*',
  credentials: false
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => res.json({ success: true, message: '🛒 UG Bazaar API running!' }));
const { paymentRouter, cartRouter, reviewRouter, couponRouter, adminRouter, notifRouter } = require('./routes/other.routes');
app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/products',      require('./routes/product.routes'));
app.use('/api/orders',        require('./routes/order.routes'));
app.use('/api/payment',       paymentRouter);
app.use('/api/cart',          cartRouter);
app.use('/api/reviews',       reviewRouter);
app.use('/api/coupons',       couponRouter);
app.use('/api/admin',         adminRouter);
app.use('/api/notifications', notifRouter);
app.use('*', (req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));
app.use((err, req, res, next) => res.status(err.statusCode || 500).json({ success: false, message: err.message }));
module.exports = app;
