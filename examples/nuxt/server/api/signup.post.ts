import { Prisma } from "@prisma/client";
import { LuciaError } from "lucia-auth";

export default defineEventHandler(async (event) => {
    const { username, password } = (await readBody(event)) ?? {};
    if (!username || !password) {
        return {
            error: "Invalid input",
        };
    }
    try {
        const user = await auth.createUser({
            primaryKey: {
                providerId: "username",
                providerUserId: username,
                password,
            },
            attributes: {
                username,
            },
        });
        const session = await auth.createSession(user.userId);
        const authRequest = auth.handleRequest(event);
        authRequest.setSession(session);
        return null;
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002" &&
            error.message?.includes("username")
        ) {
            return {
                error: "Username unavailable",
            };
        }
        if (error instanceof LuciaError && error.message === "AUTH_DUPLICATE_KEY_ID") {
            return {
                error: "Username unavailable",
            };
        }
        // database connection error
        console.log(error);
        return {
            error: "An unknown error occurred",
        };
    }
});
