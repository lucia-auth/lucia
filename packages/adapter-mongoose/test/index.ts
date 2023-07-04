import { testAdapter } from "@lucia-auth/adapter-test";
import { queryHandler, adapter } from "./db.js";

testAdapter(adapter, queryHandler);
