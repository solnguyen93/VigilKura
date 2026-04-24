const pool = require('../db');
const { NotFoundError } = require('../expressError');
const OpenAI = require('openai');

// OpenAI client — used to generate a session summary when the session ends
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

class Session {
    // Start a new monitoring session for a user and optional child
    static async start(userId, childId = null) {
        const result = await pool.query(
            `INSERT INTO sessions (user_id, child_id, started_at)
             VALUES ($1, $2, NOW())
             RETURNING *`,
            [userId, childId || null],
        );
        return result.rows[0];
    }

    // End a session — sets ended_at and duration, translates transcript if language is non-English
    static async end(sessionId) {
        const [transcriptsRes, langRes] = await Promise.all([
            pool.query(
                `SELECT text FROM transcripts WHERE session_id = $1 ORDER BY recorded_at ASC`,
                [sessionId],
            ),
            pool.query(
                `SELECT u.settings->>'preferredLanguage' AS language
                 FROM sessions s JOIN users u ON s.user_id = u.id
                 WHERE s.id = $1`,
                [sessionId],
            ),
        ]);

        const preferredLanguage = langRes.rows[0]?.language || 'English';
        const needsTranslation = transcriptsRes.rows.length > 0;

        console.log(`Session ${sessionId} end — chunks: ${transcriptsRes.rows.length}, lang: ${preferredLanguage}, willTranslate: ${needsTranslation}`);

        let translatedTranscript = null;

        if (needsTranslation && process.env.OPENAI_API_KEY) {
            try {
                const chunks = transcriptsRes.rows.map((t, i) => `${i + 1}. ${t.text}`).join('\n');
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: `Detect the language of each transcript chunk and translate it to ${preferredLanguage}. If a chunk is already in ${preferredLanguage}, keep it as-is. Return a JSON object with a "translations" array in the same order and count as the input chunks.`,
                        },
                        { role: 'user', content: chunks },
                    ],
                    response_format: { type: 'json_object' },
                    max_tokens: 600,
                });
                const parsed = JSON.parse(completion.choices[0].message.content);
                // OpenAI sometimes uses different key names — grab the first array value found
                const arr = parsed.translations || parsed.translated || parsed.chunks
                    || Object.values(parsed).find((v) => Array.isArray(v));
                // Normalize to plain strings — OpenAI sometimes returns objects instead of strings
                if (Array.isArray(arr)) translatedTranscript = arr.map((item) =>
                    typeof item === 'string' ? item : item.translatedText || item.text || String(item)
                );
                console.log('Translation result:', translatedTranscript);
            } catch (err) {
                console.error('OpenAI translation failed:', err.message);
            }
        }

        const result = await pool.query(
            `UPDATE sessions
             SET ended_at = NOW(),
                 duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
                 translated_transcript = $2,
                 translated_language = $3
             WHERE id = $1
             RETURNING *`,
            [
                sessionId,
                translatedTranscript ? JSON.stringify(translatedTranscript) : null,
                translatedTranscript ? preferredLanguage : null,
            ],
        );
        if (!result.rows[0]) throw new NotFoundError(`No session: ${sessionId}`);
        return result.rows[0];
    }

    // Log a flagged word detection within a session
    static async addDetection(sessionId, userId, word, context) {
        const result = await pool.query(
            `INSERT INTO detections (session_id, user_id, word, context, detected_at)
             VALUES ($1, $2, $3, $4, NOW())
             RETURNING *`,
            [sessionId, userId, word, context],
        );
        return result.rows[0];
    }

    // Get all sessions for a user, optionally filtered by child
    // Joins with detections to include the incident count per session
    static async getAllForUser(userId, childId = null) {
        const result = await pool.query(
            `SELECT s.id,
                    s.started_at,
                    s.ended_at,
                    s.duration_seconds,
                    s.summary,
                    s.summary_translated,
                    s.translated_transcript,
                    s.translated_language,
                    s.child_id,
                    c.name AS child_name,
                    COUNT(d.id)::INTEGER AS detection_count
             FROM sessions s
             LEFT JOIN detections d ON d.session_id = s.id
             LEFT JOIN children c ON c.id = s.child_id
             WHERE s.user_id = $1
               AND ($2::INTEGER IS NULL OR s.child_id = $2)
             GROUP BY s.id, c.name
             ORDER BY s.started_at DESC`,
            [userId, childId || null],
        );
        return result.rows;
    }

    // Get all detections for a specific session, ordered by time
    static async getDetections(sessionId) {
        const result = await pool.query(
            `SELECT id, word, context, detected_at
             FROM detections
             WHERE session_id = $1
             ORDER BY detected_at ASC`,
            [sessionId],
        );
        return result.rows;
    }

    // Save a transcript chunk for a session (called after each final speech recognition result)
    static async addTranscript(sessionId, text) {
        const result = await pool.query(
            `INSERT INTO transcripts (session_id, text, recorded_at)
             VALUES ($1, $2, NOW())
             RETURNING *`,
            [sessionId, text],
        );
        return result.rows[0];
    }

    // Get all transcript chunks for a session, ordered by time
    static async getTranscripts(sessionId) {
        const result = await pool.query(
            `SELECT id, text, recorded_at
             FROM transcripts
             WHERE session_id = $1
             ORDER BY recorded_at ASC`,
            [sessionId],
        );
        return result.rows;
    }
}

module.exports = Session;
