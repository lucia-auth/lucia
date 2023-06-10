import { generateRandomString } from "lucia/utils";
import type { KeySchema, SessionSchema, UserSchema } from "lucia";

export type TestUserSchema = UserSchema & {
	username: string;
};

export type TestSessionSchema = SessionSchema & {
	country: string;
};

export type TableQueryHandler<
	Schema extends {
		id: string;
	} = any
> = {
	get: () => Promise<Schema[]>;
	insert: (data: Schema) => Promise<void>;
	clear: () => Promise<void>;
};

export type QueryHandler = {
	user?: TableQueryHandler<TestUserSchema>;
	session?: TableQueryHandler<SessionSchema>;
	key?: TableQueryHandler<KeySchema>;
};

export class Database {
	private readonly queryHandler: QueryHandler;

	constructor(queryHandler: QueryHandler) {
		this.queryHandler = queryHandler;
	}

	public user = () => {
		const userQueryHandler = this.queryHandler["user"];
		if (!userQueryHandler) {
			throw new Error("No query handler provided for 'user'");
		}
		return new Table<TestUserSchema>(userQueryHandler);
	};

	public session = () => {
		const sessionQueryHandler = this.queryHandler["session"];
		if (!sessionQueryHandler) {
			throw new Error("No query handler provided for 'session'");
		}
		return new Table<TestSessionSchema>(sessionQueryHandler);
	};

	public key = () => {
		const keyQueryHandler = this.queryHandler["key"];
		if (!keyQueryHandler) {
			throw new Error("No query handler provided for 'key'");
		}
		return new Table<KeySchema>(keyQueryHandler);
	};

	public generateUser = (options?: {
		userId?: string;
		username?: string;
	}): TestUserSchema => {
		const userId = options?.userId ?? generateRandomString(8);
		const username = options?.username ?? generateRandomString(4);
		return {
			id: userId,
			username
		};
	};
	public generateSession = (
		userId: string | null,
		options?: {
			id?: string;
			country?: string;
		}
	): TestSessionSchema => {
		const activeExpires = new Date().getTime() + 1000 * 60 * 60 * 8;
		return {
			user_id: userId ?? generateRandomString(8),
			id: options?.id ?? `at_${generateRandomString(40)}`,
			active_expires: activeExpires,
			idle_expires: activeExpires + 1000 * 60 * 60 * 24,
			country: options?.country ?? "XX"
		};
	};

	public generateKey = (
		userId: string | null,
		options?: {
			id?: string;
		}
	): KeySchema => {
		const keyUserId = userId ?? generateRandomString(8);
		return {
			id: options?.id ?? generateRandomString(30),
			user_id: keyUserId,
			hashed_password: null
		};
	};

	public clear = async () => {
		await this.queryHandler.key?.clear();
		await this.queryHandler.session?.clear();
		await this.queryHandler.user?.clear();
	};
}

class Table<_Schema extends { id: string }> {
	protected readonly queryHandler: TableQueryHandler<_Schema>;
	constructor(queryHandler: TableQueryHandler<_Schema>) {
		this.queryHandler = queryHandler;
	}
	public insert = async (...values: _Schema[]) => {
		for (const value of values) {
			await this.queryHandler.insert(value);
		}
	};
	public get = async (id: string) => {
		const result = await this.queryHandler.get();
		return result.find((val) => val.id === id) ?? null;
	};
	public getAll = async () => {
		return await this.queryHandler.get();
	};
}
