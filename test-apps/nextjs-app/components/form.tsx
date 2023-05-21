"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";

const Form = ({
	children,
	action
}: {
	children: React.ReactNode;
	action: string;
}) => {
	const router = useRouter();
	const [errorMessage, setErrorMessage] = useState("");
	return (
		<>
			<form
				onSubmit={async (e) => {
					e.preventDefault();
					setErrorMessage("");
					const formData = new FormData(e.currentTarget);
					const username = formData.get("username");
					const password = formData.get("password");

					const response = await fetch(action, {
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
					setErrorMessage(result.error);
				}}
			>
				{children}
			</form>
			<p className="error">{errorMessage}</p>
		</>
	);
};

export default Form;
