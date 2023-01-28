import { KeySchema, SessionSchema } from "lucia-auth";
import { UserSchemaWithAttributes } from "./types.js";
export { testAdapter } from "./tests/index.js";
export { testAdapterUserIdGeneration } from "./tests/user-id.js";
export { testSessionAdapter } from "./tests/session.js";
export { testUserAdapter } from "./tests/user.js";


export interface Database {
	getSessions: () => Promise<SessionSchema[]>;
	getUsers: () => Promise<UserSchemaWithAttributes[]>;
	clearUsers: () => Promise<void>;
	clearSessions: () => Promise<void>;
	insertUser: (data: UserSchemaWithAttributes) => Promise<void>;
	insertSession: (data: SessionSchema) => Promise<void>;
	getKeys: () => Promise<KeySchema[]>
	insertKey: (data: KeySchema) => Promise<void>
	clearKeys:() => Promise<void>
}
