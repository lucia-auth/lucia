import { testSessionAdapter } from "@lucia-auth/adapter-test";
import { adapter, queryHandler } from "./db";

testSessionAdapter(adapter, queryHandler);
