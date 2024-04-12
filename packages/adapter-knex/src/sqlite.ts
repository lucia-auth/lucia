import BaseKnexAdapter from "./base.js";
import type { KnexUserTable, KnexSessionTable } from "./base.js";
import type { Adapter, DatabaseSession, DatabaseUser } from "lucia";
export default class KnexMySQLAdapter extends BaseKnexAdapter implements Adapter {
	public async getSessionAndUser(
		sessionId: string
	): Promise<[session: DatabaseSession | null, user: DatabaseUser | null]> {
		const session = await this.knex<KnexSessionTable>(this.tables.sessions)
			.select("*")
			.where("sessionId", "=", sessionId)
			.first();

		if (session === undefined) {
			return [null, null];
		}

		const user = await this.knex<KnexUserTable>(this.tables.users)
			.select("*")
			.where("userId", "=", session.userId)
			.first();

		if (user === undefined) {
			return [null, null];
		}

		return [this.transformIntoDatabaseSession(session), this.transformIntoDatabaseUser(user)];
	}
}
