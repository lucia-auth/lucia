import { useRouter } from "next/router";
import { auth } from "@/auth/lucia";
import { useState } from "react";

import Link from "next/link";

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
			<a href="/login/github">Sign in with Github</a>
		</>
	);
};

export default Page;
