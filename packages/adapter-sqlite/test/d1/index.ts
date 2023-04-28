import { testAdapter } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia-auth";
import { d1 as d1Adapter } from "../../src/index.js";
import { d1Runner } from "../../src/d1/runner.js";
import { createQueryHandler } from "../index.js";
import { D1Database } from "@cloudflare/workers-types";

type Env = {
	DB: D1Database;
};

export default {
	fetch: async (_: Request, env: Env) => {
		const adapter = d1Adapter(env.DB)(LuciaError);
		const queryHandler = createQueryHandler(d1Runner(env.DB));
		await testAdapter(adapter, queryHandler, false);
		return new Response("Test successful");
	}
};
