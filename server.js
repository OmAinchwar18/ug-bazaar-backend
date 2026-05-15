require('dotenv').config();
// Force redeploy v2
console.log('ENV CHECK - MONGO_URI:', process.env.MONGO_URI ? 'SET' : 'NOT SET');
console.log('ENV CHECK - PORT:', process.env.PORT);
const app = require('./src/app');
const connectDB = require('./src/config/db');
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 UG Bazaar Backend running on port ${PORT}`);
  });
}).catch(err => {
  console.error('DB Error:', err.message);
  process.exit(1);
});
