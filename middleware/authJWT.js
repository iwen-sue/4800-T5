const jwt = require('jsonwebtoken');

const authJWT = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect('/');
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.email = decoded;
        next();
    } catch (error) {
        return res.status(401).send({ error: "Unauthorized" });
    }
};

module.exports = authJWT;