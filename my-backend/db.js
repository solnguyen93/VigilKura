const { Pool } = require('pg');

let pool;

if (process.env.NODE_ENV === 'production') {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });
} else {
    require('dotenv').config();
    pool = new Pool({
        user: process.env.PGUSER,
        host: process.env.PGHOST || 'localhost',
        database: process.env.PGDATABASE,
        password: process.env.PGPASSWORD,
        port: process.env.PGPORT || 5432,
    });
}

module.exports = pool;
