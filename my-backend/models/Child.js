const pool = require('../db');
const { NotFoundError } = require('../expressError');

class Child {
    // Get all children belonging to a parent, ordered by creation date
    static async getAll(parentId) {
        const result = await pool.query(
            `SELECT id, name, settings, created_at AS "createdAt"
             FROM children
             WHERE parent_id = $1
             ORDER BY created_at ASC`,
            [parentId],
        );
        return result.rows;
    }

    // Add a new child for a parent — trims whitespace from the name
    static async add(parentId, name) {
        const result = await pool.query(
            `INSERT INTO children (parent_id, name)
             VALUES ($1, $2)
             RETURNING id, name, settings, created_at AS "createdAt"`,
            [parentId, name.trim()],
        );
        return result.rows[0];
    }

    // Rename a child — verifies parent_id to prevent renaming another user's child
    static async rename(id, parentId, name) {
        const result = await pool.query(
            `UPDATE children SET name = $1 WHERE id = $2 AND parent_id = $3 RETURNING id, name, settings`,
            [name.trim(), id, parentId],
        );
        if (!result.rows[0]) throw new NotFoundError(`Child not found`);
        return result.rows[0];
    }

    // Update the settings JSONB column for a child — verifies parent_id
    // Settings include word list, screen time limits, and notification preferences
    static async updateSettings(id, parentId, settings) {
        const result = await pool.query(
            `UPDATE children
             SET settings = $1::jsonb
             WHERE id = $2 AND parent_id = $3
             RETURNING id, name, settings`,
            [JSON.stringify(settings), id, parentId],
        );
        if (!result.rows[0]) throw new NotFoundError(`Child not found`);
        return result.rows[0];
    }

    // Remove a child record — verifies parent_id to prevent deleting another user's child
    static async remove(id, parentId) {
        const result = await pool.query(
            `DELETE FROM children WHERE id = $1 AND parent_id = $2 RETURNING id`,
            [id, parentId],
        );
        if (!result.rows[0]) throw new NotFoundError(`Child not found`);
    }
}

module.exports = Child;
