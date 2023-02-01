import { KeySchema, SessionSchema, generateRandomString } from "lucia-auth";
import { typeError, valueError } from "./validate.js";
import { TestUserSchema } from "./type.js";

type QueryHandler<Schema> = {
	get: () => Promise<Schema[]>;
	insert: (data: Schema) => Promise<void>;
	clear: () => Promise<void>;
};

export type LuciaQueryHandler = {
	user: QueryHandler<TestUserSchema>;
	session: QueryHandler<SessionSchema>;
	key: QueryHandler<KeySchema>;
};

export class Database {
	private readonly queryHandler: LuciaQueryHandler;
	public user = () => {
		return new User(this.queryHandler);
	};
	public clear = async () => {
		await this.queryHandler.key.clear();
		await this.queryHandler.session.clear();
		await this.queryHandler.user.clear();
	};
	constructor(queryHandler: LuciaQueryHandler) {
		this.queryHandler = queryHandler;
	}
}

type ExtractQueryHandlerSchema<Q> = Q extends QueryHandler<infer Schema>
	? Schema
	: never;

class Model<StoreName extends Extract<keyof LuciaQueryHandler, string>> {
	public value: ExtractQueryHandlerSchema<LuciaQueryHandler[StoreName]>;
	protected readonly name: string;
	protected readonly queryHandler: LuciaQueryHandler;
	private storeQueryHandler: LuciaQueryHandler[StoreName];
	private readonly parent: Model<any>[];
	constructor(
		name: StoreName,
		queryHandler: LuciaQueryHandler,
		value: ExtractQueryHandlerSchema<LuciaQueryHandler[StoreName]>,
		parent: Model<any>[] = []
	) {
		this.name = name;
		this.value = value;
		this.queryHandler = queryHandler;
		this.storeQueryHandler = queryHandler[name];
		this.parent = parent;
	}
	public set = async () => {
		for (const parentModel of this.parent) {
			await parentModel.set();
		}
		await this.storeQueryHandler.insert(this.value as any);
	};
	private safeCompare = (target: unknown) => {
		if (typeof target !== "object" || target === null)
			throw typeError(target, "object");
		for (const [refKey, refValue] of Object.entries(this.value) as [any, any]) {
			if (target[refKey as keyof Object] !== refValue) {
				return false;
			}
		}
		return true;
	};
	public compare = (target: unknown) => {
		const isEqual = this.safeCompare(target);
		if (isEqual) return;
		throw valueError(target, this.value, "Target was not the expected value");
	};
	public find = (target: unknown) => {
		if (!Array.isArray(target)) {
			throw typeError(target, "array");
		}
		for (const value of target) {
			const isEqual = this.safeCompare(value);
			if (isEqual) return;
		}
		throw valueError(
			target,
			this.value,
			"Target did not include the expected value"
		);
	};
	public exists = async () => {
		const databaseData = await this.storeQueryHandler.get();
		const existsInDatabase = databaseData.some(this.safeCompare);
		if (existsInDatabase) return;
		console.log("target:");
		console.dir(this.value, {
			depth: null
		});
		console.log("store");
		console.dir(databaseData, {
			depth: null
		});
		throw new Error(`Target not found in store ${this.name}`);
	};
	public notExits = async () => {
		const databaseData = await this.storeQueryHandler.get();
		const existsInDatabase = databaseData.some(this.safeCompare);
		if (!existsInDatabase) return;
		console.log("target:");
		console.dir(this.value, {
			depth: null
		});
		console.log("store");
		console.dir(databaseData, {
			depth: null
		});
		throw new Error(`Target found in store ${this.name}`);
	};
	public update = (
		value: Partial<ExtractQueryHandlerSchema<LuciaQueryHandler[StoreName]>>
	) => {
		this.value = { ...this.value, ...value };
	};
}

class User extends Model<"user"> {
	public session = () => {
		return new Session(this.queryHandler, [this], {
			userId: this.value.id
		});
	};
	public key = (option: { isPrimary: boolean; hasPassword: boolean }) => {
		return new Key(this.queryHandler, [this], {
			userId: this.value.id,
			...option
		});
	};
	constructor(
		queryHandler: LuciaQueryHandler,
		options?: {
			userId?: string;
			username?: string;
		}
	) {
		const userId = options?.userId ?? generateRandomString(8);
		const username = options?.username ?? `user_${generateRandomString(4)}`;
		super("user", queryHandler, {
			id: userId,
			username
		});
	}
}

class Session extends Model<"session"> {
	constructor(
		queryHandler: LuciaQueryHandler,
		parent: Model<any>[],
		options: {
			userId: string;
		}
	) {
		const activeExpires = new Date().getTime() + 1000 * 60 * 60 * 8;
		super(
			"session",
			queryHandler,
			{
				user_id: options.userId,
				id: `at_${generateRandomString(40)}`,
				active_expires: activeExpires,
				idle_expires: activeExpires + 1000 * 60 * 60 * 24
			},
			parent
		);
	}
}

class Key extends Model<"key"> {
	constructor(
		queryHandler: LuciaQueryHandler,
		parent: Model<any>[],
		options: {
			userId: string;
			isPrimary: boolean;
			hasPassword: boolean;
		}
	) {
		super(
			"key",
			queryHandler,
			{
				id: `test:${options.userId}@example.com`,
				user_id: options.userId,
				primary: options.isPrimary,
				hashed_password: options.hasPassword ? "HASHED" : null
			},
			parent
		);
	}
}
