import Link from "next/link";
import { auth } from "../auth/lucia";
import { useRouter } from "next/router";

import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { useState } from "react";

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

const Index = () => {
	const router = useRouter();
	const [message, setMessage] = useState("");
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const username = formData.get("username") as string;
		const password = formData.get("password") as string;

		const response = await fetch("/api/login", {
			method: "POST",
			body: JSON.stringify({
				username,
				password
			})
		});
		if (response.redirected) return router.push(response.url);
		const result = (await response.json()) as {
			error: string;
		};
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
			{message && <p className="error">{message ?? ""}</p>}
			<Link href="/signup" className="link">
				Create a new account
			</Link>
		</>
	);
};

export default Index;
