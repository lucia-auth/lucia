import type {
	DatabaseSessionAttributes,
	DatabaseUserAttributes
} from "../index.js";

export interface Adapter {
	getSessionAndUser(
		sessionId: string
	): Promise<[session: DatabaseSession | null, user: DatabaseUser | null]>;
	getUserSessions(userId: string): Promise<DatabaseSession[]>;
	setSession(value: DatabaseSession): Promise<void>;
	updateSession(
		sessionId: string,
		value: Partial<DatabaseSession>
	): Promise<void>;
	deleteSession(sessionId: string): Promise<void>;
	deleteUserSessions(userId: string): Promise<void>;
}

export interface SessionAdapter {
	getSession(sessionId: string): Promise<DatabaseSession | null>;
	getUserSessions(userId: string): Promise<DatabaseSession[]>;
	setSession(value: DatabaseSession): Promise<void>;
	updateSession(
		sessionId: string,
		value: Partial<DatabaseSession>
	): Promise<void>;
	deleteSession(sessionId: string): Promise<void>;
	deleteUserSessions(userId: string): Promise<void>;
}

export interface DatabaseUser {
	userId: string;
	attributes: DatabaseUserAttributes;
}

export interface DatabaseSession {
	sessionId: string;
	expiresAt: Date;
	userId: string;
	attributes: DatabaseSessionAttributes;
}
