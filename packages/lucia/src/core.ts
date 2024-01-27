import { TimeSpan, createDate, isWithinExpirationDate } from "oslo";
import { generateId } from "./crypto.js";
import { CookieController } from "oslo/cookie";

import type { Cookie } from "oslo/cookie";
import type { Adapter } from "./database.js";
import type {
	RegisteredDatabaseSessionAttributes,
	RegisteredDatabaseUserAttributes,
	RegisteredLucia
} from "./index.js";
import { CookieAttributes } from "oslo/cookie";

type SessionAttributes = RegisteredLucia extends Lucia<infer _SessionAttributes, any>
	? _SessionAttributes
	: {};

type UserAttributes = RegisteredLucia extends Lucia<any, infer _UserAttributes>
	? _UserAttributes
	: {};

export interface Session extends SessionAttributes {
	id: string;
	expiresAt: Date;
	fresh: boolean;
	userId: string;
}

export interface User extends UserAttributes {
	id: string;
}

export class Lucia<
	_SessionAttributes extends {} = Record<never, never>,
	_UserAttributes extends {} = Record<never, never>
> {
	private adapter: Adapter;
	private sessionExpiresIn: TimeSpan;
	private sessionCookieController: CookieController;

	private getSessionAttributes: (
		databaseSessionAttributes: RegisteredDatabaseSessionAttributes
	) => _SessionAttributes;

	private getUserAttributes: (
		databaseUserAttributes: RegisteredDatabaseUserAttributes
	) => _UserAttributes;

	public readonly sessionCookieName: string;

	constructor(
		adapter: Adapter,
		options?: {
			sessionExpiresIn?: TimeSpan;
			sessionCookie?: SessionCookieOptions;
			getSessionAttributes?: (
				databaseSessionAttributes: RegisteredDatabaseSessionAttributes
			) => _SessionAttributes;
			getUserAttributes?: (
				databaseUserAttributes: RegisteredDatabaseUserAttributes
			) => _UserAttributes;
		}
	) {
		this.adapter = adapter;

		// we have to use `any` here since TS can't do conditional return types
		this.getUserAttributes = (databaseUserAttributes): any => {
			if (options && options.getUserAttributes) {
				return options.getUserAttributes(databaseUserAttributes);
			}
			return {};
		};
		this.getSessionAttributes = (databaseSessionAttributes): any => {
			if (options && options.getSessionAttributes) {
				return options.getSessionAttributes(databaseSessionAttributes);
			}
			return {};
		};
		this.sessionExpiresIn = options?.sessionExpiresIn ?? new TimeSpan(30, "d");
		this.sessionCookieName = options?.sessionCookie?.name ?? "auth_session";
		let sessionCookieExpiresIn = this.sessionExpiresIn;
		if (options?.sessionCookie?.expires === false) {
			sessionCookieExpiresIn = new TimeSpan(365 * 2, "d");
		}
		const baseSessionCookieAttributes: CookieAttributes = {
			httpOnly: true,
			secure: true,
			sameSite: "lax",
			path: "/",
			...options?.sessionCookie?.attributes
		};
		this.sessionCookieController = new CookieController(
			this.sessionCookieName,
			baseSessionCookieAttributes,
			{
				expiresIn: sessionCookieExpiresIn
			}
		);
	}

	public async getUserSessions(userId: string): Promise<Session[]> {
		const databaseSessions = await this.adapter.getUserSessions(userId);
		const sessions: Session[] = [];
		for (const databaseSession of databaseSessions) {
			if (!isWithinExpirationDate(databaseSession.expiresAt)) {
				continue;
			}
			sessions.push({
				id: databaseSession.id,
				expiresAt: databaseSession.expiresAt,
				userId: databaseSession.userId,
				fresh: false,
				...this.getSessionAttributes(databaseSession.attributes)
			});
		}
		return sessions;
	}

	public async validateSession(
		sessionId: string
	): Promise<{ user: User; session: Session } | { user: null; session: null }> {
		const [databaseSession, databaseUser] = await this.adapter.getSessionAndUser(sessionId);
		if (!databaseSession) {
			return { session: null, user: null };
		}
		if (!databaseUser) {
			await this.adapter.deleteSession(databaseSession.id);
			return { session: null, user: null };
		}
		if (!isWithinExpirationDate(databaseSession.expiresAt)) {
			await this.adapter.deleteSession(databaseSession.id);
			return { session: null, user: null };
		}
		const activePeriodExpirationDate = new Date(
			databaseSession.expiresAt.getTime() - this.sessionExpiresIn.milliseconds() / 2
		);
		const session: Session = {
			...this.getSessionAttributes(databaseSession.attributes),
			id: databaseSession.id,
			userId: databaseSession.userId,
			fresh: false,
			expiresAt: databaseSession.expiresAt
		};
		if (!isWithinExpirationDate(activePeriodExpirationDate)) {
			session.fresh = true;
			session.expiresAt = createDate(this.sessionExpiresIn);
			await this.adapter.updateSessionExpiration(databaseSession.id, session.expiresAt);
		}
		const user: User = {
			...this.getUserAttributes(databaseUser.attributes),
			id: databaseUser.id
		};
		return { user, session };
	}

	public async createSession(
		userId: string,
		attributes: RegisteredDatabaseSessionAttributes,
		options?: {
			sessionId?: string;
		}
	): Promise<Session> {
		const sessionId = options?.sessionId ?? generateId(40);
		const sessionExpiresAt = createDate(this.sessionExpiresIn);
		await this.adapter.setSession({
			id: sessionId,
			userId,
			expiresAt: sessionExpiresAt,
			attributes
		});
		const session: Session = {
			id: sessionId,
			userId,
			fresh: true,
			expiresAt: sessionExpiresAt,
			...this.getSessionAttributes(attributes)
		};
		return session;
	}

	public async invalidateSession(sessionId: string): Promise<void> {
		await this.adapter.deleteSession(sessionId);
	}

	public async invalidateUserSessions(userId: string): Promise<void> {
		await this.adapter.deleteUserSessions(userId);
	}

	public async deleteExpiredSessions(): Promise<void> {
		await this.adapter.deleteExpiredSessions();
	}

	public readSessionCookie(cookieHeader: string): string | null {
		const sessionId = this.sessionCookieController.parse(cookieHeader);
		return sessionId;
	}

	public readBearerToken(authorizationHeader: string): string | null {
		const [authScheme, token] = authorizationHeader.split(" ") as [string, string | undefined];
		if (authScheme !== "Bearer") {
			return null;
		}
		return token ?? null;
	}

	public createSessionCookie(sessionId: string): Cookie {
		return this.sessionCookieController.createCookie(sessionId);
	}

	public createBlankSessionCookie(): Cookie {
		return this.sessionCookieController.createBlankCookie();
	}
}

export interface SessionCookieOptions {
	name?: string;
	expires?: boolean;
	attributes?: SessionCookieAttributesOptions;
}

export interface SessionCookieAttributesOptions {
	sameSite?: "lax" | "strict";
	domain?: string;
	path?: string;
	secure?: boolean;
}
