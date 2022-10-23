import { SessionSchema, UserSchema } from "lucia-sveltekit/types";
export { testAdapter } from "./tests/index.js";
export { testAdapterUserIdGeneration } from "./tests/user-id.js";
export { testSessionAdapter } from "./tests/session.js";
export { testUserAdapter } from "./tests/user.js";


export interface Database {
    getSessions: () => Promise<SessionSchema[]>;
    getUsers: () => Promise<UserSchema[]>;
    clearUsers: () => Promise<void>;
    clearSessions: () => Promise<void>;
    insertUser: (data: UserSchema) => Promise<void>;
    insertSession: (data: SessionSchema) => Promise<void>;
}
