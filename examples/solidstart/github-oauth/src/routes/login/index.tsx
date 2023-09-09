import { auth } from "~/auth/lucia";
import { createServerData$, redirect } from "solid-start/server";

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
	return (
		<>
			<h1>Sign in</h1>
			<a href="/login/github">Sign in with GitHub</a>
		</>
	);
};

export default Page;
