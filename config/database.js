// config/database.js
const { MongoClient } = require('mongodb');

let db = null;

const connectDB = async () => {
    try {
        const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}/?retryWrites=true&w=majority`;
        const client = new MongoClient(uri);
        await client.connect();
        console.log('Connected to MongoDB');
        db = client.db('4800');
        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const getDB = () => {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
};

module.exports = {
    connectDB,
    getDB
};