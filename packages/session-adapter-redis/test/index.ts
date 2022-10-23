import { testSessionAdapter } from "@lucia-sveltekit/adapter-test";
import { db, adapter } from "./db.js";

testSessionAdapter(adapter, db);
