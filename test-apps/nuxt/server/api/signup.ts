import { Prisma } from "@prisma/client";
import { LuciaError } from "lucia-auth";

export default defineEventHandler(async (event) => {
	if (event.node.req.method !== "POST") {
		event.node.res.statusCode = 404;
		return sendError(event, new Error())
	}
	const parsedBody = await readBody(event);
	if (!parsedBody || typeof parsedBody !== "object") return;
	const username = parsedBody.username;
	const password = parsedBody.password;
	if (!username || !password) {
		event.node.res.statusCode = 400;
		return {
			error: "Invalid input"
		};
	}
	try {
		const user = await auth.createUser({
			primaryKey: {
				providerId: "username",
				providerUserId: username,
				password
			},
			attributes: {
				username
			}
		});
		const session = await auth.createSession(user.userId);
		const authRequest = auth.handleRequest(event);
		authRequest.setSession(session);
		return send(event, null)
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2002" &&
			error.message?.includes("username")
		) {
			event.node.res.statusCode = 400;
			return {
				error: "Username unavailable"
			};
		}
		if (
			error instanceof LuciaError &&
			error.message === "AUTH_DUPLICATE_KEY_ID"
		) {
			event.node.res.statusCode = 400;
			return {
				error: "Username unavailable"
			};
		}
		// database connection error
		console.log(error);
		event.node.res.statusCode = 500;
		return sendError(event, new Error());
		return {
			error: "An unknown error occurred"
		};
	}
});
