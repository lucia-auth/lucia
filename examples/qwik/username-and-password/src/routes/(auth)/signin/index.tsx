import { component$ } from "@builder.io/qwik";
import { Form, Link, routeAction$, z, zod$ } from "@builder.io/qwik-city";
import { LuciaError } from "lucia";

import { auth } from "~/auth/lucia";

export const useSigninAction = routeAction$(
	async (data, event) => {
		const { username, password } = data;
		try {
			const key = await auth.useKey(
				"username",
				username.toLowerCase(),
				password
			);
			const session = await auth.createSession({
				userId: key.userId,
				attributes: {}
			});
			const { name, value, attributes } = auth.createSessionCookie(session);
			event.cookie.set(name, value, attributes);
			event.redirect(302, "/");
		} catch (e) {
			if (
				e instanceof LuciaError &&
				(e.message === "AUTH_INVALID_KEY_ID" ||
					e.message === "AUTH_INVALID_PASSWORD")
			) {
				return {
					success: false,
					error: "Incorrect username or password"
				};
			}
		}
	},
	zod$({
		username: z.string().min(1).max(31),
		password: z.string()
	})
);

export default component$(() => {
	const signinAction = useSigninAction();
	return (
		<>
			<h1>Sign in</h1>
			<Form action={signinAction}>
				<label for="username">Username</label>
				<input name="username" id="username" />
				<br />
				<label for="password">Password</label>
				<input type="password" name="password" id="password" />
				<br />
				<input type="submit" />
			</Form>
			{signinAction.value?.fieldErrors?.username?.length && (
				<>
					<h3>Username Issue(s):</h3>
					{signinAction.value.fieldErrors.username.map((error, index) => (
						<p key={index} class="error">
							{error}
						</p>
					))}
				</>
			)}
			{signinAction.value?.fieldErrors?.password?.length && (
				<>
					<h3>Password Issue(s):</h3>
					{signinAction.value.fieldErrors.password.map((error, index) => (
						<p key={index} class="error">
							{error}
						</p>
					))}
				</>
			)}
			{signinAction.value?.error && (
				<p class="error">Invalid Username or Password</p>
			)}
			<Link href="/signup">Create an account</Link>
		</>
	);
});
