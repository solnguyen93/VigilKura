const express = require('express');
const router = express.Router();
const Child = require('../models/Child');
const { authenticateJWT } = require('../middleware/auth');

// Get all children for the logged-in user
router.get('/', authenticateJWT, async (req, res) => {
    try {
        const children = await Child.getAll(res.locals.user.id);
        res.json(children);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
});

// Add a child
router.post('/', authenticateJWT, async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Name is required.' });
    }
    try {
        const child = await Child.add(res.locals.user.id, name);
        res.status(201).json(child);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
});

// Rename a child
router.put('/:id/name', authenticateJWT, async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required.' });
    try {
        const child = await Child.rename(req.params.id, res.locals.user.id, name);
        res.json(child);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
});

// Update child settings
router.put('/:id/settings', authenticateJWT, async (req, res) => {
    const { settings } = req.body;
    try {
        const child = await Child.updateSettings(req.params.id, res.locals.user.id, settings);
        res.json(child);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
});

// Remove a child
router.delete('/:id', authenticateJWT, async (req, res) => {
    try {
        await Child.remove(req.params.id, res.locals.user.id);
        res.json({ message: 'Child removed.' });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
});

module.exports = router;
