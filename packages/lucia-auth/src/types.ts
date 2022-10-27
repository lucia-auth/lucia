import type { LuciaError } from "./error.js";
export type { Auth } from "./auth/index.js";

export type User = ReturnType<Lucia.Auth["configs"]["transformUserData"]>;

export type Session = {
	sessionId: string;
	userId: string;
	expires: number;
	idlePeriodExpires: number;
};

export type Env = "DEV" | "PROD";
export type Error = typeof LuciaError;

export type UserSchema = {
	id: string;
	hashed_password: string | null;
	provider_id: string;
} & Lucia.UserAttributes;

export type UserData = { id: string } & Required<Lucia.UserAttributes>;

export type SessionSchema = {
	id: string;
	expires: number;
	idle_expires: number;
	user_id: string;
};

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
