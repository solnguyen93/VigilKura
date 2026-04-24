const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const User = require('../models/User');
const { authenticateJWT } = require('../middleware/auth');
const { sendNotification } = require('../notify');

// Start a session
router.post('/start', authenticateJWT, async (req, res) => {
    const { username, childId } = req.body;
    try {
        const user = await User.getUserByUsername(username);
        const session = await Session.start(user.id, childId || null);
        res.json(session);
    } catch (error) {
        console.error('Error starting session:', error);
        res.status(error.status || 500).json({ message: error.message });
    }
});

// End a session
router.put('/:sessionId/end', authenticateJWT, async (req, res) => {
    const { sessionId } = req.params;
    try {
        const session = await Session.end(sessionId);
        res.json(session);
    } catch (error) {
        console.error('Error ending session:', error);
        res.status(error.status || 500).json({ message: error.message });
    }
});

// Add a detection to a session
router.post('/:sessionId/detections', authenticateJWT, async (req, res) => {
    const { sessionId } = req.params;
    const { username, word, context, childName, notify } = req.body;
    try {
        const user = await User.getUserByUsername(username);
        const detection = await Session.addDetection(sessionId, user.id, word, context);
        if (notify && notify !== 'none') {
            sendNotification({ notify, email: user.email, phone: user.phone, childName: childName || 'your child', word, context }).catch(console.error);
        }
        res.json(detection);
    } catch (error) {
        console.error('Error adding detection:', error);
        res.status(error.status || 500).json({ message: error.message });
    }
});

// Send time-up notification
router.post('/notify-time-up', authenticateJWT, async (req, res) => {
    const { username, childName, notify } = req.body;
    try {
        const user = await User.getUserByUsername(username);
        await sendNotification({
            notify,
            email: user.email,
            phone: user.phone,
            childName: childName || 'your child',
            type: 'time-up',
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error sending time-up notification:', error);
        res.status(error.status || 500).json({ message: error.message });
    }
});

// End a session when the tab is closed — no JWT (sendBeacon can't send auth headers)
router.post('/:sessionId/abandoned', async (req, res) => {
    const { sessionId } = req.params;
    const { username, childName, notify } = req.body;
    try {
        const user = await User.getUserByUsername(username);
        await Session.end(sessionId);
        if (notify && notify !== 'none') {
            sendNotification({ notify, email: user.email, phone: user.phone, childName: childName || 'your child', type: 'abandoned' }).catch(console.error);
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error handling abandoned session:', error);
        res.status(error.status || 500).json({ message: error.message });
    }
});

// Get all sessions for a user, optionally filtered by child
router.get('/user/:username', authenticateJWT, async (req, res) => {
    const { username } = req.params;
    const childId = req.query.childId || null;
    try {
        const user = await User.getUserByUsername(username);
        const sessions = await Session.getAllForUser(user.id, childId);
        res.json(sessions);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(error.status || 500).json({ message: error.message });
    }
});

// Get detections for a session
router.get('/:sessionId/detections', authenticateJWT, async (req, res) => {
    const { sessionId } = req.params;
    try {
        const detections = await Session.getDetections(sessionId);
        res.json(detections);
    } catch (error) {
        console.error('Error fetching detections:', error);
        res.status(error.status || 500).json({ message: error.message });
    }
});

// Add transcript chunk
router.post('/:sessionId/transcripts', authenticateJWT, async (req, res) => {
    const { sessionId } = req.params;
    const { text } = req.body;
    try {
        const transcript = await Session.addTranscript(sessionId, text);
        res.json(transcript);
    } catch (error) {
        console.error('Error adding transcript:', error);
        res.status(error.status || 500).json({ message: error.message });
    }
});

// Get transcripts for a session
router.get('/:sessionId/transcripts', authenticateJWT, async (req, res) => {
    const { sessionId } = req.params;
    try {
        const transcripts = await Session.getTranscripts(sessionId);
        res.json(transcripts);
    } catch (error) {
        console.error('Error fetching transcripts:', error);
        res.status(error.status || 500).json({ message: error.message });
    }
});

module.exports = router;
