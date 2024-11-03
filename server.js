const express = require('express');
const expressLayouts = require('express-ejs-layouts');
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
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('layout', 'layouts/main');

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
app.use(passport.initialize());
app.use(passport.session());
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
passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
        try {
            const user = await db.collection('users').findOne({ email: email.toLowerCase() });
            if (!user) {
                return done(null, false, { message: 'Incorrect email.' });
            }
            
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
));

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await db.collection('users').findOne({ googleId: profile.id });
        
        if (!user) {
            user = await db.collection('users').insertOne({
                googleId: profile.id,
                email: profile.emails[0].value,
                name: profile.displayName,
                authType: 'google'
            });
            user = await db.collection('users').findOne({ googleId: profile.id });
        }
        
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

// Routes
app.get('/', (req, res) => {
    res.render("index", {
      isLandingPage: true,
      hideFooter: true,
      user: req.user,
    });
});

app.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/profile');
    }
    res.render('login.ejs');
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: false
}));

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: '/profile',
        failureRedirect: '/login'
    })
);

app.get('/register', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/profile');
    }
    res.render('register.ejs');
});

app.post('/register', async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;
        if (!email || !password || !confirmPassword) {
            return res.status(400).send('All fields are required');
        } if (!validator.isEmail(email)) {
            return res.status(400).send('Invalid email format');
        } if (password !== confirmPassword) {
            return res.status(400).send('Passwords do not match');
        } if (password.length < 8) {
            return res.status(400).send('Password must be at least 8 characters long');
        }
        const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).send('Email already registered');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.collection('users').insertOne({
            email: email.toLowerCase(),
            password: hashedPassword,
            authType: 'local',
            createdAt: new Date()
        });
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.get('/profile', isAuthenticated, (req, res) => {
    res.render('profile.ejs', { user: req.user });
});


app.post('/profile/update-info', async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/login');

    const { name, email } = req.body;
    const updateFields = { name, email };


    try {
        await db.collection('users').updateOne(
            { _id: req.user._id },
            { $set: updateFields }
        );
        
        res.redirect('/profile');
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send('Error updating profile');
    }
});


app.post('/profile/update-password', async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/login');

    const { password, confirmPassword } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match');
    }

    // Check for minimum password length
    if (password.length < 8) {
        return res.status(400).send('Password must be at least 8 characters long');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.collection('users').updateOne(
            { _id: req.user._id },
            { $set: { password: hashedPassword } }
        );

        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating password');
    }
});


app.post('/profile/unlink-google', async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/login');

    try {
        // Retrieve the user's record from the database
        const user = await db.collection('users').findOne({ _id: req.user._id });

        // Check if the password field exists
        if (!user.password) {
            // If no password is set, redirect to profile with a query parameter to show an alert
            return res.redirect('/profile?error=missing-password');
        }

        // Proceed with unlinking Google account if password exists
        await db.collection('users').updateOne(
            { _id: req.user._id },
            {
                $unset: { googleId: "" }, // Removes Google ID field
                $set: {
                    authType: "local", // Set authType to "local"
                    createdAt: new Date() // Set createdAt to the current time
                }
            }
        );

        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error unlinking Google account');
    }
});



app.post('/profile/delete', async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/login');

    try {
        // Delete the user's account from the database
        const result = await db.collection('users').deleteOne({ _id: req.user._id });

        if (result.deletedCount === 1) {
            // Log the user out after deleting the account
            req.logout((err) => {
                if (err) {
                    console.error('Error logging out after account deletion:', err);
                    return res.status(500).send('Error logging out');
                }
                // Redirect to the home page after successful account deletion and logout
                res.redirect('/');
            });
        } else {
            console.log('User not found or deletion failed');
            res.status(500).send('Account deletion failed');
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).send('Error deleting account');
    }
});


app.get('/upload', (req, res) => {
    if (req.isAuthenticated()) {  
        res.render('upload');  // Serve the standard upload page for logged-in users
    } else {
        res.render('upload_guest'); // Serve the guest upload page
    }
});


app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error logging out');
        }
        res.redirect('/');
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});