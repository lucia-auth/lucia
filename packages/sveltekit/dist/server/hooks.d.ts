import type { Auth } from "lucia-auth";
import type { RequestEvent } from "../types.js";
export declare const getRequestHandler: (event: RequestEvent) => ((event: RequestEvent, auth: Auth<any>) => Promise<Response>) | null;
export declare const handleHooks: (auth: Auth) => ({ event, resolve }: {
    event: RequestEvent;
    resolve: (event: RequestEvent, options?: {
        transformPageChunk: (data: {
            html: string;
        }) => string;
    } | undefined) => Promise<Response>;
}) => Promise<Response>;
