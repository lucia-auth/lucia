import type { UserSchema, SessionSchema } from "./database.js";

export interface Adapter {
	getSessionAndUser(
		sessionId: string
	): Promise<
		[session: SessionSchema, user: UserSchema] | [session: null, user: null]
	>;
	getUserSessions(userId: string): Promise<SessionSchema[]>
	setSession(value: SessionSchema): Promise<void>;
	updateSession(
		sessionId: string,
		value: Partial<SessionSchema>
	): Promise<void>;
	deleteSession(sessionId: string): Promise<void>;
	deleteUserSessions(userId: string): Promise<void>;
}
