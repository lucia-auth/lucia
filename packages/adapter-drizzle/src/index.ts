import { AdapterFunction, Adapter } from "lucia-auth";
import { Dbs, DrizzleAdapterOptions } from "./types";
import { mysqlAdapter } from "./mysql";
import { pgAdapter } from "./pg";
import { sqliteAdapter } from "./sqlite";

const adapter = <T extends Dbs>(
	args: DrizzleAdapterOptions<T>
): AdapterFunction<Adapter> => {
	switch (args.type) {
		case "mysql": {
			return mysqlAdapter(args as DrizzleAdapterOptions<"mysql">);
		}
		case "pg": {
			return pgAdapter(args as DrizzleAdapterOptions<"pg">);
		}
		case "sqlite": {
			return sqliteAdapter(args as DrizzleAdapterOptions<"sqlite">);
		}
		default:
			throw new Error("Invalid database type");
	}
};

export default adapter;
