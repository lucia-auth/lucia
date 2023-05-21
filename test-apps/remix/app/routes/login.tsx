import { auth } from "@auth/lucia.server";
import { LuciaError } from "lucia-auth";
import { Form, useActionData } from "@remix-run/react";
import { redirect, json } from "@remix-run/node";

import type { LoaderArgs, ActionArgs } from "@remix-run/node";

export default () => {
	const actionResult = useActionData<typeof action>();
	return (
		<>
			<h2>Sign in</h2>
			<a href="/api/oauth?provider=github" className="button">
				Continue with Github
			</a>
			<p className="center">or</p>
			<Form method="post">
				<label htmlFor="username">username</label>
				<br />
				<input id="username" name="username" />
				<br />
				<label htmlFor="password">password</label>
				<br />
				<input type="password" id="password" name="password" />
				<br />
				<input type="submit" value="Continue" className="button" />
			</Form>
			<p className="error">{actionResult?.error}</p>
			<a href="/signup" className="link">
				Create a new account
			</a>
		</>
	);
};

export const loader = async ({ request }: LoaderArgs) => {
	const headers = new Headers();
	const authRequest = auth.handleRequest(request, headers);
	const session = await authRequest.validate();
	if (session) return redirect("/");
	return json(null, {
		headers
	});
};

export const action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const username = formData.get("username");
	const password = formData.get("password");
	if (
		!username ||
		!password ||
		typeof username !== "string" ||
		typeof password !== "string"
	) {
		return json(
			{
				error: "Invalid input"
			},
			{
				status: 400
			}
		);
	}
	const headers = new Headers();
	try {
		const key = await auth.useKey("username", username, password);
		const session = await auth.createSession(key.userId);
		const authRequest = auth.handleRequest(request, headers);
		authRequest.setSession(session);
		return redirect("/", {
			headers
		});
	} catch (error) {
		if (
			error instanceof LuciaError &&
			(error.message === "AUTH_INVALID_KEY_ID" ||
				error.message === "AUTH_INVALID_PASSWORD")
		) {
			return json(
				{
					error: "Incorrect username or password"
				},
				{
					status: 400,
					headers
				}
			);
		}
		// database connection error
		console.log(error);
		return json(
			{
				error: "Unknown error occurred"
			},
			{
				status: 500,
				headers
			}
		);
	}
};
