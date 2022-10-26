import type { User } from "lucia-auth";
import { type Readable } from "svelte/store";
export declare const signOut: () => Promise<void>;
declare type ClientUser = Readonly<User> | null;
export declare const getUser: () => Readable<ClientUser>;
export declare const handleSession: (pageStore: Readable<{
    data: Record<string, any>;
}>) => void;
export {};
