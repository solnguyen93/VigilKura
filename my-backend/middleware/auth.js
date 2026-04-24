const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../expressError');

// Decode JWT from the Authorization header and attach payload to res.locals
function authenticateJWT(req, res, next) {
    try {
        const authHeader = req.headers && req.headers.authorization;
        if (authHeader) {
            const token = authHeader.replace(/^[Bb]earer /, '').trim();
            res.locals = jwt.verify(token, process.env.JWT_SECRET);
        }
        return next();
    } catch {
        return next();
    }
}

// Block access if the user is already logged in
async function ensureNotLoggedIn(req, res, next) {
    try {
        if (res.locals.user) throw new UnauthorizedError();
        return next();
    } catch (err) {
        return next(err);
    }
}

// Block access if the user is not an admin
async function ensureAdmin(req, res, next) {
    try {
        if (!res.locals.user || !res.locals.user.isAdmin) throw new UnauthorizedError();
        return next();
    } catch (err) {
        return next(err);
    }
}

module.exports = { authenticateJWT, ensureNotLoggedIn, ensureAdmin };
