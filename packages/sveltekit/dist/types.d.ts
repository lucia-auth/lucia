import type { Session, User } from "lucia-auth";
import type { Readable } from "svelte/store";
export declare type LuciaContext = {
    user: Readable<User | null>;
};
export declare type RequestEvent = {
    request: Request;
    locals: {
        getSession: () => Session | null;
        setSession: (session: Session) => void;
        clearSession: () => void;
    };
    url: URL;
    cookies: {
        get: (name: string) => string | undefined;
        set: (name: string, value: string, options: any) => void;
    };
};
export declare type GlobalWindow = Window & {
    _lucia?: User | null;
    _luciaPageData?: {
        data: any;
    }[];
};
