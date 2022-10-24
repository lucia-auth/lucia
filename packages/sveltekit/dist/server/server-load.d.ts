import type { User, Auth } from "lucia-auth";
import type { RequestEvent } from "../types.js";
declare type HandleServerSession = <A extends Auth, LoadFn extends (event: RequestEvent) => any = () => Promise<any>>(auth: A, serverLoad?: LoadFn) => (event: RequestEvent) => Promise<Exclude<Awaited<ReturnType<LoadFn>>, void> & {
    _lucia: User;
}>;
export declare const handleServerSession: HandleServerSession;
export {};
