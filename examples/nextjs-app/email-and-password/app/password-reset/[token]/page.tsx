import Form from "@/components/form";

const Page = async ({params}: {
    params: {
        token: string
    }
}) => {
	return (
		<>
			<h1>Reset password</h1>
			<Form action={`/api/password-reset/${params.token}`} successRedirect="/">
				<label htmlFor="password">New Password</label>
				<input name="password" id="password" />
				<br />
				<input type="submit" />
			</Form>
		</>
	);
};

export default Page;
