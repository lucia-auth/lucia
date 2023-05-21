import { component$ } from "@builder.io/qwik";
import {
	Form,
	Link,
	routeAction$,
	routeLoader$,
	z,
	zod$
} from "@builder.io/qwik-city";
import { auth } from "~/lib/lucia";
import { Prisma } from "@prisma/client";
import { LuciaError } from "lucia-auth";

export const useUserLoader = routeLoader$(async (event) => {
	const authRequest = auth.handleRequest(event);
	const session = await authRequest.validate();
	if (session) throw event.redirect(302, "/");

	return {};
});

export const useSignupAction = routeAction$(
	async (values, event) => {
		try {
			const user = await auth.createUser({
				primaryKey: {
					providerId: "username",
					providerUserId: values.username,
					password: values.password
				},
				attributes: {
					username: values.username
				}
			});
			const session = await auth.createSession(user.userId);
			const authRequest = auth.handleRequest(event);
			authRequest.setSession(session);
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2002" &&
				error.message?.includes("username")
			) {
				return event.fail(500, {
					error: "Username already in use"
				});
			}
			if (
				error instanceof LuciaError &&
				error.message === "AUTH_DUPLICATE_KEY_ID"
			) {
				return event.fail(500, {
					error: "Username already in use"
				});
			}
			// database connection error
			console.log(error);
			return event.fail(500, {
				error: "Unknown error occurred"
			});
		}

		// if all goes well, redirect to home page
		throw event.redirect(302, "/");
	},
	zod$({
		username: z.string().min(3).max(20),
		password: z.string().min(6).max(20)
	})
);

export default component$(() => {
	const signupAction = useSignupAction();

	return (
		<>
			<Form action={signupAction}>
				<label for="username">username</label>

				<br />
				<input id="username" name="username" />

				<br />
				<label for="password">password</label>
				<br />
				<input type="password" id="password" name="password" />

				<br />
				<input type="submit" value="Continue" class="button" />
			</Form>
			{signupAction.value?.failed && (
				<>
					<p class="error">{signupAction.value?.error}</p>
					<p class="error">{signupAction.value.fieldErrors?.password}</p>
				</>
			)}

			<Link href="/login" class="link">
				Sign in
			</Link>
		</>
	);
});
