import type { LuciaErrorConstructor } from "../index.js";
import type { UserSchema, SessionSchema, KeySchema } from "./schema.js";

export type InitializeAdapter<
	T extends Adapter | UserAdapter | SessionAdapter
> = (E: LuciaErrorConstructor) => T;

export type Adapter = Readonly<
	{
		getSessionAndUser?: (
			sessionId: string
		) => Promise<[SessionSchema, UserSchema] | [null, null]>;
	} & SessionAdapter &
		UserAdapter
>;

export type UserAdapter = Readonly<{
	getUser: (userId: string) => Promise<UserSchema | null>;
	setUser: (user: UserSchema, key: KeySchema | null) => Promise<void>;
	updateUser: (
		userId: string,
		partialUser: Partial<UserSchema>
	) => Promise<void>;
	deleteUser: (userId: string) => Promise<void>;

	getKey: (keyId: string) => Promise<KeySchema | null>;
	getKeysByUserId: (userId: string) => Promise<KeySchema[]>;
	setKey: (key: KeySchema) => Promise<void>;
	updateKey: (keyId: string, partialKey: Partial<KeySchema>) => Promise<void>;
	deleteKey: (keyId: string) => Promise<void>;
	deleteKeysByUserId: (userId: string) => Promise<void>;
}>;

export type SessionAdapter = Readonly<{
	getSession: (sessionId: string) => Promise<SessionSchema | null>;
	getSessionsByUserId: (userId: string) => Promise<SessionSchema[]>;
	setSession: (session: SessionSchema) => Promise<void>;
	updateSession: (
		sessionId: string,
		partialSession: Partial<SessionSchema>
	) => Promise<void>;
	deleteSession: (sessionId: string) => Promise<void>;
	deleteSessionsByUserId: (userId: string) => Promise<void>;
}>;
