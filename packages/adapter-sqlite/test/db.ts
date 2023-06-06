import sqlite from "better-sqlite3";

export const db = sqlite("test/main.db");

export const TABLE_NAMES = {
	user: "test_user",
	session: "user_session",
	key: "user_key"
};
