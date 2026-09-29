-- ============================================================
-- Demo account — the only seeded user
-- testuser (password: 'password', PIN: '0000' — both stored bcrypt hashed)
-- Its profile is locked in the API (see my-backend/demo.js)
-- ============================================================

INSERT INTO users (username, password, name, email, pin)
VALUES ('testuser',
        '$2b$12$7XY2y8CGoM2BUS4ePgwQSO4rwXAvc7BC4X0v0Fk.h52O7N3XuY0Ki',
        'Test User',
        'demo@example.com',
        '$2b$12$j8TSKQ8PS4zemiNQ1gKFhO31fObFaJVwkk76PNutOxiZwdcSq6YIW');

-- Demo children — Test Child 1 has a 30 min limit, Test Child 2 a 1 hr limit with a
-- 5 min warning and a shorter word list
INSERT INTO children (parent_id, name, settings)
VALUES ((SELECT id FROM users WHERE username = 'testuser'),
        'Test Child 1',
        '{"wordSms": false, "wordList": ["damn", "hell", "crap", "ass", "shit", "fuck", "bitch", "bastard", "piss", "dick", "cock", "pussy", "cunt", "asshole", "bullshit", "motherfucker", "faggot", "nigger", "slut", "whore", "retard"], "timeUpSms": false, "wordChime": true, "wordEmail": false, "timeUpAlert": true, "timeUpChime": true, "timeUpEmail": false, "durationHours": 0, "notifCooldown": 5, "warningEnabled": false, "warningMinutes": 5, "wordAlertPopup": true, "durationEnabled": true, "durationMinutes": 30, "screenTimeAction": "notify", "wordDetectionEnabled": true}');

INSERT INTO children (parent_id, name, settings)
VALUES ((SELECT id FROM users WHERE username = 'testuser'),
        'Test Child 2',
        '{"wordSms": false, "wordList": ["shit", "fuck", "bitch", "bastard", "piss", "cock", "pussy", "cunt", "asshole", "bullshit", "motherfucker", "faggot", "nigger", "slut", "whore", "retard"], "timeUpSms": false, "wordChime": true, "wordEmail": false, "timeUpAlert": true, "timeUpChime": true, "timeUpEmail": false, "durationHours": 1, "notifCooldown": 5, "warningEnabled": true, "warningMinutes": 5, "wordAlertPopup": true, "durationEnabled": true, "durationMinutes": 0, "screenTimeAction": "notify", "wordDetectionEnabled": true}');
