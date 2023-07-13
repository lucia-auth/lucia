import { getPageSession } from "@/auth/lucia";
import { redirect } from "next/navigation";

import Form from "@/components/form";

const Page = async () => {
	const session = await getPageSession();
	if (!session) redirect("/login");
	return (
		<>
			<h1>Profile</h1>
			<p>User id: {session.user.userId}</p>
			<p>Github username: {session.user.githubUsername}</p>
			<Form action="/logout">
				<input type="submit" value="Sign out" />
			</Form>
		</>
	);
};

export default Page;
