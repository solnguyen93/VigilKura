const pool = require('../db');
const bcrypt = require('bcrypt');
const { NotFoundError, BadRequestError, UnauthorizedError, ForbiddenError } = require('../expressError');

const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === 'test' ? 1 : 12;

class User {
    static async login(username, password) {
        const result = await pool.query(
            `SELECT id, username, password, name, email,
                    is_admin AS "isAdmin", settings,
                    pin IS NOT NULL AS "hasPin"
             FROM users
             WHERE username = $1`,
            [username],
        );

        const user = result.rows[0];
        if (user) {
            const isValid = await bcrypt.compare(password, user.password);
            if (isValid) {
                delete user.password;
                return user;
            }
        }
        throw new UnauthorizedError('Invalid username/password');
    }

    static async register(name, username, email, password) {
        if (!name || !username || !email || !password) {
            const missing = [!name && 'Name', !username && 'Username', !email && 'Email', !password && 'Password'].filter(Boolean);
            throw new BadRequestError(`Required field(s) missing: ${missing.join(', ')}`);
        }

        const usernameCheck = await pool.query(`SELECT username FROM users WHERE username = $1`, [username]);
        if (usernameCheck.rows[0]) throw new BadRequestError('Username is already taken.');

        const emailCheck = await pool.query(`SELECT email FROM users WHERE email = $1`, [email]);
        if (emailCheck.rows[0]) throw new BadRequestError('Email is already registered with another user.');

        const hashedPass = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
        const result = await pool.query(
            `INSERT INTO users (name, username, email, password)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, username, email`,
            [name, username, email, hashedPass],
        );
        return result.rows[0];
    }

    static async getAllUsers() {
        const result = await pool.query(
            `SELECT id, name, username, email FROM users ORDER BY username`,
        );
        if (!result.rows.length) throw new NotFoundError('No users found');
        return result.rows;
    }

    static async getUserByUsername(username) {
        const result = await pool.query(
            `SELECT id, name, username, email, phone,
                    is_admin AS "isAdmin", settings, pin,
                    pin IS NOT NULL AS "hasPin"
             FROM users
             WHERE username = $1`,
            [username],
        );
        if (!result.rows[0]) throw new NotFoundError(`Username not found: ${username}`);
        return result.rows[0];
    }

    static async update(username, data) {
        if (data.password) {
            data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
        }

        const { name, email, phone, password: hashedPass, pin: hashedPin, settings, removePin } = data;
        const clearPhone = Object.prototype.hasOwnProperty.call(data, 'phone') && !phone;

        try {
            const result = await pool.query(
                `UPDATE users
                 SET name     = COALESCE($1, name),
                     email    = COALESCE($2, email),
                     phone    = CASE WHEN $9 THEN NULL WHEN $3::VARCHAR IS NOT NULL THEN $3::VARCHAR ELSE phone END,
                     password = COALESCE($4, password),
                     pin      = CASE WHEN $8 THEN NULL WHEN $5::VARCHAR IS NOT NULL THEN $5::VARCHAR ELSE pin END,
                     settings = COALESCE($6::jsonb, settings)
                 WHERE username = $7
                 RETURNING id, name, username, email, phone,
                           is_admin AS "isAdmin", settings, pin,
                           pin IS NOT NULL AS "hasPin"`,
                [name || null, email || null, phone || null, hashedPass || null,
                 hashedPin || null, settings ? JSON.stringify(settings) : null,
                 username, removePin || false, clearPhone],
            );
            if (!result.rows[0]) throw new NotFoundError(`No user: ${username}`);
            return result.rows[0];
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            throw new BadRequestError(`Error updating user: ${error.message}`);
        }
    }

    static async verifyPin(username, pin) {
        const result = await pool.query(`SELECT pin FROM users WHERE username = $1`, [username]);
        const user = result.rows[0];
        if (!user || !user.pin) throw new BadRequestError('No PIN set for this account');
        if (pin !== user.pin) throw new UnauthorizedError('Incorrect PIN');
        return { success: true };
    }

    static async remove(username, localUsername) {
        if (username !== localUsername) throw new ForbiddenError("You can't delete other users");
        const result = await pool.query(`DELETE FROM users WHERE username = $1 RETURNING username`, [username]);
        if (!result.rows[0]) throw new NotFoundError(`No user: ${username}`);
    }
}

module.exports = User;
