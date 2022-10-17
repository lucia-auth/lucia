import { SessionSchema, UserSchema } from "lucia-sveltekit/adapter";
export { testAdapter as coreTest } from "./tests/main.js";
export { testAdapter as userIdTest } from "./tests/userid.js";

export interface Database {
    getSessions: () => Promise<SessionSchema[]>;
    getUsers: () => Promise<UserSchema[]>;
    clearUsers: () => Promise<void>;
    clearSessions: () => Promise<void>;
    insertUser: (data: UserSchema) => Promise<void>;
    insertSession: (data: SessionSchema) => Promise<void>;
}
