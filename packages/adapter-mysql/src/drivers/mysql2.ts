import { MySQLAdapter } from "../base.js";

import type { Controller, TableNames } from "../base.js";
import type { Pool, Connection } from "mysql2/promise";

export class Mysql2Adapter extends MySQLAdapter {
	constructor(connection: Pool | Connection, tableNames: TableNames) {
		super(new Mysql2Controller(connection), tableNames);
	}
}

class Mysql2Controller implements Controller {
	private connection: Pool | Connection;
	constructor(connection: Pool | Connection) {
		this.connection = connection;
	}

	public async get<T>(sql: string, args: any[]): Promise<T | null> {
		const [rows] = await this.connection.query(sql, args);
		return (rows as T[]).at(0) ?? null;
	}

	public async getAll<T>(sql: string, args: any[]): Promise<T[]> {
		const [rows] = await this.connection.query(sql, args);
		return rows as T[];
	}

	public async execute(sql: string, args: any[]): Promise<void> {
		await this.connection.execute(sql, args);
	}
}
