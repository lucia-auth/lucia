"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const Form = ({
	children,
	action
}: {
	children: React.ReactNode;
	action: string;
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
					setErrorMessage(null);
					const formData = new FormData(e.currentTarget);
					const response = await fetch(action, {
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
