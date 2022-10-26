import { testAdapterUserIdGeneration } from "@lucia-auth/adapter-test";
import { db, adapter } from "./db.js";

testAdapterUserIdGeneration(adapter, db);
