import type { DatabaseUser } from "lucia";
import type { DatabaseSession } from "lucia";
import { Adapter } from "lucia";
import { Surreal } from "surrealdb.js";

/**
 * Options defining which tables to use for storing auth data
 */
export interface SurrealdbOptions {
	/** SurrealDB instance */
	db: Surreal;
	/** Users table name */
	user_tb: string;
	/** Sessions table name */
	session_tb: string;
}

type Session<User = string> = {
	id: string;
	user: User;
	expires_at: Date;
};

type User = {
	id: string;
};

export class SurrealAdapter implements Adapter {
	private readonly db: Surreal;
	private readonly user_tb: string;
	private readonly session_tb: string;

	constructor({ db, user_tb, session_tb }: SurrealdbOptions) {
		this.db = db;
		this.user_tb = user_tb;
		this.session_tb = session_tb;
	}

	async deleteSession(sessionId: string): Promise<void> {
		await this.db.query("delete type::thing($tb, $id)", {
			tb: this.session_tb,
			id: sessionId
		});
	}

	async deleteUserSessions(userId: string): Promise<void> {
		await this.db.query("delete type::table($tb) where user = $usr", {
			tb: this.session_tb,
			usr: `${this.user_tb}:${userId}`
		});
	}

	public async getSessionAndUser(
		sessionId: string
	): Promise<[session: DatabaseSession | null, user: DatabaseUser | null]> {
		const [session] = await this.db.query<[Session<User> | null]>(
			"select * from only type::thing($session_tb, $id) fetch user",
			{
				session_tb: this.session_tb,
				user_tb: this.user_tb,
				id: sessionId
			}
		);

		if (!session) {
			return [null, null];
		}

		return [transformSession(session), transformUser(session.user)];
	}

	async getUserSessions(userId: string): Promise<DatabaseSession[]> {
		const [sessions] = await this.db.query<[Session[]]>(
			"select * from type::table($tb) where user = $usr",
			{
				tb: this.session_tb,
				usr: thing(this.user_tb, userId)
			}
		);

		return sessions.map(transformSession);
	}

	async setSession(session: DatabaseSession): Promise<void> {
		await this.db.query(`create type::thing($tb, $id) content $data`, {
			tb: this.session_tb,
			id: session.id,
			data: {
				user: thing(this.user_tb, session.userId),
				expires_at: session.expiresAt,
				...session.attributes
			}
		});
	}

	async updateSessionExpiration(sessionId: string, expiresAt: Date): Promise<void> {
		await this.db.query("update type::thing($tb, $id) set expires_at = $exp", {
			tb: this.session_tb,
			id: sessionId,
			exp: expiresAt
		});
	}

	public async deleteExpiredSessions(): Promise<void> {
		await this.db.query("delete type::table($tb) where expires_at <= time::now()", {
			tb: this.session_tb
		});
	}
}

function transformSession(ss: Session<string | User>): DatabaseSession {
	const { id, user, expires_at, ...attributes } = ss;

	return {
		id: extractId(id),
		userId: extractId(typeof user === "object" ? user.id : user),
		expiresAt: new Date(expires_at),
		attributes
	};
}

function transformUser(user: User): DatabaseUser {
	const { id, ...attributes } = user;

	return {
		id: extractId(id),
		attributes
	};
}

function extractId(thing: string): string {
	return thing.split(":")[1];
}

function thing(tb: string, id: string) {
	return `${tb}:${id}`;
}
