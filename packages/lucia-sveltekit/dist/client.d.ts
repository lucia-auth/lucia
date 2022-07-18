import { LuciaError } from "./utils/error.js";
import { Writable } from "svelte/store";
export declare const signOut: () => Promise<{
    error: null;
}>;
export declare const autoRefreshAccessToken: (session: Writable<App.Session>, onError: (error: LuciaError) => void) => () => void;
