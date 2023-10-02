import { testAdapter, Database } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia";
import type { QueryHandler, TableQueryHandler } from "@lucia-auth/adapter-test";
import { DataSource, EntityTarget, IsNull, Not, ObjectLiteral } from "typeorm";

import { Key, Session, User } from "../typeorm/schema";
import {
	transformTypeORMKey,
	transformTypeORMSession,
	typeormAdapter
} from "../src/typeorm.js";
import dataSource from "./db";

const createTableQueryHandler = (
	dataSource: DataSource,
	repo: EntityTarget<ObjectLiteral>
): TableQueryHandler => {
	return {
		get: async () => {
			const result = await dataSource.getRepository(repo).find();
			return result.map((item) => item.toJSON());
		},
		insert: async (value: any) => {
			const entity = dataSource.getRepository(repo).create(value);
			await dataSource.getRepository(repo).save(entity);
		},
		clear: async () => {
			await dataSource.getRepository(repo).delete({ id: Not(IsNull()) });
		}
	};
};

const queryHandler: QueryHandler = {
	user: createTableQueryHandler(dataSource, User),
	session: {
		...createTableQueryHandler(dataSource, Session),
		get: async () => {
			const result = await dataSource.getRepository(Session).find();
			return result.map((val) => transformTypeORMSession(val));
		}
	},
	key: {
		...createTableQueryHandler(dataSource, Key),
		get: async () => {
			const result = await dataSource.getRepository(Key).find();
			return result.map((val) => transformTypeORMKey(val));
		}
	}
};

const adapter = typeormAdapter(dataSource, {
	user: User,
	key: Key,
	session: Session
})(LuciaError);

await dataSource
	.initialize()
	.then(async () => {
		console.log("Data Source has been initialized");
	})
	.catch(() => console.error("Error during data source init."));

await testAdapter(adapter, new Database(queryHandler));

process.exit(0);
