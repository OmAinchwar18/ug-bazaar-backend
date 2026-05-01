require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 UG Bazaar Backend running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
  });
}).catch(err => { console.error('DB Error:', err.message); process.exit(1); });
