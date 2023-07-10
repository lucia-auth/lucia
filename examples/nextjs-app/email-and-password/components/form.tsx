"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const Form = (props: {
	children: React.ReactNode;
	action: string;
	successRedirect?: string;
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
					const formData = new FormData(e.currentTarget);
					const response = await fetch(props.action, {
						method: "POST",
						body: formData,
						redirect: "manual"
					});
					if (response.status === 0 || response.ok) {
						if (props.successRedirect) {
							router.push(props.successRedirect);
						}
						if (props.successMessage) {
							setSuccessMessage(props.successMessage);
						}
					} else {
						const result = (await response.json()) as {
							error?: string;
						};
						setErrorMessage(result.error ?? null);
					}
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
