"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const Form = (props: {
	children: React.ReactNode;
	action: string;
	successMessage?: string;
}) => {
	const router = useRouter();
	const [errorMessage, setErrorMessage] = useState<null | string>(null);
	const [successMessage, setSuccessMessage] = useState<null | string>(null);
	return (
		<>
			<form
				action={props.action}
				method="post"
				onSubmit={async (e) => {
					e.preventDefault();
					setErrorMessage(null);
					setSuccessMessage(null);
					const formData = new FormData(e.currentTarget);
					const response = await fetch(props.action, {
						method: "POST",
						body: formData,
						redirect: "manual"
					});
					if (response.status === 0) {
						// redirected
						// when using `redirect: "manual"`, response status 0 is returned
						return router.refresh();
					}
					if (!response.ok) {
						const result = (await response.json()) as {
							error?: string;
						};
						setErrorMessage(result.error ?? null);
						return;
					}
					setSuccessMessage(props.successMessage);
				}}
			>
				{props.children}
			</form>
			{errorMessage && <p className="error">{errorMessage}</p>}
			{successMessage && <p>{successMessage}</p>}
		</>
	);
};

export default Form;
