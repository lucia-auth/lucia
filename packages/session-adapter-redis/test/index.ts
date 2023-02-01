import { testSessionAdapter } from "@lucia-auth/adapter-test";
import { queryHandler, adapter } from "./db.js";

testSessionAdapter(adapter, queryHandler);
