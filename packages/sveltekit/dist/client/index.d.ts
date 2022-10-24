import type { User } from "lucia-auth";
import { type Readable } from "svelte/store";
export declare const signOut: (redirect?: string) => Promise<void>;
declare type ClientUser = Readonly<User> | null;
export declare const getUser: () => Readable<ClientUser>;
export declare const lucia: (pageStore: Readable<{
    data: Record<string, any>;
}>) => void;
export {};
