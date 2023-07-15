import { useRouter } from "next/router";
import { isValidPasswordResetToken } from "@/auth/token";
import { useState } from "react";

import type {
	GetServerSidePropsContext,
	GetServerSidePropsResult,
	InferGetServerSidePropsType
} from "next";

export const getServerSideProps = async (
	context: GetServerSidePropsContext<{
		token: string;
	}>
): Promise<GetServerSidePropsResult<{}>> => {
	const token = context.params?.token as string;
	const validToken = await isValidPasswordResetToken(token);
	if (!validToken) {
		return {
			redirect: {
				destination: "/password-reset",
				permanent: false
			}
		};
	}
	return { props: {} };
};

const Page = () => {
	const router = useRouter();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	return (
		<>
			<h1>Sign in</h1>
			<form
				method="post"
				action={`/api/password-reset/${router.query.token}`}
				onSubmit={async (e) => {
					e.preventDefault();
					setErrorMessage(null);
					const formData = new FormData(e.currentTarget);
					const response = await fetch(
						`/api/password-reset/${router.query.token}`,
						{
							method: "POST",
							body: JSON.stringify({
								password: formData.get("password")
							}),
							headers: {
								"Content-Type": "application/json"
							},
							redirect: "manual"
						}
					);

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
				<label htmlFor="password">New Password</label>
				<input name="password" id="password" />
				<br />
				<input type="submit" />
			</form>
			{errorMessage && <p className="error">{errorMessage}</p>}
		</>
	);
};

export default Page;
