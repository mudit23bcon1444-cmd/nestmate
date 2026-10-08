const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nestmate';
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(` MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(' MongoDB Connection Error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
