import { auth } from "@/auth/lucia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const Page = async () => {
	const authRequest = auth.handleRequest({ cookies });
	const { session } = await authRequest.validateUser();
	if (session) redirect("/");
	return (
		<>
			<h2>Create an account</h2>

			<a href="/api/oauth?provider=apple" className="button">
				Continue with Apple
			</a>
		</>
	);
};

export default Page;
