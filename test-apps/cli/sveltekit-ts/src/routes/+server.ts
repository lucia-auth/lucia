import { auth } from "$lib/server/lucia";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async () => {
	const user = await auth.getUser("a950fe31-6969-4d68-827c-fa467cefd2bf");
	return new Response(JSON.stringify(user));
};
