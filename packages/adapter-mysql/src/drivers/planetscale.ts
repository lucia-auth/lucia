import { MySQLAdapter } from "./base.js";

import type { Controller, TableNames } from "./base.js";
import type { Client, Connection } from "@planetscale/database";

type PlanetScaleClient = Client | Connection;

export class PlanetScaleAdapter extends MySQLAdapter {
	constructor(client: PlanetScaleClient, tableNames: TableNames) {
		super(new PlanetScaleController(client), tableNames);
	}
}

class PlanetScaleController implements Controller {
	private client: PlanetScaleClient;
	constructor(client: PlanetScaleClient) {
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
