import { testAdapter, testAdapterErrors } from "@lucia-sveltekit/adapter-test";
import { db, adapter } from "./db.js";

await testAdapter(adapter, db);
await testAdapterErrors(adapter, db);
