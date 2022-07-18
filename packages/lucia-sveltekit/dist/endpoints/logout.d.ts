import { RequestEvent } from "@sveltejs/kit";
import { Adapter } from "../types.js";
export declare const handleLogoutRequest: (event: RequestEvent, adapter: Adapter) => Promise<Response>;
