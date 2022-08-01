import { auth } from '$lib/lucia.js';
import type { RequestHandler } from '@sveltejs/kit';

const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
const clientSecret = import.meta.env.VITE_GITHUB_SECRET;

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
	const responses = await Promise.all([
		fetch('https://api.github.com/user/emails', {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		}),
        fetch('https://api.github.com/user', {
            headers: {
				Authorization: `Bearer ${accessToken}`
			}
        })
	]);
	if (!responses[0].ok || !responses[1].ok) {
		return {
			status: 500,
			body: JSON.stringify({
				message: 'Failed to fetch data from Github'
			})
		};
	}
	const emails = (await responses[0].json()) as { email: string; primary: boolean }[];
    const username = (await responses[1].json()).login
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
				email,
                username
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
		// violates email column unique constraint
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
