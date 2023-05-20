import { auth } from "@auth/lucia.server";
import { Form, useLoaderData } from "@remix-run/react";
import { redirect, json } from "@remix-run/node";

import type { LoaderArgs, ActionArgs } from "@remix-run/node";

export default () => {
	const loaderData = useLoaderData<typeof loader>();
	return (
		<>
			<p>
				This page is protected and can only be accessed by authenticated users.
			</p>
			<pre className="code">{JSON.stringify(loaderData.user, null, 2)}</pre>
			<Form method="post">
				<input type="submit" className="button" value="Sign out" />˝
			</Form>
		</>
	);
};

export const loader = async ({ request }: LoaderArgs) => {
	const headers = new Headers();
	const authRequest = auth.handleRequest(request, headers);
	const { user } = await authRequest.validateUser();
	if (!user) return redirect("/login");
	return json(
		{ user },
		{
			headers
		}
	);
};

export const action = async ({ request }: ActionArgs) => {
	const headers = new Headers();
	const authRequest = auth.handleRequest(request, headers);
	const session = await authRequest.validate();
	if (!session) {
		return json(null, {
			status: 401,
			headers
		});
	}
	await auth.invalidateSession(session.sessionId);
	authRequest.setSession(null);
	return redirect("/login", {
		headers
	});
};
