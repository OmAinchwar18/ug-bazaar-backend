const express = require('express');
const crypto  = require('crypto');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { Review, Coupon, Cart, Notification } = require('../models/other.models');
const Product = require('../models/Product');
const Order   = require('../models/Order');
const User    = require('../models/User');

// PAYMENT
const paymentRouter = express.Router();
paymentRouter.post('/create-order', protect, async (req,res) => { try { const razorpay=require('../config/razorpay'); const {amount,orderId}=req.body; const o=await razorpay.orders.create({amount:amount*100,currency:'INR',receipt:orderId}); res.json({success:true,orderId:o.id,amount:o.amount,currency:o.currency,key:process.env.RAZORPAY_KEY_ID}); } catch(e){ res.status(500).json({success:false,message:'Payment create nahi hua'}); }});
paymentRouter.post('/verify', protect, async (req,res) => { try { const {razorpay_order_id,razorpay_payment_id,razorpay_signature,orderId}=req.body; const sign=razorpay_order_id+'|'+razorpay_payment_id; const expected=crypto.createHmac('sha256',process.env.RAZORPAY_KEY_SECRET).update(sign).digest('hex'); if(expected!==razorpay_signature) return res.status(400).json({success:false,message:'Payment verification failed'}); const order=await Order.findById(orderId); if(order){order.payment.status='paid';order.payment.razorpayOrderId=razorpay_order_id;order.payment.razorpayPaymentId=razorpay_payment_id;order.payment.paidAt=new Date();await order.save();} res.json({success:true,message:'Payment verified!'}); } catch(e){ res.status(500).json({success:false,message:e.message}); }});

// CART
const cartRouter = express.Router();
cartRouter.get('/', protect, async (req,res) => { try { const cart=await Cart.findOne({user:req.user._id}).populate('items.product','name price emoji stock'); res.json({success:true,cart:cart||{items:[],total:0}}); } catch(e){ res.status(500).json({success:false,message:e.message}); }});
cartRouter.post('/add', protect, async (req,res) => { try { const {productId,qty=1}=req.body; const p=await Product.findById(productId); if(!p||p.stock<qty) return res.status(400).json({success:false,message:'Product unavailable'}); let cart=await Cart.findOne({user:req.user._id}); if(!cart) cart=new Cart({user:req.user._id,items:[]}); const idx=cart.items.findIndex(i=>i.product.toString()===productId); if(idx>-1) cart.items[idx].qty+=qty; else cart.items.push({product:productId,name:p.name,price:p.price,qty,emoji:p.emoji}); await cart.save(); res.json({success:true,message:'Cart mein add hua!',cart}); } catch(e){ res.status(500).json({success:false,message:e.message}); }});
cartRouter.put('/update/:productId', protect, async (req,res) => { try { const {qty}=req.body; const cart=await Cart.findOne({user:req.user._id}); if(!cart) return res.status(404).json({success:false,message:'Cart nahi mila'}); if(qty<=0) cart.items=cart.items.filter(i=>i.product.toString()!==req.params.productId); else { const idx=cart.items.findIndex(i=>i.product.toString()===req.params.productId); if(idx>-1) cart.items[idx].qty=qty; } await cart.save(); res.json({success:true,cart}); } catch(e){ res.status(500).json({success:false,message:e.message}); }});
cartRouter.delete('/clear', protect, async (req,res) => { try { await Cart.findOneAndUpdate({user:req.user._id},{items:[]}); res.json({success:true}); } catch(e){ res.status(500).json({success:false,message:e.message}); }});

// REVIEW
const reviewRouter = express.Router();
reviewRouter.get('/:productId', async (req,res) => { try { const reviews=await Review.find({product:req.params.productId}).populate('user','name village').sort({createdAt:-1}); res.json({success:true,count:reviews.length,reviews}); } catch(e){ res.status(500).json({success:false,message:e.message}); }});
reviewRouter.post('/', protect, async (req,res) => { try { const {productId,rating,title,text,tags}=req.body; const existing=await Review.findOne({user:req.user._id,product:productId}); if(existing) return res.status(400).json({success:false,message:'Pehle review de chuke ho'}); const order=await Order.findOne({user:req.user._id,'items.product':productId,status:'Delivered'}); const review=await Review.create({user:req.user._id,product:productId,rating,title,text,tags,verified:!!order}); res.status(201).json({success:true,review}); } catch(e){ res.status(500).json({success:false,message:e.message}); }});

// COUPON
const couponRouter = express.Router();
couponRouter.post('/validate', protect, async (req,res) => { try { const {code,orderTotal}=req.body; const coupon=await Coupon.findOne({code:code.toUpperCase(),isActive:true}); if(!coupon) return res.status(404).json({success:false,message:'Coupon nahi mila'}); const v=coupon.isValid(orderTotal,req.user._id); if(!v.valid) return res.status(400).json({success:false,message:v.msg}); const discount=coupon.getDiscount(orderTotal); res.json({success:true,discount,message:`₹${discount} discount!`}); } catch(e){ res.status(500).json({success:false,message:e.message}); }});
couponRouter.get('/', protect, adminOnly, async (req,res) => { try { const coupons=await Coupon.find().sort({createdAt:-1}); res.json({success:true,coupons}); } catch(e){ res.status(500).json({success:false,message:e.message}); }});
couponRouter.post('/', protect, adminOnly, async (req,res) => { try { const c=await Coupon.create(req.body); res.status(201).json({success:true,coupon:c}); } catch(e){ res.status(400).json({success:false,message:e.message}); }});
couponRouter.delete('/:id', protect, adminOnly, async (req,res) => { try { await Coupon.findByIdAndDelete(req.params.id); res.json({success:true}); } catch(e){ res.status(500).json({success:false,message:e.message}); }});

// ADMIN
const adminRouter = express.Router();
adminRouter.get('/dashboard', protect, adminOnly, async (req,res) => { try { const today=new Date(); today.setHours(0,0,0,0); const [totalOrders,todayOrders,totalUsers,totalProducts,todayRev,totalRev]=await Promise.all([Order.countDocuments(),Order.countDocuments({createdAt:{$gte:today}}),User.countDocuments({role:'user'}),Product.countDocuments({isActive:true}),Order.aggregate([{$match:{createdAt:{$gte:today},'payment.status':'paid'}},{$group:{_id:null,total:{$sum:'$total'}}}]),Order.aggregate([{$match:{'payment.status':'paid'}},{$group:{_id:null,total:{$sum:'$total'}}}])]); res.json({success:true,stats:{totalOrders,todayOrders,totalUsers,totalProducts,todayRevenue:todayRev[0]?.total||0,totalRevenue:totalRev[0]?.total||0}}); } catch(e){ res.status(500).json({success:false,message:e.message}); }});
adminRouter.get('/customers', protect, adminOnly, async (req,res) => { try { const users=await User.find({role:'user'}).sort({createdAt:-1}); res.json({success:true,users}); } catch(e){ res.status(500).json({success:false,message:e.message}); }});

// NOTIFICATIONS
const notifRouter = express.Router();
notifRouter.get('/', protect, async (req,res) => { try { const notifs=await Notification.find({user:req.user._id}).sort({createdAt:-1}).limit(50); res.json({success:true,unread:notifs.filter(n=>!n.read).length,notifications:notifs}); } catch(e){ res.status(500).json({success:false,message:e.message}); }});
notifRouter.put('/:id/read', protect, async (req,res) => { try { await Notification.findByIdAndUpdate(req.params.id,{read:true}); res.json({success:true}); } catch(e){ res.status(500).json({success:false,message:e.message}); }});
notifRouter.put('/mark-all-read', protect, async (req,res) => { try { await Notification.updateMany({user:req.user._id,read:false},{read:true}); res.json({success:true}); } catch(e){ res.status(500).json({success:false,message:e.message}); }});

module.exports = { paymentRouter, cartRouter, reviewRouter, couponRouter, adminRouter, notifRouter };
