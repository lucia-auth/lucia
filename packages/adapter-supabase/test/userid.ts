import { userIdTest } from "@lucia-sveltekit/adapter-test";
import { db, supabaseAdapterClient } from "./index.js";

userIdTest(supabaseAdapterClient, db);
