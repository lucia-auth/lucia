import { pool } from "./db.js";
import {
	ESCAPED_USER_TABLE_NAME,
	ESCAPED_SESSION_TABLE_NAME,
	ESCAPED_KEY_TABLE_NAME
} from "../shared.js";

await pool.execute(`
CREATE TABLE IF NOT EXISTS ${ESCAPED_USER_TABLE_NAME} (
    id VARCHAR(15) PRIMARY KEY,
    username VARCHAR(15) NOT NULL UNIQUE
)
`);

await pool.execute(`
CREATE TABLE IF NOT EXISTS ${ESCAPED_SESSION_TABLE_NAME} (
    id VARCHAR(127) PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    active_expires BIGINT UNSIGNED NOT NULL,
    idle_expires BIGINT UNSIGNED NOT NULL,
    country VARCHAR(2) NOT NULL,
    
    FOREIGN KEY (user_id) REFERENCES ${ESCAPED_USER_TABLE_NAME}(id)
)
`);

await pool.execute(`
CREATE TABLE IF NOT EXISTS ${ESCAPED_KEY_TABLE_NAME} (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    hashed_password VARCHAR(255),

    FOREIGN KEY (user_id) REFERENCES ${ESCAPED_USER_TABLE_NAME}(id)
)
`);

process.exit(0);
