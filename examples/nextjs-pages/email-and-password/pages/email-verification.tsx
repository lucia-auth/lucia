import { auth } from "@/auth/lucia";
import { useState } from "react";

import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";

export const getServerSideProps = async (
	context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<{}>> => {
	const authRequest = auth.handleRequest(context);
	const session = await authRequest.validate();
	if (!session) {
		return {
			redirect: {
				destination: "/login",
				permanent: false
			}
		};
	}
	if (session.user.emailVerified) {
		return {
			redirect: {
				destination: "/",
				permanent: false
			}
		};
	}
	return {
		props: {}
	};
};

const Page = () => {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	return (
		<>
			<h1>Email verification</h1>
			<p>Your email verification link was sent to your inbox (i.e. console).</p>
			<h2>Resend verification link</h2>
			<form
				method="post"
				action="/api/email-verification"
				onSubmit={async (e) => {
					e.preventDefault();
					setErrorMessage(null);
					setSuccessMessage(null);
					const response = await fetch("/api/email-verification", {
						method: "POST"
					});
					if (!response.ok) {
						const result = (await response.json()) as {
							error?: string;
						};
						setErrorMessage(result?.error ?? null);
						return;
					}
					setSuccessMessage("Your verification link was resent");
				}}
			>
				<input type="submit" value="Resend" />
			</form>
			{successMessage && <p>{successMessage}</p>}
			{errorMessage && <p className="error">{errorMessage}</p>}
		</>
	);
};

export default Page;
