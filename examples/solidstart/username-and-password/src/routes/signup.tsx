import { Show } from "solid-js";
import { auth } from "~/auth/lucia";
import { A } from "solid-start";
import { ServerError } from "solid-start/server";
import { SqliteError } from "better-sqlite3";

import {
	createServerAction$,
	createServerData$,
	redirect
} from "solid-start/server";

export const routeData = () => {
	return createServerData$(async (_, event) => {
		const authRequest = auth.handleRequest(event.request);
		const session = await authRequest.validate();
		if (session) {
			return redirect("/");
		}
	});
};

const Page = () => {
	const [enrolling, { Form }] = createServerAction$(
		async (formData: FormData) => {
			const username = formData.get("username");
			const password = formData.get("password");
			if (
				typeof username !== "string" ||
				username.length < 4 ||
				username.length > 31
			) {
				throw new ServerError("Invalid username");
			}
			if (
				typeof password !== "string" ||
				password.length < 6 ||
				password.length > 255
			) {
				throw new ServerError("Invalid password");
			}
			try {
				const user = await auth.createUser({
					key: {
						providerId: "username", // auth method
						providerUserId: username.toLowerCase(), // unique id when using "username" auth method
						password // hashed by Lucia
					},
					attributes: {
						username
					}
				});
				const session = await auth.createSession({
					userId: user.userId,
					attributes: {}
				});
				const sessionCookie = auth.createSessionCookie(session);
				// set cookie and redirect
				return new Response(null, {
					status: 302,
					headers: {
						Location: "/",
						"Set-Cookie": sessionCookie.serialize()
					}
				});
			} catch (e) {
				// check for unique constraint error in user table
				if (e instanceof SqliteError && e.code === "SQLITE_CONSTRAINT_UNIQUE") {
					throw new ServerError("Username already taken");
				}
				throw new ServerError("An unknown error occurred", {
					status: 500
				});
			}
		}
	);
	return (
		<>
			<h1>Sign up</h1>
			<Form>
				<label for="username">Username</label>
				<input name="username" id="username" />
				<br />
				<label for="password">Password</label>
				<input type="password" name="password" id="password" />
				<br />
				<input type="submit" />
			</Form>
			<Show when={enrolling.error}>
				<p class="error">{enrolling.error.message}</p>;
			</Show>
			<A href="/login">Sign in</A>
		</>
	);
};

export default Page;
