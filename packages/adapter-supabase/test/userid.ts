import { testAdapterUserIdGeneration } from "@lucia-sveltekit/adapter-test";
import { db, adapter } from "./db.js";

testAdapterUserIdGeneration(adapter, db);
