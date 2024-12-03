// controllers/authController.js
const bcrypt = require('bcrypt');
const validator = require('validator');
const { getDB } = require('../config/database');
const passport = require('passport');

const login = (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/download');
    }
    res.render('login.ejs', {
        page: 'login',
        error: req.query.error,
        navStyle: 'nav-no-blur'
    });
};

const loginPost = (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) {
            return res.render('login', {
                page: 'login',
                error: 'An error occurred during login',
            });
        }
        if (!user) {
            return res.render("login", {
                page: "login",
                error: "Invalid email or password",
                navStyle: 'nav-no-blur'
            });
        }
    req.logIn(user, (err) => {
        if (err) {
            return res.render('login', {
            page: 'login',
            error: 'An error occurred during login',
            navStyle: 'nav-no-blur'
            });
        }
        return res.redirect('/download');
        });
    })(req, res, next);
};

const register = (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/download');
    }
    res.render('register.ejs', {
        page: 'register',
        error: req.query.error,
        navStyle: 'nav-no-blur'
    });
};

const registerPost = async (req, res) => {
    try {
        const db = getDB();
        const { email, password, confirmPassword } = req.body;

    // Validation
    if (!email || !password || !confirmPassword) {
        return res.render('register', {
            page: 'register',
            error: 'All fields are required',
            navStyle: 'nav-no-blur'
        });
    }

    if (!validator.isEmail(email)) {
        return res.render('register', {
            page: 'register',
            error: 'Invalid email format',
            navStyle: 'nav-no-blur'
        });
        }

    if (password !== confirmPassword) {
        return res.render('register', {
            page: 'register',
            error: 'Passwords do not match',
            navStyle: 'nav-no-blur'
        });
    }

    if (password.length < 8) {
        return res.render('egister', {
            page: 'register',
            error: 'Password must be at least 8 characters long',
            navStyle: 'nav-no-blur'
        });
    }

    // Check existing user
    const existingUser = await db
        .collection('users')
        .findOne({ email: email.toLowerCase() });
        if (existingUser) {
        return res.render("register", {
            page: "register",
            error: "Email already registered",
            navStyle: 'nav-no-blur'
        });
        }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.collection("users").insertOne({
        email: email.toLowerCase(),
        password: hashedPassword,
        authType: "local",
        createdAt: new Date(),
    });

    res.redirect("/login?success=true");
    } catch (err) {
    console.error(err);
    res.render("register", {
        page: "register",
        error: "An error occurred during registration",
        navStyle: 'nav-no-blur'
        });
    }
};

const logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error logging out");
        }
        res.redirect("/");
    });
};

module.exports = {
    login,
    loginPost,
    register,
    registerPost,
    logout,
};