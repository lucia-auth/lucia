import { lucia } from 'lucia';
import { betterSqlite3 } from '@lucia-auth/adapter-sqlite';
import { sveltekit } from 'lucia/middleware';
import { dev } from '$app/environment';

import sqlite from 'better-sqlite3';
const db = sqlite('main.db');

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
			username: data.username
		};
	}
});

export type Auth = typeof auth;
