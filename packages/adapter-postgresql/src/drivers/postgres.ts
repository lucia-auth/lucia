import { PostgreSQLAdapter } from "../base.js";

import type { Controller, TableNames } from "../base.js";
import type { Sql } from "postgres";

export class PostgresAdapter extends PostgreSQLAdapter {
	constructor(sql: Sql, tableNames: TableNames) {
		super(new PostgresController(sql), tableNames);
	}
}

class PostgresController implements Controller {
	private sql: Sql;
	constructor(sql: Sql) {
		this.sql = sql;
	}

	public async get<T extends {}>(sql: string, args: any[]): Promise<T | null> {
		const result: T[] = await this.sql.unsafe(sql, args);
		return result.at(0) ?? null;
	}

	public async getAll<T extends {}>(sql: string, args: any[]): Promise<T[]> {
		const result: T[] = await this.sql.unsafe(sql, args);
		return result;
	}

	public async execute(sql: string, args: any[]): Promise<void> {
		await this.sql.unsafe(sql, args);
	}
}
