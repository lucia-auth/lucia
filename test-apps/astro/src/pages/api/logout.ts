import { handleSignOut } from "@lucia-auth/astro";
import { auth } from "../../lib/lucia";
import type { APIRoute } from "astro";

export const post: APIRoute = handleSignOut(auth);
