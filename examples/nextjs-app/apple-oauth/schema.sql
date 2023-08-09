CREATE TABLE user (
    id VARCHAR(15) NOT NULL PRIMARY KEY,
    email VARCHAR(31) NOT NULL
);
CREATE TABLE user_key (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    hashed_password VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES user(id)
);
CREATE TABLE user_session (
    id VARCHAR(127) NOT NULL PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    active_expires BIGINT NOT NULL,
    idle_expires BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id)
);