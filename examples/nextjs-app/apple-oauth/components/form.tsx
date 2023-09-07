"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const Form = ({
	children,
	action,
	successRedirect
}: {
	children: React.ReactNode;
	action: string;
	successRedirect: string;
}) => {
	const router = useRouter();
	const [errorMessage, setErrorMessage] = useState<null | string>(null);
	return (
		<>
			<form
				action={action}
				method="post"
				onSubmit={async (e) => {
					e.preventDefault();
					const formData = new FormData(e.currentTarget);
					const response = await fetch(action, {
						method: "POST",
						body: formData,
						redirect: "manual"
					});
					if (response.status === 0 || response.ok) {
						router.push(successRedirect);
					} else {
						const result = (await response.json()) as {
							error?: string;
						};
						setErrorMessage(result.error ?? null);
					}
				}}
			>
				{children}
			</form>
			{errorMessage && <p className="error">{errorMessage}</p>}
		</>
	);
};

export default Form;
