import { escapeName } from "../src/utils.js";

export const TABLE_NAMES = {
	user: "test_user",
	session: "user_session",
	key: "user_key"
};

export const ESCAPED_USER_TABLE_NAME = escapeName(TABLE_NAMES.user);
export const ESCAPED_SESSION_TABLE_NAME = escapeName(TABLE_NAMES.session);
export const ESCAPED_KEY_TABLE_NAME = escapeName(TABLE_NAMES.key);
