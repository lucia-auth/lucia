import { auth } from "@/auth/lucia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import Form from "@/components/form";

const Page = async () => {
	const authRequest = auth.handleRequest({ cookies });
	const session = await authRequest.validate();
	if (session) redirect("/");
	return (
		<>
			<h2>Create an account</h2>
			<a href="/api/oauth?provider=github" className="button">
				Continue with Github
			</a>
			<p className="center">or</p>
			<Form action="/api/signup">
				<label htmlFor="username">username</label>
				<br />
				<input id="username" name="username" />
				<br />
				<label htmlFor="password">password</label>
				<br />
				<input type="password" id="password" name="password" />
				<br />
				<input type="submit" value="Continue" className="button" />
			</Form>
			<a href="/login" className="link">
				Sign in
			</a>
		</>
	);
};

export default Page;
