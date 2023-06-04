import { generateRandomString } from "lucia";
import type { KeySchema, SessionSchema, UserSchema } from "lucia";

export type TestUserSchema = UserSchema & {
	username: string;
};

export type TestSessionSchema = SessionSchema & {
	country: string;
};

type QueryHandler<
	Schema extends {
		id: string;
	}
> = {
	get: () => Promise<Schema[]>;
	insert: (data: Schema) => Promise<void>;
	clear: () => Promise<void>;
};

export type LuciaQueryHandler = {
	user?: QueryHandler<TestUserSchema>;
	session?: QueryHandler<SessionSchema>;
	key?: QueryHandler<KeySchema>;
};

export class Database {
	private readonly luciaQueryHandler: LuciaQueryHandler;
	public user = () => {
		const queryHandler = this.luciaQueryHandler["user"];
		if (!queryHandler) throw new Error("No query handler provided for 'user'");
		return new Table<TestUserSchema>(queryHandler);
	};
	public session = () => {
		const queryHandler = this.luciaQueryHandler["session"];
		if (!queryHandler) {
			throw new Error("No query handler provided for 'session'");
		}
		return new Table<TestSessionSchema>(queryHandler);
	};
	public key = () => {
		const queryHandler = this.luciaQueryHandler["key"];
		if (!queryHandler) throw new Error("No query handler provided for 'key'");
		return new Table<KeySchema>(queryHandler);
	};

	public generateUser = (options?: {
		userId?: string;
		username?: string;
	}): TestUserSchema => {
		const userId = options?.userId ?? generateRandomString(8);
		const username = options?.username ?? "X";
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
			id: options?.id ?? `test:${keyUserId}@example.com`,
			user_id: keyUserId,
			hashed_password: null
		};
	};
	public clear = async () => {
		await this.luciaQueryHandler.key?.clear();
		await this.luciaQueryHandler.session?.clear();
		await this.luciaQueryHandler.user?.clear();
	};
	constructor(queryHandler: LuciaQueryHandler) {
		this.luciaQueryHandler = queryHandler;
	}
}

class Table<_Schema extends { id: string }> {
	protected readonly queryHandler: QueryHandler<_Schema>;
	constructor(queryHandler: QueryHandler<_Schema>) {
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
