import { useState } from "react";

import Link from "next/link";

const Page = () => {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	return (
		<>
			<h1>Reset password</h1>
			<form
				method="post"
				action="/api/password-reset"
				onSubmit={async (e) => {
					e.preventDefault();
					setErrorMessage(null);
					setSuccessMessage(null);
					const formData = new FormData(e.currentTarget);
					const response = await fetch("/api/password-reset", {
						method: "POST",
						body: JSON.stringify({
							email: formData.get("email")
						}),
						headers: {
							"Content-Type": "application/json"
						}
					});
					if (!response.ok) {
						const result = (await response.json()) as {
							error?: string;
						};
						setErrorMessage(result?.error ?? null);
						return;
					}
					setSuccessMessage("Your password reset link was sent to your inbox");
				}}
			>
				<label htmlFor="email">Email</label>
				<input name="email" id="email" />
				<br />
				<input type="submit" />
			</form>
			{successMessage && <p>{successMessage}</p>}
			{errorMessage && <p className="error">{errorMessage}</p>}
			<Link href="/login">Sign in</Link>
		</>
	);
};

export default Page;
