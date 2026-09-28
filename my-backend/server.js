// Entry point — sets up the Express app, middleware, and routes
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const childRoutes = require('./routes/childRoutes');
const { authenticateJWT } = require('./middleware/auth');
const { NotFoundError } = require('./expressError');
require('dotenv').config();

const app = express();

// Allow cross-origin requests (frontend on a different port/domain)
app.use(cors());
// Parse incoming JSON request bodies
app.use(express.json());
// Parse urlencoded bodies — used by sendBeacon on tab close
app.use(express.urlencoded({ extended: false }));
// Decode the JWT (if any) on every request — routes opt in to requiring it
app.use(authenticateJWT);

// Mount route handlers
app.use('/auth', authRoutes);       // Register and login
app.use('/user', userRoutes);       // User profile, settings, PIN
app.use('/sessions', sessionRoutes); // Monitoring sessions, detections, transcripts
app.use('/children', childRoutes);  // Child management

// Unmatched routes
app.use((req, res, next) => next(new NotFoundError()));

// Error handler — returns JSON in the same { message } shape the routes use
app.use((err, req, res, next) => {
    const status = err.status || 500;
    if (status === 500) console.error(err);
    res.status(status).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
