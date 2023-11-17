import { SQLiteAdapter } from "../base.js";

import type { Controller, TableNames } from "../base.js";

export class BunSQLiteAdapter extends SQLiteAdapter {
	constructor(db: Database, tableNames: TableNames) {
		super(new BunSQLiteController(db), tableNames);
	}
}

class BunSQLiteController implements Controller {
	private db: Database;
	constructor(db: Database) {
		this.db = db;
	}

	public async get<T>(sql: string, args: any[]): Promise<T | null> {
		return this.db.prepare(sql).get(...args) as T;
	}

	public async getAll<T>(sql: string, args: any[]): Promise<T[]> {
		return this.db.prepare(sql).all(...args) as T[];
	}

	public async execute(sql: string, args: any[]): Promise<void> {
		this.db.prepare(sql).run(...args);
	}
}

// not using `bun-types` since it collides with `@types/node`
interface Database {
	prepare(sql: string): Statement;
}

interface Statement {
	get(...args: any[]): unknown;
	all(...args: any[]): unknown;
	run(...args: any[]): unknown;
}
