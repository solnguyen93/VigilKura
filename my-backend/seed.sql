-- ============================================================
-- Users
-- testuser: id=1 (demo account, password: 'password')
-- admin:    id=2 (password: 'password')
-- sarah:    id=3 (password: 'password')
-- mike:     id=4 (password: 'password')
-- ============================================================

INSERT INTO users (username, password, name, email, pin)
VALUES ('testuser',
        '$2b$12$7XY2y8CGoM2BUS4ePgwQSO4rwXAvc7BC4X0v0Fk.h52O7N3XuY0Ki',
        'John Doe',
        'john@johndoe.com',
        '0000');

INSERT INTO users (username, password, name, email, is_admin)
VALUES ('admin',
        '$2b$12$7XY2y8CGoM2BUS4ePgwQSO4rwXAvc7BC4X0v0Fk.h52O7N3XuY0Ki',
        'Admin',
        'admin@vigilkura.com',
        TRUE);

INSERT INTO users (username, password, name, email)
VALUES ('sarah',
        '$2b$12$7XY2y8CGoM2BUS4ePgwQSO4rwXAvc7BC4X0v0Fk.h52O7N3XuY0Ki',
        'Sarah Kim',
        'sarah@email.com');

INSERT INTO users (username, password, name, email)
VALUES ('mike',
        '$2b$12$7XY2y8CGoM2BUS4ePgwQSO4rwXAvc7BC4X0v0Fk.h52O7N3XuY0Ki',
        'Mike Johnson',
        'mike@email.com');
