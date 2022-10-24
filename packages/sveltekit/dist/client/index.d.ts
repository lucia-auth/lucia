import type { User } from "lucia-auth";
import { type Readable } from "svelte/store";
export declare const signOut: (redirect?: string) => Promise<void>;
export declare const getUser: () => Readable<User | null>;
export declare const lucia: (pageStore: Readable<{
    data: Record<string, any>;
}>) => void;
