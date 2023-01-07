import type { RequestEvent } from "./types.js";

export { handleServerSession } from "./server/server-load.js";
export { handleHooks } from "./server/hooks.js";

export type Validate = RequestEvent["locals"]["validate"];
export type ValidateUser = RequestEvent["locals"]["validateUser"];
export type SetSession = RequestEvent["locals"]["setSession"];
