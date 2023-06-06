import { connection } from "./db.js";

await connection.execute(`
CREATE TABLE IF NOT EXISTS auth_user (
    id VARCHAR(15) PRIMARY KEY,
    username VARCHAR(15) NOT NULL UNIQUE
)
`);

await connection.execute(`
CREATE TABLE IF NOT EXISTS auth_session (
    id VARCHAR(127) PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    active_expires BIGINT UNSIGNED NOT NULL,
    idle_expires BIGINT UNSIGNED NOT NULL,
    country VARCHAR(2) NOT NULL
)
`);

await connection.execute(`
CREATE TABLE IF NOT EXISTS auth_key (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    hashed_password VARCHAR(255)
)
`);
