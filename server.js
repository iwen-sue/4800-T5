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
const previewController = require('./controllers/previewController');
const ocrController = require('./controllers/ocrController');
const conditionalAuth = require('./middleware/authMiddleware');
const cookieParser = require('cookie-parser');
const MongoDBStore = require('connect-mongodb-session')(session);

const app = express();
const PORT = process.env.PORT || 3000;

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

if (process.env.NODE_ENV === 'development') {
    console.log('Development mode');
    const browserSync = require("browser-sync").create();
    
    // Browser-Sync configuration
    browserSync.init({
        proxy: `http://localhost:${PORT}`,
        files: ["views/**/*.ejs", "public/**/*.{css,js}"],
        port: 4000,
        open: false,
    });
    // Browser-Sync configuration
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
}

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
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
    // redirect to download page if user is signed in
    if (req.isAuthenticated()) {
        res.redirect('/download');
        return;
    }

    // check if token is present in cookies, for jwt access re-entering the landing page
    const token = req.cookies.token;
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return;
            req.user = decoded;
        });
    }

    if (req.user) {
        if (req.user.email) {
            // registered user token access
            res.render("index", {
                isLandingPage: true,
                hideFooter: true,
                isGuest: false,
            });
            return;
        } else {
           // guest token access
           res.render("index", {
               isLandingPage: true,
               hideFooter: true,
               isGuest: true,
           });
           return;
       }
    }

    // render landing page for unauthenticated users
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
app.get('/upload', conditionalAuth, uploadController.renderUploadPage);
// Guest upload route
app.get('/upload-guest', uploadController.renderUploadGuestPage);
// Route for registered user uploading 
app.post('/upload/combined', conditionalAuth, upload.array('files'), uploadController.uploadCombined);
// Combined upload route for guests
app.post('/upload-guest/combined', upload.array('files'), uploadController.uploadCombined);

// Route to view the download page with uploaded texts and files
app.get('/download', conditionalAuth, downloadController.renderDownloadPage);
// Route to handle file download by ID
app.get('/download/file/:id', conditionalAuth, downloadController.downloadFile);
// Route to preview file content by ID
// app.get('/preview/file/:id', conditionalAuth, downloadController.previewFile);
// Delete text route
app.post('/delete/text/:id', conditionalAuth, downloadController.deleteText);
// Delete file route
app.post('/delete/file/:id', conditionalAuth, downloadController.deleteFile);
// Route to serve file/image thumbnails
app.get('/thumbnail/:id', conditionalAuth, downloadController.getThumbnail);
// Route to render the preview page
app.get('/preview/:id', conditionalAuth, previewController.renderPreviewPage);
// Route to serve preview content for images or PDFs
app.get('/preview/content/:id', conditionalAuth, previewController.servePreviewContent);
// OCR route
app.get('/ocr/:id', conditionalAuth, ocrController.extractTextFromImageAndPDF);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;