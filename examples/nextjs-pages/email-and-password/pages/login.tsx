import { useRouter } from "next/router";
import { auth } from "@/auth/lucia";
import { useState } from "react";

import Link from "next/link";

import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";

export const getServerSideProps = async (
	context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<{}>> => {
	const authRequest = auth.handleRequest(context);
	const session = await authRequest.validate();
	if (session) {
		if (!session.user.emailVerified) {
			return {
				redirect: {
					destination: "/email-verification",
					permanent: false
				}
			};
		}
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
	const router = useRouter();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	return (
		<>
			<h1>Sign in</h1>
			<form
				method="post"
				action="/api/login"
				onSubmit={async (e) => {
					e.preventDefault();
					setErrorMessage(null);
					const formData = new FormData(e.currentTarget);
					const response = await fetch("/api/login", {
						method: "POST",
						body: JSON.stringify({
							email: formData.get("email"),
							password: formData.get("password")
						}),
						headers: {
							"Content-Type": "application/json"
						},
						redirect: "manual"
					});

					if (response.status === 0) {
						// redirected
						// when using `redirect: "manual"`, response status 0 is returned
						return router.push("/");
					}
					if (!response.ok) {
						const result = (await response.json()) as {
							error?: string;
						};
						setErrorMessage(result?.error ?? null);
					}
				}}
			>
				<label htmlFor="email">Email</label>
				<input name="email" id="email" />
				<br />
				<label htmlFor="password">Password</label>
				<input type="password" name="password" id="password" />
				<br />
				<input type="submit" />
			</form>
			{errorMessage && <p className="error">{errorMessage}</p>}
			<Link href="/password-reset">Reset password</Link>
			<Link href="/signup">Create an account</Link>
		</>
	);
};

export default Page;
