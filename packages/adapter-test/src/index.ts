import { SessionSchema, UserSchema } from "lucia-sveltekit/types";
export { testAdapter } from "./tests/index.js";
export { testAdapterErrors } from "./tests/error.js";
export { testAdapterUserIdGeneration } from "./tests/userid/index.js";
export { testSessionAdapter } from "./tests/session/index.js";
export { testSessionAdapterErrors } from "./tests/session/error.js";
export { testUserAdapter } from "./tests/user/index.js";
export { testUserAdapterErrors } from "./tests/user/error.js";

export interface Database {
    getSessions: () => Promise<SessionSchema[]>;
    getUsers: () => Promise<UserSchema[]>;
    clearUsers: () => Promise<void>;
    clearSessions: () => Promise<void>;
    insertUser: (data: UserSchema) => Promise<void>;
    insertSession: (data: SessionSchema) => Promise<void>;
}
