import { getPageSession } from "@/auth/lucia";
import { redirect } from "next/navigation";

import Form from "@/components/form";
import Link from "next/link";

const Page = async () => {
	const session = await getPageSession();
	if (session) {
		if (!session.user.emailVerified) redirect("/email-verification");
		redirect("/");
	}
	return (
		<>
			<h1>Sign in</h1>
			<Form action="/api/login">
				<label htmlFor="email">Email</label>
				<input name="email" id="email" />
				<br />
				<label htmlFor="password">Password</label>
				<input type="password" name="password" id="password" />
				<br />
				<input type="submit" />
			</Form>
			<Link href="/password-reset">Reset password</Link>
			<Link href="/signup">Create an account</Link>
		</>
	);
};

export default Page;
