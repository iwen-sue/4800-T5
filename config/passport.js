// config/passport.js
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const { getDB } = require('./database');

module.exports = function() {
    // Serialize user for the session
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    // Deserialize user from the session
    passport.deserializeUser(async (id, done) => {
        try {
            const db = getDB();
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
                const db = getDB();
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
            const db = getDB();
            let user = await db.collection('users').findOne({ googleId: profile.id });
            
            if (!user) {
                const result = await db.collection('users').insertOne({
                    googleId: profile.id,
                    email: profile.emails[0].value,
                    name: profile.displayName,
                    authType: 'google'
                });
                user = await db.collection('users').findOne({ _id: result.insertedId });
            }
            
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }));
};