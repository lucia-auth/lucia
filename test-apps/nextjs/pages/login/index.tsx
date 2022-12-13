import Link from "next/link";
import { auth } from "../../lib/lucia";
import { AuthRequest } from "@lucia-auth/nextjs";

import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";

export const getServerSideProps = async (
	context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<{}>> => {
	const authRequest = new AuthRequest(auth, context.req, context.res);
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
	return (
		<>
			<h2>Sign in</h2>
			<Link href="/login/username" className="button">
				Username and password
			</Link>
			<Link href="/api/oauth?provider=github" className="button">
				Github
			</Link>
		</>
	);
};

export default Index;
