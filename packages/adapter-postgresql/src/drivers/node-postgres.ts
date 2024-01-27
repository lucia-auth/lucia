import { PostgreSQLAdapter } from "../base.js";

import type { Controller, TableNames } from "../base.js";
import type { Pool, Client } from "pg";

export class NodePostgresAdapter extends PostgreSQLAdapter {
	constructor(client: Client | Pool, tableNames: TableNames) {
		super(new NodePostgresController(client), tableNames);
	}
}

class NodePostgresController implements Controller {
	private client: Client | Pool;
	constructor(client: Client | Pool) {
		this.client = client;
	}

	public async get<T extends {}>(sql: string, args: any[]): Promise<T | null> {
		const { rows } = await this.client.query<T>(sql, args);
		return rows.at(0) ?? null;
	}

	public async getAll<T extends {}>(sql: string, args: any[]): Promise<T[]> {
		const { rows } = await this.client.query<T>(sql, args);
		return rows;
	}

	public async execute(sql: string, args: any[]): Promise<void> {
		await this.client.query(sql, args);
	}
}
