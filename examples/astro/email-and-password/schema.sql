CREATE TABLE user (
    id VARCHAR(15) PRIMARY KEY,
    email VARCHAR(31) NOT NULL UNIQUE,
    email_verified INTEGER NOT NULL
);
CREATE TABLE user_key (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    hashed_password VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES user(id)
);
CREATE TABLE user_session (
    id VARCHAR(127) PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    active_expires BIGINT NOT NULL,
    idle_expires BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id)
);
CREATE TABLE email_verification_token (
    id VARCHAR(63) PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    expires BIGINT NOT NULL
);
CREATE TABLE password_reset_token (
    id VARCHAR(63) PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    expires BIGINT NOT NULL
);