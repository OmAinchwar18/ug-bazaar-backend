const sendWhatsApp = async (to, msg) => {
  if (!process.env.TWILIO_ACCOUNT_SID || 
      process.env.TWILIO_ACCOUNT_SID.includes('xxx')) {
    console.log('WhatsApp skipped (no credentials):', msg);
    return { success: false };
  }
  try {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const m = await client.messages.create({ 
      from: process.env.TWILIO_WHATSAPP_FROM, 
      to: `whatsapp:${to}`, body: msg 
    });
    return { success: true, sid: m.sid };
  } catch(e) { return { success: false }; }
};

const sendSMS = async (to, msg) => {
  console.log('SMS skipped:', msg);
  return { success: false };
};

const notifyCustomer = async (mobile, message) => {
  return sendWhatsApp(mobile, message);
};

const notifyAdmin = async (o) => {
  return sendWhatsApp(process.env.OWNER_WHATSAPP, 
    `New Order: ${o.orderId} by ${o.customerName} - Rs.${o.total}`);
};

module.exports = { sendWhatsApp, sendSMS, notifyCustomer, notifyAdmin };
