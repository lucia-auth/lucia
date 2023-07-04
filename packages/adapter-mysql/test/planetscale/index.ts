import { testAdapter } from "@lucia-auth/adapter-test";
import { adapter, queryHandler } from "./db.js";

testAdapter(adapter, queryHandler);
