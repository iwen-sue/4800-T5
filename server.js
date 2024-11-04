const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const env = require('dotenv').config();
const session = require('express-session');
const passport = require('passport');
const { connectDB } = require('./config/database');
const initializePassport = require('./config/passport');
const authController = require('./controllers/authController');
const profileController = require('./controllers/profileController');
const tokenController = require('./controllers/tokenController');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('layout', 'layouts/main');

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
};

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// Initialize Passport configuration
initializePassport();

// Initialize database connection
connectDB().then(() => {
    console.log('Database initialized');
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

// Routes
app.get('/', (req, res) => {
    res.render("index", {
        isLandingPage: true,
        hideFooter: true,
        user: req.user,
    });
});

// Auth routes
app.get('/login', authController.login);
app.post('/login', authController.loginPost);
app.get('/register', authController.register);
app.post('/register', authController.registerPost);
app.get('/logout', authController.logout);

// Google OAuth routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: '/profile',
        failureRedirect: '/login'
    })
);

// Profile routes
app.get('/profile', isAuthenticated, profileController.getProfile);
app.post('/profile/update-info', isAuthenticated, profileController.updateInfo);
app.post('/profile/update-password', isAuthenticated, profileController.updatePassword);
app.post('/profile/unlink-google', isAuthenticated, profileController.unlinkGoogle);
app.post('/profile/delete', isAuthenticated, profileController.deleteAccount);

// Token routes
app.post('/generateToken', isAuthenticated, tokenController.generateToken);

// Upload routes
app.get('/upload', (req, res) => {
    if (req.isAuthenticated()) {  
        res.render('upload', { user: req.user });
    } else {
        res.render('upload_guest');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});