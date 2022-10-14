import { userIdTest } from "@lucia-sveltekit/adapter-test";
import { db, adapter } from "./index.js";

userIdTest(adapter, db);
