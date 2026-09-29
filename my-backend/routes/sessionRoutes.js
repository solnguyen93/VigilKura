const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const User = require('../models/User');
const { authenticateBodyToken, ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');
const { NotFoundError } = require('../expressError');
const { sendNotification } = require('../notify');
const { isDemo } = require('../demo');

// Whether to send an email/SMS — never for the shared demo account
const shouldNotify = (notify, username) => notify && notify !== 'none' && !isDemo(username);

// Only continue if the logged-in user owns :sessionId
async function ensureSessionOwner(req, res, next) {
    try {
        const { sessionId } = req.params;
        if (!/^\d+$/.test(sessionId)) throw new NotFoundError(`No session: ${sessionId}`);
        await Session.ensureOwner(sessionId, res.locals.user.id);
        return next();
    } catch (err) {
        return next(err);
    }
}

// Start a session
router.post('/start', ensureLoggedIn, async (req, res) => {
    const { childId } = req.body;
    try {
        const session = await Session.start(res.locals.user.id, childId || null);
        res.json(session);
    } catch (error) {
        console.error('Error starting session:', error);
        res.status(error.status || 500).json({ message: error.message });
    }
});

// End a session
router.put('/:sessionId/end', ensureLoggedIn, ensureSessionOwner, async (req, res) => {
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
router.post('/:sessionId/detections', ensureLoggedIn, ensureSessionOwner, async (req, res) => {
    const { sessionId } = req.params;
    const { word, context, childName, notify } = req.body;
    try {
        const user = await User.getUserByUsername(res.locals.user.username);
        const detection = await Session.addDetection(sessionId, user.id, word, context);
        if (shouldNotify(notify, user.username)) {
            sendNotification({ notify, email: user.email, phone: user.phone, childName: childName || 'your child', word, context }).catch(console.error);
        }
        res.json(detection);
    } catch (error) {
        console.error('Error adding detection:', error);
        res.status(error.status || 500).json({ message: error.message });
    }
});

// Send time-up notification
router.post('/notify-time-up', ensureLoggedIn, async (req, res) => {
    const { childName, notify } = req.body;
    try {
        const user = await User.getUserByUsername(res.locals.user.username);
        if (shouldNotify(notify, user.username)) {
            await sendNotification({
                notify,
                email: user.email,
                phone: user.phone,
                childName: childName || 'your child',
                type: 'time-up',
            });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error sending time-up notification:', error);
        res.status(error.status || 500).json({ message: error.message });
    }
});

// End a session when the tab is closed
// sendBeacon can't send auth headers, so the JWT comes in the request body instead
router.post('/:sessionId/abandoned', authenticateBodyToken, ensureLoggedIn, ensureSessionOwner, async (req, res) => {
    const { sessionId } = req.params;
    const { childName, notify } = req.body;
    try {
        const user = await User.getUserByUsername(res.locals.user.username);
        await Session.end(sessionId);
        if (shouldNotify(notify, user.username)) {
            sendNotification({ notify, email: user.email, phone: user.phone, childName: childName || 'your child', type: 'abandoned' }).catch(console.error);
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error handling abandoned session:', error);
        res.status(error.status || 500).json({ message: error.message });
    }
});

// Get all sessions for a user, optionally filtered by child
router.get('/user/:username', ensureCorrectUser, async (req, res) => {
    const childId = req.query.childId || null;
    try {
        const sessions = await Session.getAllForUser(res.locals.user.id, childId);
        res.json(sessions);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(error.status || 500).json({ message: error.message });
    }
});

// Get detections for a session
router.get('/:sessionId/detections', ensureLoggedIn, ensureSessionOwner, async (req, res) => {
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
router.post('/:sessionId/transcripts', ensureLoggedIn, ensureSessionOwner, async (req, res) => {
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
router.get('/:sessionId/transcripts', ensureLoggedIn, ensureSessionOwner, async (req, res) => {
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
