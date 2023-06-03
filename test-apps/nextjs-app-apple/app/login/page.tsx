import { auth } from "@/auth/lucia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import Form from "@/components/form";

const Page = async () => {
	const authRequest = auth.handleRequest({ cookies });
	const { session } = await authRequest.validateUser();
	if (session) redirect("/");
	return (
		<>
			<h2>Sign in</h2>

			<a href="/api/oauth?provider=apple" className="button">
				Continue with Apple
			</a>
		</>
	);
};

export default Page;
