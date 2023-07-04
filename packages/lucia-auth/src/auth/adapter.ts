import type { LuciaErrorConstructor } from "../index.js";
import type { UserSchema, SessionSchema, KeySchema } from "./schema.js";

export type AdapterFunction<T extends Adapter | UserAdapter | SessionAdapter> =
	(E: LuciaErrorConstructor) => T;

export type Adapter = Readonly<
	{
		getSessionAndUserBySessionId?: (sessionId: string) => Promise<{
			user: UserSchema;
			session: SessionSchema;
		} | null>;
	} & SessionAdapter &
		UserAdapter
>;

export type UserAdapter = Readonly<{
	getUser: (userId: string) => Promise<UserSchema | null>;
	setUser: (
		userId: string,
		userAttributes: Record<any, any>,
		key: KeySchema | null
	) => Promise<UserSchema | void>;
	deleteUser: (userId: string) => Promise<void>;
	updateUserAttributes: (
		userId: string,
		attributes: Record<string, any>
	) => Promise<UserSchema | void>;
	setKey: (key: KeySchema) => Promise<void>;
	deleteNonPrimaryKey: (keyId: string) => Promise<void>;
	deleteKeysByUserId: (userId: string) => Promise<void>;
	updateKeyPassword: (
		keyId: string,
		hashedPassword: string | null
	) => Promise<void | KeySchema>;
	getKey: (
		keyId: string,
		shouldDataBeDeleted: (key: KeySchema) => Promise<boolean>
	) => Promise<KeySchema | null>;
	getKeysByUserId: (userId: string) => Promise<KeySchema[]>;
}>;

export type SessionAdapter = Readonly<{
	getSession: (sessionId: string) => Promise<SessionSchema | null>;
	getSessionsByUserId: (userId: string) => Promise<SessionSchema[]>;
	setSession: (session: SessionSchema) => Promise<void>;
	deleteSession: (sessionId: string) => Promise<void>;
	deleteSessionsByUserId: (userId: string) => Promise<void>;
}>;
