import { db } from "@/auth/db";
import { isValidEmail, sendPasswordResetLink } from "@/auth/email";
import { auth } from "@/auth/lucia";
import { generatePasswordResetToken } from "@/auth/token";

import type { NextRequest } from "next/server";

export const POST = async (request: NextRequest) => {
	const formData = await request.formData();
	const email = formData.get("email");
	// basic check
	if (!isValidEmail(email)) {
		return new Response(
			JSON.stringify({
				error: "Invalid email"
			}),
			{
				status: 400
			}
		);
	}
	try {
		const storedUser = await db
			.selectFrom("user")
			.selectAll()
			.where("email", "=", email)
			.executeTakeFirst();
		if (!storedUser) {
			return new Response(
				JSON.stringify({
					error: "User does not exist"
				}),
				{
					status: 400
				}
			);
		}
		const user = auth.transformDatabaseUser(storedUser);
		const token = await generatePasswordResetToken(user.userId);
		await sendPasswordResetLink(token);
		return new Response();
	} catch (e) {
		return new Response(
			JSON.stringify({
				error: "An unknown error occurred"
			}),
			{
				status: 500
			}
		);
	}
};
