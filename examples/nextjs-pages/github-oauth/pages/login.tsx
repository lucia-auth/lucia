import { auth } from "@/auth/lucia";

import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";

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

const Page = () => {
	return (
		<>
			<h1>Sign in</h1>
			<a href="/api/login/github">Sign in with GitHub</a>
		</>
	);
};

export default Page;
