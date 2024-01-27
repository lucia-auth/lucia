import { MySQLAdapter } from "../base.js";

import type { Controller, TableNames } from "../base.js";
import type { Connection } from "@planetscale/database";

export class PlanetScaleAdapter extends MySQLAdapter {
	constructor(connection: Connection, tableNames: TableNames) {
		super(new PlanetScaleController(connection), tableNames);
	}
}

class PlanetScaleController implements Controller {
	private connection: Connection;
	constructor(connection: Connection) {
		this.connection = connection;
	}

	public async get<T>(sql: string, args: any[]): Promise<T | null> {
		const { rows } = await this.connection.execute(sql, args);
		return (rows as T[]).at(0) ?? null;
	}

	public async getAll<T>(sql: string, args: any[]): Promise<T[]> {
		const { rows } = await this.connection.execute(sql, args);
		return rows as T[];
	}

	public async execute(sql: string, args: any[]): Promise<void> {
		await this.connection.execute(sql, args);
	}
}
