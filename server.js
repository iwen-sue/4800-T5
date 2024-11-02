const express = require('express');
const env = require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const validator = require('validator');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}))

const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error(err);
});

app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.get('/logout', (req, res) => {
    res.send('Logout');
});

app.get('/login', (req, res) => {
    res.send('Login');
});

app.post('/login', (req, res) => {
    res.send('Login');
});

app.get('/register', (req, res) => {
    res.send('Register');
});

app.post('/register', (req, res) => {
    res.send('Register');
});

app.get('/profile', (req, res) => {
    res.send('Profile');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
