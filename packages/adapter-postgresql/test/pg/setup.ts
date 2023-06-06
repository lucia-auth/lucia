import {
	ESCAPED_KEY_TABLE_NAME,
	ESCAPED_SESSION_TABLE_NAME,
	ESCAPED_USER_TABLE_NAME
} from "../shared.js";
import { pool } from "./db.js";

await pool.query(`
CREATE TABLE ${ESCAPED_USER_TABLE_NAME} (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE
)
`);

await pool.query(`
CREATE TABLE ${ESCAPED_SESSION_TABLE_NAME} (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES ${ESCAPED_USER_TABLE_NAME}(id),
    active_expires BIGINT NOT NULL,
    idle_expires BIGINT NOT NULL,
    country TEXT NOT NULL
)
`);

await pool.query(`
CREATE TABLE ${ESCAPED_KEY_TABLE_NAME} (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES ${ESCAPED_USER_TABLE_NAME}(id),
    hashed_password VARCHAR(255)
)
`);

process.exit(0);
