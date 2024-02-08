import type {
	Adapter,
	DatabaseSession,
	RegisteredDatabaseSessionAttributes,
	DatabaseUser,
	RegisteredDatabaseUserAttributes
} from "lucia";

interface UserDoc extends RegisteredDatabaseUserAttributes {
	id: string;
}

interface SessionDoc extends RegisteredDatabaseSessionAttributes {
	id: string;
	user_id: string;
	expires_at: Date;
}

interface TableNames {
  user: string;
  session: string;
}
export class SurrqlAdapter implements Adapter {
  private connector; 
  private table_names: TableNames;

  constructor(connector: any, table_names: TableNames){
    this.table_names = table_names;
    this.connector = connector;
  }

  public async deleteSession(sessionId: string): Promise<void> {
    await this.connector.query(`DELETE ${this.table_names.session}:${sessionId};`)
  }

  public async deleteExpiredSessions(): Promise<void> {
    await this.connector.query(`DELETE FROM ${this.table_names.session} WHERE expires_at <= time::now();`)
  }

  public async deleteUserSessions(userId: string): Promise<void> {
    
    await this.connector.query(`DELETE FROM ${this.table_names.session} WHERE user_id = "${userId}";`)
  }

  /*
    getSessionAndUser(): Returns the session and the user linked to the session
  */
  public async getSessionAndUser(sessionId: string): Promise<[session: DatabaseSession | null, user: DatabaseUser | null]> {
    let sesh = await this.getSession(sessionId);

    if(!sesh) {return [null, null]}
    let user = await this.getUserFromSessionId(sesh?.userId);
    if(!user) {return [null, null]}
    
    return [sesh, user]
  }

  private async getUserFromSessionId(userId: string): Promise<DatabaseUser | null> {
		const result = await this.connector.query(
			`SELECT * FROM ${this.table_names.user}:${userId};`
			
		);
    
		if (!result[0][0]) return null;
		return transformIntoDatabaseUser(result[0][0]);
	}

  private async getSession(sessionId: string): Promise<DatabaseSession | null> {
    
		const result = await this.connector.query(
			`SELECT * FROM ${this.table_names.session}:${sessionId};`
			
		);
    
		if (!result[0][0]) return null;
    let transofrmed_data = transformIntoDatabaseSession(result[0][0]);
    
		return transofrmed_data;
	}

  public async setSession(databaseSession: DatabaseSession): Promise<void> {

		const value = {
			id: databaseSession.id,
			user_id: databaseSession.userId,
			// expires_at: databaseSession.expiresAt,
			...databaseSession.attributes,
		};

		var entries = Object.entries(value).filter(([_, v]) => v !== undefined);
		var columns = entries.map(([k]) => k);
    var values = entries.map(([_, v]) => escapeName(v));
    function escapeName(val: string): string {
      return "'" + val + "'";
    }
    
    await this.connector.query(`INSERT INTO ${this.table_names.session} (${columns.join(
				", "
			)}) VALUES (${values.join(", ")});`)

    await this.connector.query(`UPDATE ${this.table_names.session}:${value.id} SET expires_at = type::datetime("${databaseSession.expiresAt.toISOString()}")`)
	}

  public async getUserSessions(userId: string): Promise<DatabaseSession[]> {
    
    const result = await this.connector.query(`SELECT * FROM ${this.table_names.session} WHERE user_id = "${userId}";`);
    
    if (!result[0][0]) {return []}
    return result[0].map((val: any) => {
			return transformIntoDatabaseSession(val);
		});
  }

  public async updateSessionExpiration(sessionId: string, expiresAt: Date): Promise<void> {
    await this.connector.query(`UPDATE ${this.table_names.session}:${sessionId} SET expires_at = type::datetime("${expiresAt.toISOString()}");`)
  }
}

function transformIntoDatabaseSession(raw: SessionDoc): DatabaseSession {
  
	const { id, user_id: userId, expires_at: expiresAtResult, ...attributes } = raw;
  let id_without_tablename = sliceTablePrefix(id);

	return {
		userId,
		id: id_without_tablename,
		expiresAt:
			expiresAtResult instanceof Date ? expiresAtResult : new Date(expiresAtResult),
		attributes
	};
}

function transformIntoDatabaseUser(raw: UserDoc): DatabaseUser {
	const { id, ...attributes } = raw;
  let id_without_tablename = sliceTablePrefix(id);

	return {
		id: id_without_tablename,
		attributes
	};
}

function sliceTablePrefix(inputString: string): string {

  const parts = inputString.split(':');

  const result = parts.slice(1).join(':');

  return result;
}