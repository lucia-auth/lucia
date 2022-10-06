import { coreTest } from "@lucia-sveltekit/adapter-test";
import { db, supabaseAdapterClient } from "./index.js";

coreTest(supabaseAdapterClient, db);
