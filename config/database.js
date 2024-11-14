// config/database.js
const { MongoClient, GridFSBucket } = require('mongodb');

let db = null;
let gfs = null;

const connectDB = async () => {
    try {
        const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}/?retryWrites=true&w=majority`;
        const client = new MongoClient(uri);
        await client.connect();
        console.log('Connected to MongoDB');
        db = client.db('4800');
        gfs = new GridFSBucket(db, { bucketName: 'fs' });
        return { db, gfs };
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

const getGFS = () => {
    if (!gfs) throw new Error('GridFS not initialized');
    return gfs;
};

module.exports = {
    connectDB,
    getDB,
    getGFS
};