import type { RequestHandler } from "@builder.io/qwik-city";

import { auth } from "~/auth/lucia";

export const onGet: RequestHandler = async (event) => {
	const authRequest = auth.handleRequest(event);
	const session = await authRequest.validate();
	if (session) throw event.redirect(302, "/");
};
