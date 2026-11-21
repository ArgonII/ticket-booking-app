
const fs = require('node:fs');
const { Pool } = require('pg');

// Read password from Vault-injected file when configured.
// Fall back to environment variable for local development.
const password = process.env.DB_PASSWORD_FILE
    ? fs.readFileSync(process.env.DB_PASSWORD_FILE, 'utf8')
        .replace(/\r?\n$/, '')
    : process.env.DB_PASSWORD;

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password,
    database: process.env.DB_NAME || 'ticketbooking'
});

module.exports = pool;
