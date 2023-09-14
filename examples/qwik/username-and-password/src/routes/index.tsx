import { component$ } from "@builder.io/qwik";
import {
	type DocumentHead,
	Form,
	routeAction$,
	routeLoader$
} from "@builder.io/qwik-city";

import { auth } from "~/auth/lucia";

export const useSessionUser = routeLoader$(async (event) => {
	const authRequest = auth.handleRequest(event);
	const session = await authRequest.validate();
	if (!session) throw event.redirect(302, "/signin/");
	return session.user;
});

export const useSignOutAction = routeAction$(async (_, event) => {
	const authRequest = auth.handleRequest(event);
	const session = await authRequest.validate();
	if (!session) throw event.error(401, "Unauthorized");

	await auth.invalidateSession(session.sessionId);
	authRequest.setSession(null);
	throw event.redirect(302, "/login/");
});

export default component$(() => {
	const user = useSessionUser();
	const signout = useSignOutAction();
	return (
		<>
			<h1>Profile</h1>
			<p>User id: {user.value.userId}</p>
			<p>Username: {user.value.username}</p>
			<Form action={signout}>
				<button>Sign out</button>
			</Form>
		</>
	);
});

export const head: DocumentHead = {
	title: "GitHub OAuth with Lucia",
	meta: [
		{
			name: "description",
			content: "Qwik site description"
		}
	]
};
