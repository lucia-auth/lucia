import { auth } from "@/auth/lucia";
import { LuciaError } from "lucia-auth";
import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
	const { username, password } = (await request.json()) as Partial<{
		username: string;
		password: string;
	}>;
	if (!username || !password) {
		return NextResponse.json(
			{
				error: "Invalid input"
			},
			{
				status: 400
			}
		);
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
		const authRequest = auth.handleRequest({ request, cookies });
		authRequest.setSession(session);
		new Response(null, {
			status: 302,
			headers: {
				location: "/"
			}
		});
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2002" &&
			error.message?.includes("username")
		) {
			return NextResponse.json(
				{
					error: "Username already in use"
				},
				{
					status: 400
				}
			);
		}
		if (
			error instanceof LuciaError &&
			error.message === "AUTH_DUPLICATE_KEY_ID"
		) {
			return NextResponse.json(
				{
					error: "Username already in use"
				},
				{
					status: 400
				}
			);
		}
		// database connection error
		console.log(error);
		return NextResponse.json(
			{
				error: "Unknown error occurred"
			},
			{
				status: 500
			}
		);
	}
};
