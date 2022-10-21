import { testSessionAdapter, testSessionAdapterErrors } from "@lucia-sveltekit/adapter-test";
import { db, adapter } from "./db.js";

await testSessionAdapter(adapter, db);
await testSessionAdapterErrors(adapter, db);
