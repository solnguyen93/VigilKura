const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const User = require('../models/User');
const { authenticateBodyToken, ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');
const { NotFoundError } = require('../expressError');
const { sendNotification } = require('../notify');
const { isDemo } = require('../demo');

// Whether to email the parent — never for the shared demo account
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
            sendNotification({ email: user.email, childName: childName || 'your child', word, context }).catch(console.error);
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
                email: user.email,
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

// A reload and a closed tab look the same to the browser, so an abandoned session isn't ended
// right away. If the page comes back and resumes it within this window it was a reload —
// otherwise the session is ended and the parent is alerted.
const ABANDON_GRACE_MS = 45 * 1000;
const pendingAbandons = new Map(); // sessionId -> timeout

// The monitoring page was closed or reloaded
// sendBeacon can't send auth headers, so the JWT comes in the request body instead
router.post('/:sessionId/abandoned', authenticateBodyToken, ensureLoggedIn, ensureSessionOwner, (req, res) => {
    const { sessionId } = req.params;
    const { childName, notify } = req.body;
    const { username } = res.locals.user;
    const leftAt = Date.now();

    clearTimeout(pendingAbandons.get(sessionId));
    pendingAbandons.set(sessionId, setTimeout(async () => {
        pendingAbandons.delete(sessionId);
        try {
            const user = await User.getUserByUsername(username);
            // Record the end as when the tab closed, not when the grace period ran out
            await Session.end(sessionId, (Date.now() - leftAt) / 1000);
            if (shouldNotify(notify, user.username)) {
                await sendNotification({ email: user.email, childName: childName || 'your child', type: 'abandoned' });
            }
        } catch (error) {
            console.error('Error handling abandoned session:', error);
        }
    }, ABANDON_GRACE_MS));
    res.json({ success: true });
});

// Continue a session after the monitoring page reloads — cancels the pending abandon
// 409 if the session already ended, so the page knows to not resume
router.put('/:sessionId/resume', ensureLoggedIn, ensureSessionOwner, async (req, res) => {
    const { sessionId } = req.params;
    try {
        clearTimeout(pendingAbandons.get(sessionId));
        pendingAbandons.delete(sessionId);
        if (!(await Session.isActive(sessionId))) {
            return res.status(409).json({ message: 'Session has already ended.' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error resuming session:', error);
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
