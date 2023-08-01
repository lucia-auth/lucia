import { getPageSession } from "@/auth/lucia";
import { redirect } from "next/navigation";

import Form from "@/components/form";
import Link from "next/link";

const Page = async () => {
	const session = await getPageSession();
	if (session) redirect("/");
	return (
		<>
			<h1>Sign in</h1>
			<Form action="/api/login">
				<label htmlFor="username">Username</label>
				<input name="username" id="username" />
				<br />
				<label htmlFor="password">Password</label>
				<input type="password" name="password" id="password" />
				<br />
				<input type="submit" />
			</Form>
			<Link href="/signup">Create an account</Link>
		</>
	);
};

export default Page;
