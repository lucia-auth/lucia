import type { Session } from "lucia-auth";
export { handleServerSession } from "./server/server-load.js";
export { handleHooks } from "./server/hooks.js";
export declare type GetSession = () => Session | null;
export declare type SetSession = (session: Session) => void;
export declare type ClearSession = () => void;
