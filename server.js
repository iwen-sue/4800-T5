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
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'ejs');

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
};

// Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}))

// MongoDB
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
let db = null;
client.connect().then(() => {
    console.log('Connected to MongoDB');
    db = client.db('4800');
}).catch(err => {
    console.error(err);
});

// Passport
passport.serializeUser((user, done) => {
    done(null, user._id);
});
passport.deserializeUser(async (id, done) => {
    try {
        const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Local Strategy
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const user = await db.collection('users').findOne({ email });
        if (!user) {
            return done(null, false, { message: 'Incorrect email' });
        }
        if (!await bcrypt.compare(password, user.password)) {
            return done(null, false, { message: 'Incorrect password' });
        }
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await db.collection('users').findOne({ email: profile.emails[0].value });
        if (!user) {
            user = await db.collection('users').insertOne({
                email: profile.emails[0].value,
                password: null
            });
        }
        done(null, user);
    } catch (err) {
        done(err);
    }
}));

// Routes
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
