import { pool } from "./db.js";

await pool.query(`
CREATE TABLE auth_user (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE
)
`);

await pool.query(`
CREATE TABLE auth_session (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES auth_user(id),
    active_expires BIGINT NOT NULL,
    idle_expires BIGINT NOT NULL,
    country TEXT NOT NULL
)
`);

await pool.query(`
CREATE TABLE auth_key (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES auth_user(id),
    hashed_password VARCHAR(255)
)
`);
