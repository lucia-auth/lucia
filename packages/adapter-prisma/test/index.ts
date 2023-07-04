import { testAdapter } from "@lucia-auth/adapter-test";
import { db, adapter } from "./db.js";

testAdapter(adapter, db);
