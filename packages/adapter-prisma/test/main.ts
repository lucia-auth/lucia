import { coreTest } from "@lucia-sveltekit/adapter-test";
import { db, adapter } from "./index.js";

coreTest(adapter, db);
