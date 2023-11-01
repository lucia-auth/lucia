import type {
	DatabaseSessionAttributes,
	DatabaseUserAttributes
} from "../index.js";

export interface UserSchema extends DatabaseUserAttributes {
	id: string;
}

export interface SessionSchema extends DatabaseSessionAttributes {
	id: string;
	expires: number | bigint;
	user_id: string;
}
