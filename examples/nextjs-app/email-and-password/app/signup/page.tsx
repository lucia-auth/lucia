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
			<h1>Sign up</h1>
			<Form action="/api/signup">
				<label htmlFor="email">Email</label>
				<input name="email" id="email" />
				<br />
				<label htmlFor="password">Password</label>
				<input type="password" name="password" id="password" />
				<br />
				<input type="submit" />
			</Form>
			<Link href="/login">Sign in</Link>
		</>
	);
};

export default Page;
