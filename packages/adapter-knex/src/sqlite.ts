import type { Knex } from "knex";
import type { Adapter, DatabaseSession, DatabaseUser, UserId } from "lucia";

type KnexSQLiteAdapterTables = ({
  users: string;
  sessions: string;
});

type KnexUserTable = ({
  userId: UserId;
});

type KnexSessionTable = ({
  userId: UserId;
  sessionId: string;
  expiresAtTimestamp: Date;
});

function transformIntoDatabaseSession(raw: KnexSessionTable): DatabaseSession {
  const { sessionId, userId, expiresAtTimestamp, ...attributes } = raw;
  const expiresAt = new Date(expiresAtTimestamp);

  return ({ id: sessionId, userId, expiresAt, attributes });
}

function transformIntoDatabaseUser(raw: KnexUserTable): DatabaseUser {
  const { userId, ...attributes } = raw;
  return ({ id: userId, attributes });
}

export default class KnexSQLiteAdapter implements Adapter {
  private readonly knex: Knex;
  private readonly tables: KnexSQLiteAdapterTables;

  public constructor(knex: Knex, tables: KnexSQLiteAdapterTables) {
    this.knex = knex;
    this.tables = tables;
  }

  public async getSessionAndUser(sessionId: string): Promise<[session: DatabaseSession | null, user: DatabaseUser | null]> {
    const session = await this.knex<KnexSessionTable>(this.tables.sessions)
      .select("*")
      .where("sessionId", "=", sessionId)
      .first()

    if(session === undefined) {
      return [null, null];
    }

    const user = await this.knex<KnexUserTable>(this.tables.users)
      .select("*")
      .where("userId", "=", session.userId)
      .first();

    if(user === undefined) {
      return [null, null];
    }

    return [transformIntoDatabaseSession(session), transformIntoDatabaseUser(user)];
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
        sessionId: session.id,
        userId: session.userId,
        expiresAtTimestamp: session.expiresAt,
        ...session.attributes
      });
  }

  public async updateSessionExpiration(sessionId: string, expiresAtTimestamp: Date): Promise<void> {
    await this.knex<KnexSessionTable>(this.tables.sessions)
      .update("expiresAtTimestamp", expiresAtTimestamp)
      .where("sessionId", "=", sessionId);
  }

  public async deleteSession(sessionId: string): Promise<void> {
    await this.knex<KnexSessionTable>(this.tables.sessions)
      .del()
      .where("sessionId", "=", sessionId);
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
