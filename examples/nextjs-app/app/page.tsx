import { auth } from "@/auth/lucia";
import Form from "@/components/form";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const Page = async () => {
	const authRequest = auth.handleRequest({ cookies });
	const { user } = await authRequest.validateUser();
	if (!user) redirect("/login");
	return (
		<>
			<p>
				This page is protected and can only be accessed by authenticated users.
			</p>
			<pre className="code">{JSON.stringify(user, null, 2)}</pre>

			<Form action="/api/logout">
				<input type="submit" className="button" value="Sign out" />
			</Form>
		</>
	);
};

export default Page;
