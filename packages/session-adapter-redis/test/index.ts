import { testSessionAdapter } from "@lucia-auth/adapter-test";
import { db, adapter } from "./db.js";

testSessionAdapter(adapter, db);
