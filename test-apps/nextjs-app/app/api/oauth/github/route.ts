import { auth, githubAuth } from "@/auth/lucia";
import { cookies } from "next/headers";

export const GET = async (request: Request) => {
	const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const storedState = cookies().get("oauth_state")?.value ?? null;
	if (!storedState || storedState !== state || !code || !state) {
		return new Response(null, { status: 401 });
	}
	try {
		const { existingUser, providerUser, createUser } =
			await githubAuth.validateCallback(code);

		const getUser = async () => {
			if (existingUser) return existingUser;
			return await createUser({
				username: providerUser.login
			});
		};

		const user = await getUser();
		const session = await auth.createSession(user.userId);
		const authRequest = auth.handleRequest({ request, cookies });
		authRequest.setSession(session);
		return new Response(null, {
			status: 302,
			headers: {
				location: "/"
			}
		});
	} catch (e) {
		return new Response(null, {
			status: 500
		});
	}
};
