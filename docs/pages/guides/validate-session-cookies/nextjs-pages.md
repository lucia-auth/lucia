---
layout: "@components/Layout.astro"
title: "Validate session cookies in Next.js Pages router"
---

# Validate session cookies in Next.js Pages router

You can get the cookie name with `Lucia.sessionCookieName` and validate the session cookie with `Lucia.validateSession()`. Make sure to delete the session cookie if it's invalid and create a new session cookie when the expiration gets extended, which is indicated by `Session.fresh`.

You can also use this inside API routes but **CSRF protection must be implemented**. This can be easily done by comparing the `Origin` and `Host` header. While CSRF protection is strictly not necessary when using JSON requests, it should be implemented in Next.js as it doesn't differentiate between JSON and form submissions.

```ts
import { verifyRequestOrigin } from "oslo/request";

import type { NextApiRequest, NextApiResponse } from "next";

async function validateRequest(req: NextApiRequest, res: NextApiResponse): Promise<User | null> {
	if (req.method !== "GET") {
		const originHeader = request.headers.origin;
		const hostHeader = request.headers.host;
		if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) {
			return null;
		}
	}

	const sessionId = req.cookies.get(lucia.sessionCookieName);
	if (!sessionId) {
		return null;
	}
	const { session, user } = await lucia.validateSession(sessionId);
	if (!session) {
		res.setHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize());
	}
	if (session && session.fresh) {
		res.setHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize());
	}
	return user;
}
```

You can now get the current user inside `getServerSideProps()` by passing the request and response.

```ts
import type { GetServerSidePropsContext } from "next";

export function getServerSideProps(context: GetServerSidePropsContext) {
	const user = await validateRequest(context.req, context.res);
	if (!user) {
		return {
			redirect: {
				destination: "/login",
				permanent: false
			}
		};
	}
	// ...
}
```

```ts
import type { NextApiRequest, NextApiResponse } from "next";

async function handler(req: NextApiRequest, res: NextApiResponse) {
	const user = await validateRequest(req, res);
	if (!user) {
		return res.status(401).end();
	}
}

export default handler;
```
