require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

const products = [
  { name: 'Basmati Rice 5kg', dept: 'Grocery', price: 320, mrp: 380, stock: 50, emoji: '🌾', badge: 'Popular' },
  { name: 'Toor Dal 1kg', dept: 'Grocery', price: 145, mrp: 170, stock: 80, emoji: '🫘' },
  { name: 'Sunflower Oil 1L', dept: 'Grocery', price: 165, mrp: 185, stock: 60, emoji: '🛢' },
  { name: 'LED Bulb 9W', dept: 'Electrical', price: 65, mrp: 90, stock: 120, emoji: '💡', badge: 'Best Buy' },
  { name: 'Electric Wire 10m', dept: 'Electrical', price: 280, mrp: 340, stock: 40, emoji: '🔌' },
  { name: 'Steel Hammer', dept: 'Hardware', price: 220, mrp: 280, stock: 18, emoji: '🔨' },
  { name: 'Mobile Charger', dept: 'Electronics', price: 199, mrp: 299, stock: 35, emoji: '📱', badge: 'Hot' },
  { name: 'Table Fan', dept: 'Electronics', price: 850, mrp: 1100, stock: 10, emoji: '🌀' },
  { name: 'Hybrid Seeds 500g', dept: 'Krushi Kendra', price: 180, mrp: 240, stock: 60, emoji: '🌱', badge: 'Farmer Pick' },
  { name: 'DAP Fertilizer 5kg', dept: 'Krushi Kendra', price: 650, mrp: 780, stock: 25, emoji: '🌿' },
  { name: 'Wooden Chair', dept: 'Furniture', price: 1200, mrp: 1600, stock: 5, emoji: '🛋' },
  { name: 'PVC Pipe 1m', dept: 'Hardware', price: 85, mrp: 110, stock: 100, emoji: '🪛' }
];

const seedDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is missing in .env file');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    await Product.insertMany(products);
    console.log('Products added successfully');
    
    mongoose.connection.close();
  } catch (err) {
    console.error('Error seeding DB:', err);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedDB();
