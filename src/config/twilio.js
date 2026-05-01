const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const sendWhatsApp = async (to, msg) => { try { const m = await client.messages.create({ from: process.env.TWILIO_WHATSAPP_FROM, to: `whatsapp:${to}`, body: msg }); return { success: true, sid: m.sid }; } catch(e) { return { success: false }; } };
const sendSMS = async (to, msg) => { try { const m = await client.messages.create({ from: process.env.TWILIO_SMS_FROM, to, body: msg }); return { success: true, sid: m.sid }; } catch(e) { return { success: false }; } };
const notifyCustomer = async (mobile, message) => { await Promise.allSettled([sendWhatsApp(mobile, message), sendSMS(mobile, message)]); };
const notifyAdmin = async (o) => sendWhatsApp(process.env.OWNER_WHATSAPP, `🛒 New Order!\nID: ${o.orderId}\nBy: ${o.customerName}\nAmount: ₹${o.total}`);
module.exports = { sendWhatsApp, sendSMS, notifyCustomer, notifyAdmin };
