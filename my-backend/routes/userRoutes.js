const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { authenticateJWT, ensureAdmin } = require('../middleware/auth');

const DEMO_USERNAME = 'testuser';

// Get a user by username
router.get('/:username', authenticateJWT, async (req, res) => {
    try {
        const user = await User.getUserByUsername(req.params.username);
        res.json(user);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
});

// Update a user — returns a fresh JWT so the client reflects the latest state
router.put('/:username', authenticateJWT, async (req, res) => {
    const { username } = req.params;
    const data = req.body;

    if (username === DEMO_USERNAME && data.password) {
        return res.status(403).json({ message: "The demo account's password cannot be changed." });
    }
    if (username === DEMO_USERNAME && (data.pin || data.removePin)) {
        return res.status(403).json({ message: "The demo account's PIN cannot be changed." });
    }

    try {
        const updatedUser = await User.update(username, data);
        const token = jwt.sign(
            { user: { id: updatedUser.id, name: updatedUser.name, username: updatedUser.username, email: updatedUser.email, isAdmin: updatedUser.isAdmin, hasPin: updatedUser.hasPin, settings: updatedUser.settings } },
            process.env.JWT_SECRET,
        );
        res.json({ ...updatedUser, token });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a user account
router.delete('/:username', authenticateJWT, async (req, res) => {
    const { username } = req.params;
    if (username === DEMO_USERNAME) {
        return res.status(403).json({ message: 'The demo account cannot be deleted.' });
    }
    try {
        await User.remove(username, res.locals.user.username);
        res.json({ message: 'User removed successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Verify a user's PIN
router.post('/:username/verify-pin', authenticateJWT, async (req, res) => {
    try {
        await User.verifyPin(req.params.username, req.body.pin);
        res.json({ success: true });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
});

// Admin only — get all users
router.get('/all', ensureAdmin, async (_req, res) => {
    try {
        const users = await User.getAllUsers();
        res.json(users);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
});

module.exports = router;
