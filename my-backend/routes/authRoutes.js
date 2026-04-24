const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const pool = require('../db');
const nodemailer = require('nodemailer');
const router = express.Router();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
});
const { ensureNotLoggedIn } = require('../middleware/auth');

// Route for user registration
router.post('/register', ensureNotLoggedIn, async (req, res) => {
    const { name, username, email, password } = req.body;
    try {
        const user = await User.register(name, username, email, password);
        // Create JWT token for authentication
        const token = jwt.sign({ user: { id: user.id, name: user.name, username: user.username, email: user.email, isAdmin: user.isAdmin, hasPin: user.hasPin, settings: user.settings } }, process.env.JWT_SECRET);
        res.json({ user, token });
    } catch (err) {
        console.error(err.message);
        res.status(401).json({ message: err.message });
    }
});

// Route for user login
router.post('/login', ensureNotLoggedIn, async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.login(email, password);
        // Create JWT token for authentication
        const token = jwt.sign({ user: { id: user.id, name: user.name, username: user.username, email: user.email, isAdmin: user.isAdmin, hasPin: user.hasPin, settings: user.settings } }, process.env.JWT_SECRET);

        res.json({ user, token });
    } catch (err) {
        console.error(err.message);
        res.status(401).json({ message: err.message });
    }
});

// Send a password reset email with a one-time token link
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const userRes = await pool.query(`SELECT id, email FROM users WHERE email = $1`, [email]);
        // Always respond with success to avoid leaking whether an email is registered
        if (!userRes.rows[0]) return res.json({ message: 'If that email exists, a reset link has been sent.' });

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes
        await pool.query(
            `UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3`,
            [token, expires, userRes.rows[0].id],
        );

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
        await transporter.sendMail({
            from: `"VigilKura" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'VigilKura — Reset your password',
            text: `You requested a password reset.\n\nClick the link below to set a new password (expires in 30 minutes):\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
        });

        res.json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (err) {
        console.error('Forgot password error:', err.message);
        res.status(500).json({ message: 'Something went wrong.' });
    }
});

// Reset password using a valid token from the email link
router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
    try {
        const userRes = await pool.query(
            `SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()`,
            [token],
        );
        if (!userRes.rows[0]) return res.status(400).json({ message: 'Reset link is invalid or has expired.' });

        const bcrypt = require('bcrypt');
        const hashed = await bcrypt.hash(password, 12);
        await pool.query(
            `UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2`,
            [hashed, userRes.rows[0].id],
        );
        res.json({ message: 'Password updated. You can now sign in.' });
    } catch (err) {
        console.error('Reset password error:', err.message);
        res.status(500).json({ message: 'Something went wrong.' });
    }
});

module.exports = router;
