const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError } = require('../expressError');

// Decode JWT from the Authorization header and attach payload to res.locals
// Invalid or missing tokens are not an error here — ensureLoggedIn decides whether a route needs one
function authenticateJWT(req, res, next) {
    try {
        const authHeader = req.headers && req.headers.authorization;
        if (authHeader) {
            const token = authHeader.replace(/^[Bb]earer /, '').trim();
            res.locals.user = jwt.verify(token, process.env.JWT_SECRET).user;
        }
        return next();
    } catch {
        return next();
    }
}

// Same as authenticateJWT, but reads the token from the request body
// Used by sendBeacon on tab close, which can't set an Authorization header
function authenticateBodyToken(req, res, next) {
    try {
        if (req.body && req.body.token) {
            res.locals.user = jwt.verify(req.body.token, process.env.JWT_SECRET).user;
        }
        return next();
    } catch {
        return next();
    }
}

// Block access if the user is not logged in
function ensureLoggedIn(req, res, next) {
    if (!res.locals.user) return next(new UnauthorizedError());
    return next();
}

// Block access unless the logged-in user matches the :username route param
function ensureCorrectUser(req, res, next) {
    if (!res.locals.user) return next(new UnauthorizedError());
    if (res.locals.user.username !== req.params.username) return next(new ForbiddenError());
    return next();
}

// Block access if the user is not an admin
function ensureAdmin(req, res, next) {
    if (!res.locals.user || !res.locals.user.isAdmin) return next(new UnauthorizedError());
    return next();
}

module.exports = { authenticateJWT, authenticateBodyToken, ensureLoggedIn, ensureCorrectUser, ensureAdmin };
