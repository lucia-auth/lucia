import { handleLogoutRequests } from "@lucia-auth/astro";
import { auth } from "../../lib/lucia";
import type { APIRoute } from "astro";

export const post: APIRoute = handleLogoutRequests(auth);
