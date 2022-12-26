import Link from "next/link";
import { auth } from "../lib/lucia";
import { AuthRequest } from "@lucia-auth/nextjs";
import { useRouter } from "next/router";

import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { useState } from "react";

export const getServerSideProps = async (
	context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<{}>> => {
	const authRequest = new AuthRequest(auth, context.req, context.res);
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

const Index = () => {
	const router = useRouter();
	const [message, setMessage] = useState("");
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const formValues = e.target as any as Record<
			"username" | "password",
			{
				value: string;
			}
		>;
		const username = formValues.username.value;
		const password = formValues.password.value;
		const response = await fetch("/api/login", {
			method: "POST",
			body: JSON.stringify({
				username,
				password
			})
		});
		if (response.redirected) return router.push(response.url);
		const result =
			((await response.json()) as {
				error: string;
			}) || {};
		setMessage(result.error);
	};
	return (
		<>
			<h2>Sign in</h2>
			<Link href="/api/oauth?provider=github" className="button">
				Github
			</Link>
			<p className="center">or</p>
			<form method="post" onSubmit={handleSubmit} action="/api/login">
				<label htmlFor="username">username</label>
				<br />
				<input id="username" name="username" />
				<br />
				<label htmlFor="password">password</label>
				<br />
				<input type="password" id="password" name="password" />
				<br />
				<input type="submit" value="Continue" className="button" />
			</form>
			{message && <p className="error">{message || ""}</p>}
			<Link href="/signup" className="link">
				Create a new account
			</Link>
		</>
	);
};

export default Index;
