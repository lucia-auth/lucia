import { RefreshTokenRow, SessionRow, UserRow } from "./types.js";
export { testAdapter as coreTest } from "./tests/main.js";
export { testAdapter as userIdTest } from "./tests/userid.js";

export interface Database {
    getRefreshTokens: () => Promise<RefreshTokenRow[]>;
    getSessions: () => Promise<SessionRow[]>;
    getUsers: () => Promise<UserRow[]>;
    clearRefreshTokens: () => Promise<void>;
    clearUsers: () => Promise<void>;
    clearSessions: () => Promise<void>;
    insertRefreshToken: (data: RefreshTokenRow) => Promise<void>;
    insertUser: (data: UserRow) => Promise<void>;
    insertSession: (data: SessionRow) => Promise<void>;
}
