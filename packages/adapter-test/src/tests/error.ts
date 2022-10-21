import type { Adapter } from "lucia-sveltekit/adapter";
import { end } from "./../test.js";
import { Database } from "../index.js";
import { testUserAdapterErrors } from "./user/error.js";
import { testSessionAdapterErrors } from "./session/error.js";

const INVALID_INPUT = "INVALID_INPUT";

export const testAdapterErrors = async (adapter: Adapter, db: Database, endProcess = true) => {
    await testUserAdapterErrors(adapter, db)
    await testSessionAdapterErrors(adapter, db)
    if (!endProcess) return
    end();
};
