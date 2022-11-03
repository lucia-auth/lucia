import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AuthRequest } from "@lucia-auth/nextjs";
import { auth } from "../lib/lucia";
import { getUser, signOut } from "@lucia-auth/nextjs/client";

import type {
	GetServerSidePropsContext,
	GetServerSidePropsResult,
	InferGetServerSidePropsType
} from "next";
import type { User } from "lucia-auth";

export const getServerSideProps = async (
	context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<{ user: User; notes: string }>> => {
	const authRequest = new AuthRequest(auth, context.req, context.res);
	const { user } = await authRequest.getSessionUser();
	if (!user)
		return {
			redirect: {
				destination: "/login",
				permanent: false
			}
		};
	const notes = context.req.cookies.notes || "";
	return {
		props: {
			user,
			notes
		}
	};
};

const Index = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	const router = useRouter();
	const [randomNumber, setRandomNumber] = useState<null | number>(null);
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const formValues = e.target as any as Record<
			"notes",
			{
				value: string;
			}
		>;
		await fetch("/api/notes", {
			method: "POST",
			body: JSON.stringify({
				notes: formValues.notes.value
			})
		});
	};
	const updateRandomNumber = async () => {
		const response = await fetch("/api/random-number");
		if (!response.ok) throw new Error();
		const result = (await response.json()) as {
			number: number;
		};
		setRandomNumber(result.number);
	};
	const getUserWithRequest = async () => {
		console.log(await getUser());
	};
	useEffect(() => {
		updateRandomNumber();
		getUserWithRequest();
	}, []);
	return (
		<>
			<h1>Profile</h1>
			<p>This page is protected and can only be accessed by authenticated users.</p>
			<div>
				<p>User id: {props.user?.userId}</p>
				<p>Username: {props.user?.username}</p>
				<p>Random number API: {randomNumber ?? "loading..."}</p>
			</div>

			<div>
				<h2>Notes</h2>
				<form method="post" onSubmit={handleSubmit}>
					<input defaultValue={props.notes} name="notes" />
					<input type="submit" value="Save" className="button" />
				</form>
			</div>

			<button
				onClick={async () => {
					try {
						await signOut();
						router.push("/login");
					} catch (e) {
						console.log(e);
					}
				}}
			>
				Sign out
			</button>
		</>
	);
};

export default Index;
