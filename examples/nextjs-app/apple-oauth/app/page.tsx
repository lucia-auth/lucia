import { auth } from "@/auth/lucia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import Form from "@/components/form";

const Page = async () => {
	const authRequest = auth.handleRequest({
		request: null,
		cookies
	});
	const session = await authRequest.validate();

	if (!session) redirect("/login");

	return (
		<>
			<h1>Profile</h1>
			<p>User id: {session.user.userId}</p>
			<p>AppleId email: {session.user.email}</p>
			<Form action="/logout" successRedirect="/">
				<input type="submit" value="Sign out" />
			</Form>
		</>
	);
};

export default Page;
