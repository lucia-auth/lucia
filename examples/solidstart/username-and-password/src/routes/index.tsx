import { useRouteData } from "solid-start";
import {
	ServerError,
	createServerAction$,
	createServerData$,
	redirect
} from "solid-start/server";
import { auth } from "~/auth/lucia";

export const routeData = () => {
	return createServerData$(async (_, event) => {
		const authRequest = auth.handleRequest(event.request);
		const session = await authRequest.validate();
		if (!session) {
			return redirect("/login") as never;
		}
		return session.user;
	});
};

const Page = () => {
	const user = useRouteData<typeof routeData>();
	const [_, { Form }] = createServerAction$(async (_, event) => {
		const authRequest = auth.handleRequest(event.request);
		const session = await authRequest.validate();
		if (!session) {
			throw new ServerError("Unauthorized", {
				status: 401
			});
		}
		await auth.invalidateSession(session.sessionId); // invalidate session
		const sessionCookie = auth.createSessionCookie(null);
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/login",
				"Set-Cookie": sessionCookie.serialize()
			}
		});
	});
	return (
		<>
			<h1>Profile</h1>
			<p>User id: {user()?.userId}</p>
			<p>Username: {user()?.username}</p>
			<Form>
				<button>Sign out</button>
			</Form>
		</>
	);
};

export default Page;
