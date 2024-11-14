const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const env = require('dotenv').config();
const session = require('express-session');
const passport = require('passport');
const { connectDB } = require('./config/database');
const initializePassport = require('./config/passport');
const authController = require('./controllers/authController');
const profileController = require('./controllers/profileController');
const passcodeController = require('./controllers/passcodeController');
const uploadController = require('./controllers/uploadController');
const downloadController = require('./controllers/downloadController');
const authenticateJWT = require('./middleware/authJWT');
const cookieParser = require('cookie-parser');
const MongoDBStore = require('connect-mongodb-session')(session);

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());
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

const dbStore = new MongoDBStore({
    uri: 'mongodb://127.0.0.1:27017/connect_mongodb_session_test',
    collection: 'mySessions'
});

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: dbStore,
    cookie: {
        httpOnly: true,
        secure: false, // Set to true if using HTTPS
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
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
    if (req.isAuthenticated()) {
        res.redirect('/profile');
        return;
    }
    res.render("index", {
        isLandingPage: true,
        hideFooter: true,
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
app.get('/getPasscode', isAuthenticated, passcodeController.getPasscode);
app.post('/generatePasscode', isAuthenticated, passcodeController.generatePasscode);
app.post('/verifyPasscode', passcodeController.verifyPasscode);

// Upload routes
app.get('/upload', (req, res) => {
    if (req.isAuthenticated()) {  
        res.render('upload', { user: req.user });
    } else {
        res.render('upload_guest');
    }
});

// Route for uploading text
app.post('/upload/text', isAuthenticated, uploadController.uploadText);

// Route to handle file uploads
app.post('/upload/file', uploadController.upload.single('file'), uploadController.uploadFile);

app.get('/upload-guest', authenticateJWT, uploadController.uploadGuest);


// Route to view the download page with uploaded texts and files
// Route to view the download page with uploaded texts and files
app.get('/download', isAuthenticated, async (req, res) => {
    try {
        const texts = await downloadController.listTexts(req.user.email);
        const files = await downloadController.listFiles(req.user.email);
        res.render('download', { texts, files });
    } catch (error) {
        console.error('Error loading content:', error);
        res.status(500).send('Failed to load content');
    }
});

// Route to handle file download by ID
app.get('/download/file/:id', isAuthenticated, downloadController.downloadFile);

// Route to preview file content by ID
app.get('/preview/file/:id', isAuthenticated, downloadController.previewFile);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});