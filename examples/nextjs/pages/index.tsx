import { useRouter } from "next/router";
import { auth } from "../auth/lucia";

import type {
	GetServerSidePropsContext,
	GetServerSidePropsResult,
	InferGetServerSidePropsType
} from "next";
import type { Session } from "lucia";

export const getServerSideProps = async (
	context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<{ session: Session }>> => {
	const authRequest = auth.handleRequest(context);
	const session = await authRequest.validate();
	if (!session)
		return {
			redirect: {
				destination: "/login",
				permanent: false
			}
		};
	return {
		props: {
			session
		}
	};
};

const Index = (
	props: InferGetServerSidePropsType<typeof getServerSideProps>
) => {
	const router = useRouter();
	return (
		<>
			<p>
				This page is protected and can only be accessed by authenticated users.
			</p>
			<pre className="code">{JSON.stringify(props.session, null, 2)}</pre>

			<button
				onClick={async () => {
					try {
						await fetch("/api/logout", {
							method: "POST"
						});
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
