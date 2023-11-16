import type {
	GlobalDatabaseSessionAttributes,
	GlobalDatabaseUserAttributes
} from "lucia";

export type UserDoc = {
	_id: string;
} & GlobalDatabaseUserAttributes;

export type SessionDoc = {
	_id: string;
	active_expires: number;
	user_id: string;
	idle_expires: number;
} & GlobalDatabaseSessionAttributes;

export type KeyDoc = {
	_id: string;
	user_id: string;
	hashed_password?: string;
};
