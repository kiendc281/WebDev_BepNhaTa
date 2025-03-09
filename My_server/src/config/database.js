const mongoose = require('mongoose');
require('dotenv').config();

async function connect() {
    try {
        await mongoose.connect(process.env.DB_URL || 'mongodb://127.0.0.1:27017/BEPNHATA');
        console.log('MongoDB Connected to BEPNHATA database');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

module.exports = { connect };