import { SQLiteAdapter } from "../base.js";

import type { Controller, TableNames } from "../base.js";
import type { D1Database as WorkerD1Database } from "@cloudflare/workers-types";
import type { D1Database as MiniflareD1Database } from "@miniflare/d1";

type D1Database = WorkerD1Database | MiniflareD1Database;

export class D1Adapter extends SQLiteAdapter {
	constructor(db: D1Database, tableNames: TableNames) {
		super(new D1Controller(db), tableNames);
	}
}

class D1Controller implements Controller {
	private db: D1Database;
	constructor(db: D1Database) {
		this.db = db;
	}

	public async get<T>(sql: string, args: any[]): Promise<T | null> {
		return await this.db
			.prepare(sql)
			.bind(...args)
			.first<T | null>();
	}

	public async getAll<T>(sql: string, args: any[]): Promise<T[]> {
		const result = await this.db
			.prepare(sql)
			.bind(...args)
			.all<T>();
		return result.results ?? [];
	}

	public async execute(sql: string, args: any[]): Promise<void> {
		await this.db
			.prepare(sql)
			.bind(...args)
			.run();
	}
}
