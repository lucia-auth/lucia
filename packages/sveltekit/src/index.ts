import type { Session } from "lucia-auth";

export { handleServerSession } from "./server/server-load.js";
export { handleHooks } from "./server/hooks.js";

export type GetSession = () => Session | null;
export type SetSession = (session: Session) => void;
export type ClearSession = () => void;