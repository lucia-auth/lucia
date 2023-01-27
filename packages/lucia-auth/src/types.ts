import type { LuciaErrorConstructor } from "./index.js";

export type { Auth } from "./auth/index.js";

export type User = ReturnType<Lucia.Auth["transformUserData"]>;

export type Session = {
	sessionId: string;
	userId: string;
	activePeriodExpires: Date;
	idlePeriodExpires: Date;
	state: "idle" | "active";
	isFresh: boolean;
};

export type Key = {
	isPasswordDefined: boolean;
	isPrimary: boolean;
	providerId: string;
	providerUserId: string;
	userId: string;
};

export type KeySchema = {
	id: string;
	hashed_password: string | null;
	primary: boolean;
	user_id: string;
};

export type Env = "DEV" | "PROD";

export type UserSchema = {
	id: string;
	[k: string]: any;
};

export type UserData = { id: string } & Required<Lucia.UserAttributes>;

export type SessionSchema = {
	id: string;
	active_expires: number | bigint;
	idle_expires: number | bigint;
	user_id: string;
};

export type AdapterFunction<T extends Adapter | UserAdapter | SessionAdapter> =
	(E: LuciaErrorConstructor) => T;

export type Adapter = {
	getSessionAndUserBySessionId?: (sessionId: string) => Promise<{
		user: UserSchema;
		session: SessionSchema;
	} | null>;
} & SessionAdapter &
	UserAdapter;

export type UserAdapter = {
	getUser: (userId: string) => Promise<UserSchema | null>;
	getUserByKey: (key: string) => Promise<UserSchema | null>;
	setUser: (
		userId: string | null,
		attributes: Record<string, any>
	) => Promise<UserSchema>;
	deleteUser: (userId: string) => Promise<void>;
	updateUserAttributes: (
		userId: string,
		attributes: Record<string, any>
	) => Promise<UserSchema>;
	setKey: (
		key: string,
		data: {
			userId: string;
			hashedPassword: string | null;
			isPrimary: boolean;
		}
	) => Promise<KeySchema>;
	deleteNonPrimaryKey: (...key: string[]) => Promise<void>;
	deleteKeysByUserId: (userId: string) => Promise<void>;
	updateKeyPassword: (
		key: string,
		hashedPassword: string | null
	) => Promise<KeySchema>;
	getKey: (keyId: string) => Promise<KeySchema | null>;
	getKeysByUserId: (userId: string) => Promise<KeySchema[]>;
};

export type SessionAdapter = {
	getSession: (sessionId: string) => Promise<SessionSchema | null>;
	getSessionsByUserId: (userId: string) => Promise<SessionSchema[]>;
	setSession: (
		sessionId: string,
		data: {
			userId: string;
			activePeriodExpires: number;
			idlePeriodExpires: number;
		}
	) => Promise<void>;
	deleteSession: (...sessionIds: string[]) => Promise<void>;
	deleteSessionsByUserId: (userId: string) => Promise<void>;
};

export type MinimalRequest = {
	headers: {
		get: (name: string) => null | string;
	};
	url: string;
	method: string;
};
