const mongoose = require('mongoose');
const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  console.log('MongoDB URI exists:', !!uri);
  if (!uri) {
    console.error('MONGO_URI is not set!');
    process.exit(1);
  }
  const conn = await mongoose.connect(uri);
  console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  return conn;
};
module.exports = connectDB;
