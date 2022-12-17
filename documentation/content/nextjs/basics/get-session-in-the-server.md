---
order: 0
title: "Get session in the server"
---

This can be used in any server context, including `getServerSideProps()` and api routes.

`@lucia-auth/nextjs` provides [`AuthRequest`](/nextjs/api-reference/server-api#authrequest) instance that takes in your Lucia `auth` instance, Next.js request, and Next.js response.

```ts
import { AuthRequest } from "@lucia-auth/nextjs";
import { auth } from "../lib/lucia";

const authRequest = new AuthRequest(auth, request, response);
```

This instance provides methods to interact with the current request, such as [`getSession()`](/nextjs/api-reference/server-api#getsession). This will validate the request and return the current session. This will also attempt to renew the session as well if the original session was invalid.

```ts
const session = await locals.validate();
```

Alternatively, you can use [`getSessionUser()`](/nextjs/api-reference/server-api#getsessionuser) which works similarly to `getSession()` but returns both the user and session without an additional database call.

```ts
const { session, user } = await locals.validateUser();
```

## Example

### `getServerSideProps()`

```ts
import { auth } from "../lib/lucia";
import { AuthRequest } from "@lucia-auth/nextjs";

import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async (context) => {
	const authRequest = new AuthRequest(auth, context.req, context.res);
	const session = await authRequest.validate();
	if (session) {
		// authenticated
	}
};
```

### API routes

```ts
import { AuthRequest } from "@lucia-auth/nextjs";
import { auth } from "../lib/lucia";

import type { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
	const authRequest = new AuthRequest(auth, req, res);
	const session = await authRequest.validate();
	if (session) {
		// authenticated
	}
};
```
