import { isValidPasswordResetToken } from "@/auth/token";
import { redirect } from "next/navigation";

import Form from "@/components/form";

const Page = async ({
	params
}: {
	params: {
		token: string;
	};
}) => {
	const { token } = params;
	const validToken = await isValidPasswordResetToken(token);
	if (!validToken) redirect("/password-reset");
	return (
		<>
			<h1>Reset password</h1>
			<Form action={`/api/password-reset/${params.token}`}>
				<label htmlFor="password">New Password</label>
				<input name="password" id="password" />
				<br />
				<input type="submit" />
			</Form>
		</>
	);
};

export default Page;
