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

export type Env = "DEV" | "PROD";

export type UserSchema = {
	id: string;
	hashed_password: string | null;
	provider_id: string;
	[k: string]: any;
};

export type UserData = { id: string } & Required<Lucia.UserAttributes>;

export type SessionSchema = {
	id: string;
	expires: number | bigint;
	idle_expires: number | bigint;
	user_id: string;
};

export type AdapterFunction<T extends Adapter | UserAdapter | SessionAdapter> = (
	E: LuciaErrorConstructor
) => T;

export type Adapter = {
	getSessionAndUserBySessionId?: (sessionId: string) => Promise<{
		user: UserSchema;
		session: SessionSchema;
	} | null>;
} & SessionAdapter &
	UserAdapter;

export type UserAdapter = {
	getUser: (userId: string) => Promise<UserSchema | null>;
	getUserByProviderId: (providerId: string) => Promise<UserSchema | null>;
	setUser: (
		userId: string | null,
		data: {
			providerId: string;
			hashedPassword: string | null;
			attributes: Record<string, any>;
		}
	) => Promise<UserSchema>;
	deleteUser: (userId: string) => Promise<void>;
	updateUser: (
		userId: string,
		data: {
			providerId?: string | null;
			hashedPassword?: string | null;
			attributes?: Record<string, any>;
		}
	) => Promise<UserSchema>;
};

export type SessionAdapter = {
	getSession: (sessionId: string) => Promise<SessionSchema | null>;
	getSessionsByUserId: (userId: string) => Promise<SessionSchema[]>;
	setSession: (
		sessionId: string,
		data: {
			userId: string;
			expires: number;
			idlePeriodExpires: number;
		}
	) => Promise<void>;
	deleteSession: (...sessionIds: string[]) => Promise<void>;
	deleteSessionsByUserId: (userId: string) => Promise<void>;
};

export type AdapterConfig = {
	userTable?: string,
	sessionTable?: string
}

export type MinimalRequest = {
	headers: {
		get: (name: string) => null | string;
	};
	url: string;
	method: string;
};
