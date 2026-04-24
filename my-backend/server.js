// Entry point — sets up the Express app, middleware, and routes
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const childRoutes = require('./routes/childRoutes');
require('dotenv').config();

const app = express();

// Allow cross-origin requests (frontend on a different port/domain)
app.use(cors());
// Parse incoming JSON request bodies
app.use(express.json());
// Parse urlencoded bodies — used by sendBeacon on tab close
app.use(express.urlencoded({ extended: false }));

// Mount route handlers
app.use('/auth', authRoutes);       // Register and login
app.use('/user', userRoutes);       // User profile, settings, PIN
app.use('/sessions', sessionRoutes); // Monitoring sessions, detections, transcripts
app.use('/children', childRoutes);  // Child management

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
