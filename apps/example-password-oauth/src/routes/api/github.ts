import { dev } from '$app/env';
import { auth } from '$lib/lucia.js';
import type { RequestHandler } from '@sveltejs/kit';

const clientId = dev ? "DEV_GITHUB_CLIENT_ID" : "PROD_GITHUB_CLIENT_ID";
const clientSecret = dev ? "DEV_GITHUB_CLIENT_SECRET" : "PROD_GITHUB_CLIENT_SECRET";

export const GET: RequestHandler = async ({ url }) => {
	const code = url.searchParams.get('code');
	if (!code) {
		return {
			status: 400,
			body: JSON.stringify({
				message: 'Invalid request url parameters.'
			})
		};
	}
	const getAccessTokenResponse = await fetch(
		`https://github.com/login/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}`,
		{
			method: 'POST',
			headers: {
				Accept: 'application/json'
			}
		}
	);
	if (!getAccessTokenResponse.ok) {
		return {
			status: 500,
			body: JSON.stringify({
				message: 'Failed to fetch data from Github'
			})
		};
	}
	const getAccessToken = await getAccessTokenResponse.json();
	const accessToken = getAccessToken.access_token;
	const getUserEmailsResponse = await fetch('https://api.github.com/user/emails', {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
	if (!getUserEmailsResponse.ok) {
		return {
			status: 500,
			body: JSON.stringify({
				message: 'Failed to fetch data from Github'
			})
		};
	}
	const emails = (await getUserEmailsResponse.json()) as { email: string; primary: boolean }[];
	const email = emails.find((val) => val.primary)?.email || emails[0].email;
	const user = await auth.getUser('github', email);
	if (user) {
		try {
			const authenticateUser = await auth.authenticateUser('github', email);
			return {
				status: 302,
				headers: {
					'set-cookie': authenticateUser.cookies,
					location: '/profile'
				}
			};
		} catch {
			// Cannot connect to database
			return {
				status: 500,
				body: JSON.stringify({
					message: 'An unknown error occured'
				})
			};
		}
	}
	try {
		const createUser = await auth.createUser('github', email, {
			user_data: {
				email
			}
		});
		return {
			status: 302,
			headers: {
				'set-cookie': createUser.cookies,
				location: '/profile'
			}
		};
	} catch (e) {
		const error = e as Error;
		// violates email column unqiue constraint
		if (error.message === 'AUTH_DUPLICATE_USER_DATA') {
			return {
				status: 400,
				body: JSON.stringify({
					message: 'Email already in use'
				})
			};
		}
		// database connection error
		return {
			status: 500,
			body: JSON.stringify({
				message: 'An unknown error occured'
			})
		};
	}
};
