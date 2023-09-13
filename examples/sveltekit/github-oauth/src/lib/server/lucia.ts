import { lucia } from 'lucia';
import { betterSqlite3 } from '@lucia-auth/adapter-sqlite';
import { sveltekit } from 'lucia/middleware';
import { github } from '@lucia-auth/oauth/providers';
import { dev } from '$app/environment';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '$env/static/private';

import sqlite from 'better-sqlite3';
import fs from 'fs';

const db = sqlite(':memory:');
db.exec(fs.readFileSync('schema.sql', 'utf8'));

export const auth = lucia({
	adapter: betterSqlite3(db, {
		user: 'user',
		session: 'user_session',
		key: 'user_key'
	}),
	middleware: sveltekit(),
	env: dev ? 'DEV' : 'PROD',
	getUserAttributes: (data) => {
		return {
			githubUsername: data.username
		};
	}
});

export const githubAuth = github(auth, {
	clientId: GITHUB_CLIENT_ID,
	clientSecret: GITHUB_CLIENT_SECRET
});

export type Auth = typeof auth;
