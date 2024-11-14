// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const conditionalAuth = (req, res, next) => {
    // Check session-based authentication
    if (req.isAuthenticated && req.isAuthenticated()) {
        req.user = req.user || { email: req.user.email }; // Ensure req.user is defined
        return next();
    }
    
    // Check JWT-based authentication
    const token = req.cookies.token;
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.redirect('/login'); // Redirect to login if token is invalid
            }
            req.user = decoded; // Set user info in the request from JWT payload
            return next();
        });
    } else {
        // If neither authentication is valid, redirect to login
        res.redirect('/login');
    }
};

module.exports = conditionalAuth;
