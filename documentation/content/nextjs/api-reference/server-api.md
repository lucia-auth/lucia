---
order: 0
title: "Server API"
---

These can be imported from `@lucia-auth/nextjs` and should only be used inside a server context.

```ts
import { AuthRequest } from "@lucia-auth/nextjs";
```

## `AuthRequest`

The methods for the instance are listed below.

```ts
const constructor: (
	auth: Auth,
	request: GetServerSidePropsContext["req"] | NextApiRequest,
	response: GetServerSidePropsContext["res"] | NextApiResponse
) => AuthRequest;
```

#### Parameter

| name     | type                                                                                                                                                                                                                   | description                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| auth     | [`Auth`](/reference/types/lucia-types#auth)                                                                                                                                                                            | Lucia instance                                    |
| request  | [`GetServerSidePropsContext["req"]`](https://nextjs.org/docs/api-reference/data-fetching/get-server-side-props#context-parameter)`\|`[`NextApiRequest`](https://nextjs.org/docs/basic-features/typescript#api-routes)  | request from `getServerSideProps()` or API route  |
| response | [`GetServerSidePropsContext["res"]`](https://nextjs.org/docs/api-reference/data-fetching/get-server-side-props#context-parameter)`\|`[`NextApiResponse`](https://nextjs.org/docs/basic-features/typescript#api-routes) | response from `getServerSideProps()` or API route |

#### Example

```ts
import { auth } from "../lib/lucia";
import { AuthRequest } from "@lucia-auth/nextjs";

import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async (context) => {
	const authRequest = new AuthRequest(auth, context.req, context.res);
};
```

```ts
import { AuthRequest } from "@lucia-auth/nextjs";
import { auth } from "../lib/lucia";

import type { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
	const authRequest = new AuthRequest(auth, req, res);
};
```

### `validate()`

Validates the request and return the current session. This method will also attempt to renew the session if it was invalid and return the new session if so.

```ts
const validate: () => Promise<Session | null>;
```

#### Returns

| type                                                        | description               |
| ----------------------------------------------------------- | ------------------------- |
| [`Session`](/reference/types/lucia-types#session)` \| null` | `null` if unauthenticated |

#### Example

```ts
const authRequest = new AuthRequest();
const session = await authRequest.validate();
if (session) {
	// authenticated
}
```

### `validateUser()`

Similar to [`validate()`](#validate) but returns both the current session and user without an additional database.

```ts
const authRequest = new AuthRequest();
const { session, user } = await authRequest.validateUser();
if (session) {
	// authenticated
}
```

#### Returns

| name    | type                                                        | description               |
| ------- | ----------------------------------------------------------- | ------------------------- |
| session | [`Session`](/reference/types/lucia-types#session)` \| null` | `null` if unauthenticated |
| user    | [`User`](/reference/types/lucia-types#user)` \| null`       | `null` if unauthenticated |

#### Example

```ts
import type { Action } from "@sveltejs/kit";

const action: Action = async ({ locals }) => {
	const session = locals.validate();
	if (!session) {
		// invalid
	}
};
```

### `setSession()`

Sets the session id cookie of the provided session, or if `null`, removes all session cookies. This will NOT invalidate the current session if the input is `null` - this can be down with [`invalidateSession()`](/reference/api/server-api#invalidatesession).

```ts
const setSession: (session: Session | null) => void;
```

#### Parameter

| name    | type                                                        | description        |
| ------- | ----------------------------------------------------------- | ------------------ |
| session | [`Session`](/reference/types/lucia-types#session)` \| null` | the session to set |

#### Example

```ts
import { auth } from "../lucia";

const authRequest = new AuthRequest();
const session = await auth.createSession();
authRequest.setSession(session); // set session cookie
```

```ts
import { auth } from "../lucia";

const authRequest = new AuthRequest();
await auth.invalidateSession(sessionId); // invalidate session
authRequest.setSession(null); // remove session cookies
```

## `handleApiRoutes()`

Handles api requests to `/api/auth/**`.

```ts
const handleApiRoutes = (auth: Auth) => (req: NextRequest, res: NextResponse) => Promise<void>;
```

#### Parameter

| name | type                                        | description    |
| ---- | ------------------------------------------- | -------------- |
| auth | [`Auth`](/reference/types/lucia-types#auth) | Lucia instance |

#### Returns

| type       | description          |
| ---------- | -------------------- |
| `Function` | an api route handler |
