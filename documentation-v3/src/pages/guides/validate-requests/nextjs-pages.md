---
layout: "@layouts/DocLayout.astro"
title: "Validate requests in Next.js Pages router"
---

You can get the cookie name with `Lucia.sessionCookieName` and validate the session cookie with `Lucia.validateSession()`. Make sure to delete the session cookie if it's invalid and create a new session cookie when the expiration gets extended, which is indicated by `Session.fresh`.

```ts
import type { NextApiRequest, NextApiResponse } from "next";

async function validateRequest(req: NextApiRequest, res: NextApiResponse): Promise<User | null> {
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

You can also use this inside API routes but **CSRF protection must be implemented** for non-GET requests, including POST requests. This can be easily done by comparing the `Origin` and `Host` header.

```ts
import type { NextApiRequest, NextApiResponse } from "next";

function validateRequestOrigin(req: NextApiRequest): boolean {
	const originHeader = request.headers.origin;
	const hostHeader = request.headers.host;
	if (!originHeader || !hostHeader) {
		return false;
	}
	return verifyRequestOrigin(originHeader, [hostHeader]);
}
```

```ts
import type { NextApiRequest, NextApiResponse } from "next";

async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") return res.status(405);
	const validRequestOrigin = validateRequestOrigin();
	if (!validRequestOrigin) {
		return res.status(403).end();
	}
	const user = await validateRequest(req, res);
	if (!user) {
		return res.status(401).end();
	}
}

export default handler;
```
