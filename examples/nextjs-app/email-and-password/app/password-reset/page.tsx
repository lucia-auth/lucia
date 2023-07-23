import Form from "@/components/form";
import Link from "next/link";

const Page = async () => {
	return (
		<>
			<h1>Reset password</h1>
			<Form
				action="/api/password-reset"
				successMessage="Your password reset link was sent to your inbox"
			>
				<label htmlFor="email">Email</label>
				<input name="email" id="email" />
				<br />
				<input type="submit" />
			</Form>
			<Link href="/login">Sign in</Link>
		</>
	);
};

export default Page;
