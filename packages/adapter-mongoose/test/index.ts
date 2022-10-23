import { testAdapter } from "@lucia-sveltekit/adapter-test";
import { db, adapter } from "./db.js";

testAdapter(adapter, db);
