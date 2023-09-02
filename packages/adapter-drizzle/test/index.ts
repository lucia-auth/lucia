import { testAdapter, Database } from "@lucia-auth/adapter-test";
import type { QueryHandler, TableQueryHandler } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia";

import { drizzle } from "drizzle-orm/aws-data-api/pg";

import { drizzleAdapter } from "../src/drizzle";

const adapter = drizzleAdapter();

await testAdapter(adapter, new Database());

process.exit(0);
