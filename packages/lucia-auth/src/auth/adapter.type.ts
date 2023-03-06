import type { LuciaErrorConstructor } from "../index.js";
import type { UserSchema, SessionSchema, KeySchema } from "./schema.type.js";

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
	) => Promise<UserSchema>;
	deleteUser: (userId: string) => Promise<void>;
	updateUserAttributes: (
		userId: string,
		attributes: Record<string, any>
	) => Promise<UserSchema>;
	setKey: (key: KeySchema) => Promise<void>;
	deleteNonPrimaryKey: (...key: string[]) => Promise<void>;
	deleteKeysByUserId: (userId: string) => Promise<void>;
	updateKeyPassword: (
		key: string,
		hashedPassword: string | null
	) => Promise<void>;
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
	deleteSession: (...sessionIds: string[]) => Promise<void>;
	deleteSessionsByUserId: (userId: string) => Promise<void>;
}>;
