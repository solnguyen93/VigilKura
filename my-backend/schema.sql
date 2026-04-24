-- Drop existing tables if they exist
DROP TABLE IF EXISTS detections;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

-- Create Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    pin VARCHAR(100),
    phone VARCHAR(20),
    settings JSONB NOT NULL DEFAULT '{}',
    reset_token VARCHAR(100),
    reset_token_expires TIMESTAMP
);

-- Create Children Table
CREATE TABLE children (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create Sessions Table (each monitoring session)
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id INTEGER REFERENCES children(id) ON DELETE SET NULL,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,
    duration_seconds INTEGER,
    summary TEXT,
    summary_translated TEXT,
    translated_transcript JSONB,
    translated_language VARCHAR(50)
);

-- Create Detections Table (each flagged word within a session)
CREATE TABLE detections (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    word VARCHAR(100) NOT NULL,
    context TEXT,
    detected_at TIMESTAMP NOT NULL DEFAULT NOW()
);
