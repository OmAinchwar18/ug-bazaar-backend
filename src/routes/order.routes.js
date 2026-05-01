const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const Product = require('../models/Product');
const { Coupon } = require('../models/other.models');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { notifyCustomer, notifyAdmin } = require('../config/twilio');

router.post('/', protect, async (req,res) => {
  try {
    const { items, type, deliveryAddress, couponCode, paymentMethod } = req.body;
    if (!items?.length) return res.status(400).json({success:false,message:'Cart khali hai'});
    let subtotal=0; const orderItems=[];
    for (const item of items) {
      const p = await Product.findById(item.productId);
      if (!p||!p.isActive) return res.status(400).json({success:false,message:`${item.name} available nahi`});
      if (p.stock < item.qty) return res.status(400).json({success:false,message:`${p.name} ka stock kam hai`});
      subtotal += p.price*item.qty;
      orderItems.push({ product:p._id, name:p.name, price:p.price, qty:item.qty, total:p.price*item.qty });
    }
    let couponSaving=0;
    if (couponCode) { const c=await Coupon.findOne({code:couponCode.toUpperCase(),isActive:true}); if(c){const v=c.isValid(subtotal,req.user._id);if(v.valid){couponSaving=c.getDiscount(subtotal);c.usedCount++;c.usedBy.push(req.user._id);await c.save();}}}
    const deliveryCharge = (subtotal-couponSaving)>=500 ? 0 : 30;
    const total = subtotal-couponSaving+deliveryCharge;
    const order = await Order.create({ user:req.user._id, items:orderItems, subtotal, couponCode, couponSaving, deliveryCharge, total, type, deliveryAddress, statusHistory:[{status:'Pending',note:'Order placed'}], payment:{method:paymentMethod||'cod',status:'pending'} });
    for (const item of orderItems) await Product.findByIdAndUpdate(item.product,{$inc:{stock:-item.qty}});
    notifyCustomer(`+91${req.user.mobile}`,`✅ Order Confirmed!\nID: ${order.orderId}\nTotal: ₹${total}\nUG Bazaar — 8390901925`).catch(()=>{});
    notifyAdmin({orderId:order.orderId,customerName:req.user.name,total,type}).catch(()=>{});
    res.status(201).json({success:true,message:'Order place ho gaya!',order:{_id:order._id,orderId:order.orderId,total,status:order.status}});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});
router.get('/my-orders', protect, async (req,res) => { try { const orders=await Order.find({user:req.user._id}).sort({createdAt:-1}); res.json({success:true,count:orders.length,orders}); } catch(e){ res.status(500).json({success:false,message:e.message}); }});
router.get('/:id', protect, async (req,res) => { try { const q=req.params.id.startsWith('#')?{orderId:req.params.id}:{_id:req.params.id}; const order=await Order.findOne(q).populate('items.product','name emoji'); if(!order) return res.status(404).json({success:false,message:'Order nahi mila'}); res.json({success:true,order}); } catch(e){ res.status(500).json({success:false,message:e.message}); }});
router.put('/:id/cancel', protect, async (req,res) => { try { const order=await Order.findById(req.params.id); if(!order) return res.status(404).json({success:false,message:'Order nahi mila'}); if(['Packed','Out for Delivery','Delivered'].includes(order.status)) return res.status(400).json({success:false,message:`${order.status} — cancel nahi ho sakta`}); order.status='Cancelled'; order.statusHistory.push({status:'Cancelled',note:'Cancelled by customer'}); await order.save(); for(const i of order.items) await Product.findByIdAndUpdate(i.product,{$inc:{stock:i.qty}}); res.json({success:true,message:'Order cancel ho gaya'}); } catch(e){ res.status(500).json({success:false,message:e.message}); }});
router.get('/admin/all', protect, adminOnly, async (req,res) => { try { const {status,page=1,limit=20}=req.query; const f=status?{status}:{}; const orders=await Order.find(f).sort({createdAt:-1}).skip((page-1)*limit).limit(+limit).populate('user','name mobile village'); const total=await Order.countDocuments(f); res.json({success:true,total,orders}); } catch(e){ res.status(500).json({success:false,message:e.message}); }});
router.put('/admin/:id/status', protect, adminOnly, async (req,res) => {
  try {
    const {status,note} = req.body;
    const order = await Order.findById(req.params.id).populate('user','name mobile');
    if (!order) return res.status(404).json({success:false,message:'Order nahi mila'});
    order.status=status; order.statusHistory.push({status,note}); await order.save();
    const msgs = { 'Confirmed':'✅ Order confirm ho gaya!', 'Packed':'📦 Order pack ho gaya!', 'Out for Delivery':'🚀 Order delivery pe hai!', 'Delivered':'🎉 Order deliver ho gaya! Shukriya!' };
    notifyCustomer(`+91${order.user.mobile}`, `${msgs[status]||status}\nOrder: ${order.orderId}\nUG Bazaar — 8390901925`).catch(()=>{});
    res.json({success:true,message:`Status → ${status} | Customer notified!`,order});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});
module.exports = router;
