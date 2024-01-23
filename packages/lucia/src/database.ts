import type {
	RegisteredDatabaseSessionAttributes,
	RegisteredDatabaseUserAttributes
} from "./index.js";

export interface Adapter {
	getSessionAndUser(
		sessionId: string
	): Promise<[session: DatabaseSession | null, user: DatabaseUser | null]>;
	getUserSessions(userId: string): Promise<DatabaseSession[]>;
	setSession(session: DatabaseSession): Promise<void>;
	updateSessionExpiration(sessionId: string, expiresAt: Date): Promise<void>;
	deleteSession(sessionId: string): Promise<void>;
	deleteUserSessions(userId: string): Promise<void>;
	deleteExpiredSessions(): Promise<void>;
}

export interface DatabaseUser {
	id: string;
	attributes: RegisteredDatabaseUserAttributes;
}

export interface DatabaseSession {
	userId: string;
	expiresAt: Date;
	id: string;
	attributes: RegisteredDatabaseSessionAttributes;
}
