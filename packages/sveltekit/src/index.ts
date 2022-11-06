import type { RequestEvent } from "./types.js";

export { handleServerSession } from "./server/server-load.js";
export { handleHooks } from "./server/hooks.js";

export type GetSession = RequestEvent["locals"]["getSession"];
export type GetSessionUser = RequestEvent["locals"]["getSessionUser"];
export type SetSession = RequestEvent["locals"]["setSession"];