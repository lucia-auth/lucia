import BaseKnexAdapter from "./base.js";
import type { KnexUserTable, KnexSessionTable } from "./base.js";
import type { Adapter, DatabaseSession, DatabaseUser } from "lucia";
export default class KnexMySQLAdapter extends BaseKnexAdapter implements Adapter {
  public async getSessionAndUser(sessionId: string): Promise<[session: DatabaseSession | null, user: DatabaseUser | null]> {
    const [result] = ((
      await this.knex<KnexSessionTable>(this.tables.sessions)
        .select("*")
        .innerJoin<KnexUserTable>(this.tables.users, `${this.tables.sessions}.userId`, "=", `${this.tables.users}.userId`)
        .where(this.knex.ref(`${this.tables.sessions}.sessionId`), "=", sessionId)
        .options({ nestTables: true })
    ) as unknown[] as ({ user: KnexUserTable, session: KnexSessionTable })[]);

    if (result === undefined) {
      return [null, null];
    }

    const user = this.transformIntoDatabaseUser(result.user);
    const session = this.transformIntoDatabaseSession(result.session);

    return [session, user];
  }
}
