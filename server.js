// server.js
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const env = require('dotenv').config();
const session = require('express-session');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { connectDB } = require('./config/database');
const initializePassport = require('./config/passport');
const upload = require("./config/multer");
const authController = require('./controllers/authController');
const profileController = require('./controllers/profileController');
const passcodeController = require('./controllers/passcodeController');
const uploadController = require('./controllers/uploadController');
const downloadController = require('./controllers/downloadController');
const conditionalAuth = require('./middleware/authMiddleware');
const cookieParser = require('cookie-parser');
const MongoDBStore = require('connect-mongodb-session')(session);
const browserSync = require("browser-sync").create();


const app = express();
const PORT = 3000;

// Browser-Sync configuration
browserSync.init({
    proxy: `http://localhost:${PORT}`, // Proxy server
    files: ["views/**/*.ejs", "public/**/*.{css,js}"],
    port: 4000, // See the live changes on port 4000
    open: false, // Prevent browser auto-opening
});

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
        res.redirect('/download');
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
        successRedirect: '/download',
        failureRedirect: '/login'
    })
);


// Profile routes
app.get('/profile', isAuthenticated, profileController.getProfile);
app.post('/profile/update-info', isAuthenticated, profileController.updateInfo);
app.post('/profile/update-password', isAuthenticated, profileController.updatePassword);
app.post('/profile/unlink-google', isAuthenticated, profileController.unlinkGoogle);
app.post('/profile/delete', isAuthenticated, profileController.deleteAccount);
app.post("/profile/upload", isAuthenticated, upload.single("profilePicture"), profileController.uploadProfilePicture);

// Token routes
app.post('/generatePasscode', isAuthenticated, passcodeController.generatePasscode);
app.post('/verifyPasscode', passcodeController.verifyPasscode);
app.post('/generatePasscodeSMS', passcodeController.generatePasscodeSMS);


// Upload routes
app.get('/upload', conditionalAuth, (req, res) => {
    const successMessage = req.query.successMessage || null;
    const errorMessage = req.query.errorMessage || null;

    if (req.user._id) {
        // signed in user direct access
        res.render('upload', { 
            user: req.user, 
            successMessage, 
            errorMessage, 
            isGuest: false,
        });
    } else {
        // registered user token access
        res.render('upload', { 
            successMessage, 
            errorMessage, 
            isGuest: false,
        });
    }
});


// Guest upload route
app.get('/upload-guest', (req, res) => {
    const successMessage = req.query.successMessage || null;
    const errorMessage = req.query.errorMessage || null;

   res.render('upload', {
        successMessage,
        errorMessage,
        isGuest: true, // Guest mode
       
    });
});



// Route for registered user uploading 
app.post('/upload/combined', conditionalAuth, upload.array('files'), uploadController.uploadCombined);
// Combined upload route for guests
app.post('/upload-guest/combined', upload.array('files'), uploadController.uploadCombined);

// Route to view the download page with uploaded texts and files
app.get('/download', conditionalAuth, downloadController.renderDownloadPage);
// Route to handle file download by ID
app.get('/download/file/:id', conditionalAuth, downloadController.downloadFile);
// Route to preview file content by ID
app.get('/preview/file/:id', conditionalAuth, downloadController.previewFile);
// Delete text route
app.post('/delete/text/:id', conditionalAuth, downloadController.deleteText);
// Delete file route
app.post('/delete/file/:id', conditionalAuth, downloadController.deleteFile);
// Route to serve file/image thumbnails
app.get('/thumbnail/:id', conditionalAuth, downloadController.getThumbnail);



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});