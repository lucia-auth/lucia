import { type Auth } from "lucia-auth";
import type { RequestEvent } from "../../types.js";
export declare const handleLogoutRequest: (event: RequestEvent, auth: Auth) => Promise<Response>;
