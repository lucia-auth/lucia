import { MySQLAdapter } from "./base.js";

import type { Controller, TableNames } from "./base.js";
import type { Client } from "@planetscale/database";

export class PlanetScaleAdapter extends MySQLAdapter {
	constructor(client: Client, tableNames: TableNames) {
		super(new PlanetScaleController(client), tableNames);
	}
}

class PlanetScaleController implements Controller {
	private client: Client;
	constructor(client: Client) {
		this.client = client;
	}

	public async get<T>(sql: string, args: any[]): Promise<T | null> {
		const { rows } = await this.client.execute(sql, args);
		return (rows as T[]).at(0) ?? null;
	}

	public async getAll<T>(sql: string, args: any[]): Promise<T[]> {
		const { rows } = await this.client.execute(sql, args);
		return rows as T[];
	}

	public async execute(sql: string, args: any[]): Promise<void> {
		await this.client.execute(sql, args);
	}
}
