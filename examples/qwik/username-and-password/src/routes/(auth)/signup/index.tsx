import { component$ } from "@builder.io/qwik";
import { Form, Link, routeAction$, zod$ } from "@builder.io/qwik-city";
import { SqliteError } from "better-sqlite3";

import { auth } from "~/auth/lucia";

export const useSignUpAction = routeAction$(
	async (data, event) => {
		try {
			const { username, password } = data;
			const user = await auth.createUser({
				key: {
					providerId: "username",
					providerUserId: username.toLowerCase(),
					password
				},
				attributes: {
					username
				}
			});
			const session = await auth.createSession({
				userId: user.userId,
				attributes: {}
			});
			const authRequest = auth.handleRequest(event);
			authRequest.setSession(session);
			throw event.redirect(302, "/");
		} catch (e) {
			if (e instanceof SqliteError && e.code === "SQLITE_CONSTRAINT_UNIQUE") {
				return {
					success: false,
					error: "Unable to create user"
				};
			}
		}
	},
	zod$((z) => {
		return z
			.object({
				username: z.string().min(4).max(31),
				password: z.string().min(6).max(255),
				confirmPassword: z.string().optional()
			})
			.superRefine(({ password, confirmPassword }, ctx) => {
				if (confirmPassword !== password) {
					ctx.addIssue({
						code: "custom",
						message: "The passwords did not match",
						path: ["password"]
					});
				}
			});
	})
);

export default component$(() => {
	const signUpAction = useSignUpAction();
	return (
		<>
			<h1>Sign up</h1>
			<Form action={signUpAction}>
				<label for="username">Username</label>
				<input name="username" id="username" />
				<br />
				<label for="password">Password</label>
				<input type="password" name="password" id="password" />
				<br />
				<label for="confirmPassword">Confirm Password</label>
				<input type="password" name="confirmPassword" id="password" />
				<br />
				<input type="submit" />
			</Form>
			{signUpAction.value?.fieldErrors?.username?.length && (
				<>
					<h3>Username Issue(s):</h3>
					{signUpAction.value.fieldErrors.username.map((error, index) => (
						<p key={index} class="error">
							{error}
						</p>
					))}
				</>
			)}
			{signUpAction.value?.fieldErrors?.password?.length && (
				<>
					<h3>Password Issue(s):</h3>
					{signUpAction.value.fieldErrors.password.map((error, index) => (
						<p key={index} class="error">
							{error}
						</p>
					))}
				</>
			)}
			{signUpAction.value?.error && (
				<p class="error">{signUpAction.value.error}</p>
			)}
			<Link href="/signin">Sign in</Link>
		</>
	);
});
