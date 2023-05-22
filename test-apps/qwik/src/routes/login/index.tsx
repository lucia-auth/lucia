import { component$ } from "@builder.io/qwik";
import {
	Link,
	routeLoader$,
	Form,
	zod$,
	z,
	routeAction$
} from "@builder.io/qwik-city";
import { auth } from "~/lib/lucia";
import type { LuciaError } from "lucia-auth";

export const useUserLoader = routeLoader$(async (event) => {
	const authRequest = auth.handleRequest(event);
	const session = await authRequest.validate();
	if (session) throw event.redirect(302, "/");

	return {};
});

export const useLoginAction = routeAction$(
	async (values, event) => {
		try {
			const authRequest = auth.handleRequest(event);
			const key = await auth.useKey(
				"username",
				values.username,
				values.password
			);

			const session = await auth.createSession(key.userId);
			authRequest.setSession(session);
		} catch (e) {
			const error = e as LuciaError;
			if (
				error.message === "AUTH_INVALID_KEY_ID" ||
				error.message === "AUTH_INVALID_PASSWORD"
			) {
				return event.fail(200, { error: "Incorrect username or password" });
			}

			// database connection error
			console.log(error);
			return event.fail(200, {
				error: "Unknown error occurred"
			});
		}

		// if all goes well, redirect to home page
		throw event.redirect(302, "/");
	},
	zod$({
		username: z.string().min(3),
		password: z.string().min(3)
	})
);

export default component$(() => {
	const loginAction = useLoginAction();
	return (
		<>
			<h2>Sign in</h2>
			<Form action={loginAction}>
				<label for="username">username</label>
				<br />
				<input id="username" name="username" />
				<br />
				<label for="password">password</label>
				<br />
				<input type="password" id="password" name="password" />
				<br />
				<button class="button" type="submit">
					Continue
				</button>
			</Form>
			{loginAction.value?.failed && (
				<p class="error">{loginAction.value.error ?? ""}</p>
			)}
			<Link href="/signup" class="link">
				Create a new account
			</Link>
		</>
	);
});
