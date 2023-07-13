import { getPageSession } from "@/auth/lucia";
import { redirect } from "next/navigation";

import Form from "@/components/form";

const Page = async () => {
	const session = await getPageSession();
	if (!session) redirect("/login");
	if (session.user.emailVerified) redirect("/");
	return (
		<>
			<h1>Email verification</h1>
			<p>Your email verification link was sent to your inbox (i.e. console).</p>
			<h2>Resend verification link</h2>
			<Form
				action="/api/email-verification"
				successMessage="Your verification link was resent"
			>
				<input type="submit" value="Resend" />
			</Form>
		</>
	);
};

export default Page;
