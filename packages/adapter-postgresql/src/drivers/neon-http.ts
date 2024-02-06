import { PostgreSQLAdapter } from "../base.js";

import type { Controller, TableNames } from "../base.js";
import type { NeonQueryFunction } from "@neondatabase/serverless";

export class NeonHTTPAdapter extends PostgreSQLAdapter {
	constructor(neon: NeonQueryFunction<false, any>, tableNames: TableNames) {
		super(new NeonHTTPController(neon), tableNames);
	}
}

class NeonHTTPController implements Controller {
	private neon: NeonQueryFunction<false, boolean>;
	constructor(neon: NeonQueryFunction<false, any>) {
		this.neon = neon;
	}

	public async get<T extends {}>(sql: string, args: any[]): Promise<T | null> {
		const result = await this.neon(sql, args);
		if (Array.isArray(result)) {
			return (result.at(0) as T) ?? null;
		}
		return (result.rows.at(0) as T) ?? null;
	}

	public async getAll<T extends {}>(sql: string, args: any[]): Promise<T[]> {
		const result = await this.neon(sql, args);
		if (Array.isArray(result)) {
			return result as T[];
		}
		return result.rows as T[];
	}

	public async execute(sql: string, args: any[]): Promise<void> {
		await this.neon(sql, args);
	}
}
