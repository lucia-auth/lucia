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
					const formData = new FormData(e.currentTarget);
					const response = await fetch("/api/login", {
						method: "POST",
						body: JSON.stringify({
							username: formData.get("username"),
							password: formData.get("password")
						}),
						headers: {
							"Content-Type": "application/json"
						},
						redirect: "manual"
					});

					if (response.status === 0 || response.ok) {
						router.push("/"); // redirect to profile page on success
					} else {
						const result = (await response.json()) as {
							error?: string;
						};
						setErrorMessage(result?.error ?? null);
					}
				}}
			>
				<label htmlFor="username">Username</label>
				<input name="username" id="username" />
				<br />
				<label htmlFor="password">Password</label>
				<input type="password" name="password" id="password" />
				<br />
				<input type="submit" />
			</form>
			{errorMessage && <p className="error">{errorMessage}</p>}
			<Link href="/signup">Create an account</Link>
		</>
	);
};

export default Page;
