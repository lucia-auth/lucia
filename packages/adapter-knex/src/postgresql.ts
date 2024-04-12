import type { Knex } from "knex";
import type { Adapter, DatabaseSession, DatabaseUser, UserId } from "lucia";

type KnexPostgreSQLAdapterTables = ({
  users: string;
  sessions: string;
});

type KnexUserTable = ({
  id: UserId;
});

type KnexSessionTable = ({
  id: string;
  userId: UserId;
  expiresAtTimestamp: Date;
});

function transformIntoDatabaseSession(raw: KnexSessionTable): DatabaseSession {
  const { id, userId, expiresAtTimestamp, ...attributes } = raw;
  const expiresAt = new Date(expiresAtTimestamp);

  return ({ id, userId, expiresAt, attributes });
}

function transformIntoDatabaseUser(raw: KnexUserTable): DatabaseUser {
  const { id, ...attributes } = raw;
  return { id, attributes };
}

export default class KnexPostgreSQLAdapter implements Adapter {
  private readonly knex: Knex;
  private readonly tables: KnexPostgreSQLAdapterTables;

  public constructor(knex: Knex, tables: KnexPostgreSQLAdapterTables) {
    this.knex = knex;
    this.tables = tables;
  }

  public async getSessionAndUser(sessionId: string): Promise<[session: DatabaseSession | null, user: DatabaseUser | null]> {
    const [result] = ((
      await this.knex<KnexSessionTable>(this.tables.sessions)
        .select([
          this.knex.raw(`TO_JSON(${this.knex.ref(this.tables.users)}.*) AS user`),
          this.knex.raw(`TO_JSON(${this.knex.ref(this.tables.sessions)}.*) AS session`)
        ])
        .innerJoin<KnexUserTable>(this.tables.users, `${this.tables.sessions}.userId`, "=", `${this.tables.users}.id`)
    ) as unknown[] as ({ user: KnexUserTable, session: KnexSessionTable })[]);

    if (result === undefined) {
      return [null, null];
    }

    const user = transformIntoDatabaseUser(result.user);
    const session = transformIntoDatabaseSession(result.session);

    return [session, user];
  }

  public async getUserSessions(userId: string): Promise<DatabaseSession[]> {
    const results = await this.knex<KnexSessionTable>(this.tables.sessions)
      .select("*")
      .where("userId", "=", userId);

    return results.map((result) => transformIntoDatabaseSession(result));
  }

  public async setSession(session: DatabaseSession): Promise<void> {
    await this.knex<KnexSessionTable>(this.tables.sessions)
      .insert({
        id: session.id,
        userId: session.userId,
        expiresAtTimestamp: session.expiresAt,
        ...session.attributes
      });
  }

  public async updateSessionExpiration(sessionId: string, expiresAtTimestamp: Date): Promise<void> {
    await this.knex<KnexSessionTable>(this.tables.sessions)
      .update("expiresAtTimestamp", expiresAtTimestamp)
      .where("id", "=", sessionId);
  }

  public async deleteSession(sessionId: string): Promise<void> {
    await this.knex<KnexSessionTable>(this.tables.sessions)
      .del()
      .where("id", "=", sessionId);
  }

  public async deleteUserSessions(userId: string): Promise<void> {
    await this.knex<KnexSessionTable>(this.tables.sessions)
      .del()
      .where("userId", "=", userId);
  }

  public async deleteExpiredSessions(): Promise<void> {
    await this.knex<KnexSessionTable>(this.tables.sessions)
      .del()
      .where("expiresAtTimestamp", "<=", new Date());
  }
}
