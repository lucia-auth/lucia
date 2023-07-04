import type {
	GlobalDatabaseUserAttributes,
	GlobalDatabaseSessionAttributes
} from "lucia";

export type UserDoc = {
	_id: string;
	__v?: any;
} & GlobalDatabaseUserAttributes;

export type SessionDoc = {
	_id: string;
	__v?: any;
	active_expires: number;
	user_id: string;
	idle_expires: number;
} & GlobalDatabaseSessionAttributes;

export type KeyDoc = {
	_id: string;
	__v?: any;
	user_id: string;
	hashed_password?: string;
};
