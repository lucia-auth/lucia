import { getPageSession } from "@/auth/lucia";
import { redirect } from "next/navigation";

const Page = async () => {
	const session = await getPageSession();
	if (session) redirect("/");
	return (
		<>
			<h1>Sign in</h1>
			<a href="/login/github">Sign in with GitHub</a>
		</>
	);
};

export default Page;
