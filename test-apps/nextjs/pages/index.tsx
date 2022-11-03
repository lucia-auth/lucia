import Link from "next/link";
import { auth } from "../lib/lucia";
import { AuthRequest } from "@lucia-auth/nextjs";

import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";

export const getServerSideProps = async (
	context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<{}>> => {
	const authRequest = new AuthRequest(auth, context.req, context.res);
	const session = await authRequest.getSession();
	if (session) {
		return {
			redirect: {
				destination: "/profile",
				permanent: false
			}
		};
	}
	return {
		props: {}
	};
};

export default function Home() {
	return (
		<>
			<h1>Lucia+Next.js demo</h1>
			<div>
				<Link href="/login" className="button">
					Sign in
				</Link>
				<Link href="/signup" className="button">
					Create an account
				</Link>
			</div>
		</>
	);
}
