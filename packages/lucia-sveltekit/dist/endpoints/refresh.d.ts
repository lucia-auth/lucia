import { Adapter } from "../types.js";
import { RequestEvent } from "@sveltejs/kit";
export declare const handleRefreshRequest: (event: RequestEvent, adapter: Adapter, options: {
    secret: string;
}) => Promise<Response>;
