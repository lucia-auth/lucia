import type {
	RegisteredDatabaseSessionAttributes,
	RegisteredDatabaseUserAttributes
} from "./index.js";

export interface Adapter<TUserId> {
	getSessionAndUser(
		sessionId: string
	): Promise<[session: DatabaseSession<TUserId> | null, user: DatabaseUser<TUserId> | null]>;
	getUserSessions(userId: TUserId): Promise<DatabaseSession<TUserId>[]>;
	setSession(session: DatabaseSession<TUserId>): Promise<void>;
	updateSessionExpiration(sessionId: string, expiresAt: Date): Promise<void>;
	deleteSession(sessionId: string): Promise<void>;
	deleteUserSessions(userId: TUserId): Promise<void>;
	deleteExpiredSessions(): Promise<void>;
}

export interface DatabaseUser<TUserId> {
	id: TUserId;
	attributes: RegisteredDatabaseUserAttributes;
}

export interface DatabaseSession<TUserId> {
	userId: TUserId;
	expiresAt: Date;
	id: string;
	attributes: RegisteredDatabaseSessionAttributes;
}
