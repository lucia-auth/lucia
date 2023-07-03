import { auth } from "@/auth/lucia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import Form from "@/components/form";
import Link from "next/link";

const Page = async () => {
	const authRequest = auth.handleRequest({
		request: null,
		cookies
	});
	const session = await authRequest.validate();
	if (session) redirect("/");
	return (
		<>
			<h1>Sign up</h1>
			<Form action="/api/signup" successRedirect="/">
				<label htmlFor="username">Username</label>
				<input name="username" id="username" /><br />
				<label htmlFor="password">Password</label>
				<input type="password" name="password" id="password" /><br />
				<input type="submit" />
			</Form>
			<Link href="/login">Sign in</Link>
		</>
	);
};

export default Page;
