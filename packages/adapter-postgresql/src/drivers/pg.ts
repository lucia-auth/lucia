import { PostgreSQLAdapter } from "../base.js";

import type { Controller, TableNames } from "../base.js";
import type { Pool } from "pg";

export class NodePostgresAdapter extends PostgreSQLAdapter {
	constructor(pool: Pool, tableNames: TableNames) {
		super(new NodePostgresController(pool), tableNames);
	}
}

class NodePostgresController implements Controller {
	private pool: Pool;
	constructor(pool: Pool) {
		this.pool = pool;
	}

	public async get<T extends {}>(sql: string, args: any[]): Promise<T | null> {
		const { rows } = await this.pool.query<T>(sql, args);
		return rows.at(0) ?? null;
	}

	public async getAll<T extends {}>(sql: string, args: any[]): Promise<T[]> {
		const { rows } = await this.pool.query<T>(sql, args);
		return rows;
	}

	public async execute(sql: string, args: any[]): Promise<void> {
		await this.pool.query(sql, args);
	}
}
