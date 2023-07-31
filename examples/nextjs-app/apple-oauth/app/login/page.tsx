import { auth } from "@/auth/lucia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const Page = async () => {
	const authRequest = auth.handleRequest({
		request: null,
		cookies
	});
	const session = await authRequest.validate();
	if (session) redirect("/");
	return (
		<>
			<h1>Sign in</h1>
			<a href="/login/apple">Sign in with AppleID</a>
		</>
	);
};

export default Page;
