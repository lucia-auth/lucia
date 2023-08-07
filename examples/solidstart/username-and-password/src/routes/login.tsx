import { auth } from "~/auth/lucia";
import {
	ServerError,
	createServerAction$,
	createServerData$,
	redirect
} from "solid-start/server";
import { LuciaError } from "lucia";
import { Show } from "solid-js";
import { A } from "solid-start";

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
			// basic check
			if (
				typeof username !== "string" ||
				username.length < 1 ||
				username.length > 31
			) {
				throw new ServerError("Invalid username");
			}
			if (
				typeof password !== "string" ||
				password.length < 1 ||
				password.length > 255
			) {
				throw new ServerError("Invalid password");
			}
			try {
				// find user by key
				// and validate password
				const key = await auth.useKey(
					"username",
					username.toLowerCase(),
					password
				);
				const session = await auth.createSession({
					userId: key.userId,
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
				if (
					e instanceof LuciaError &&
					(e.message === "AUTH_INVALID_KEY_ID" ||
						e.message === "AUTH_INVALID_PASSWORD")
				) {
					// user does not exist
					// or invalid password
					throw new ServerError("Incorrect username or password");
				}
				throw new ServerError("An unknown error occurred");
			}
		}
	);
	return (
		<>
			<h1>Sign in</h1>
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
			<A href="/signup">Create an account</A>
		</>
	);
};

export default Page;
