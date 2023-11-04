import { SQLiteAdapter } from "../base.js";

import type { Controller, TableNames } from "../base.js";
import type { Database } from "better-sqlite3";

export class BetterSQLite3Adapter extends SQLiteAdapter {
	constructor(db: Database, tableNames: TableNames) {
		super(new BetterSQLite3Controller(db), tableNames);
	}
}

class BetterSQLite3Controller implements Controller {
	private db: Database;
	constructor(db: Database) {
		this.db = db;
	}

	public async get<T>(sql: string, args: any[]): Promise<T | null> {
		return this.db.prepare(sql).get(...args);
	}

	public async getAll<T>(sql: string, args: any[]): Promise<T[]> {
		return this.db.prepare(sql).all(...args);
	}

	public async execute(sql: string, args: any[]): Promise<void> {
		await this.db.prepare(sql).run(...args);
	}
}
