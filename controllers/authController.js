// controllers/authController.js
const bcrypt = require('bcrypt');
const validator = require('validator');
const { getDB } = require('../config/database');
const passport = require('passport');

const login = (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/profile');
    }
    res.render("login.ejs", {
      page: "login",
    });
};

const loginPost = passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: false
});

const register = (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/profile');
    }
    res.render('register.ejs', {
        page: 'register',
    });
};

const registerPost = async (req, res) => {
    try {
        const db = getDB();
        const { email, password, confirmPassword } = req.body;

        // Validation
        if (!email || !password || !confirmPassword) {
            return res.status(400).send('All fields are required');
        }
        if (!validator.isEmail(email)) {
            return res.status(400).send('Invalid email format');
        }
        if (password !== confirmPassword) {
            return res.status(400).send('Passwords do not match');
        }
        if (password.length < 8) {
            return res.status(400).send('Password must be at least 8 characters long');
        }

        // Check existing user
        const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).send('Email already registered');
        }

        // Create new user
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
};

const logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error logging out');
        }
        res.redirect('/');
    });
};

module.exports = {
    login,
    loginPost,
    register,
    registerPost,
    logout
};