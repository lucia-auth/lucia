---
order: 0
layout: "@layouts/DocumentLayout.astro"
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

| name     | type                                                            | description                                       |
| -------- | --------------------------------------------------------------- | ------------------------------------------------- |
| auth     | [`Auth`](/reference/types/lucia-types#auth)                     | Lucia instance                                    |
| request  | [`GetServerSidePropsContext["req"]`]() \| [`NextApiRequest`]()  | request from `getServerSideProps()` or API route  |
| response | [`GetServerSidePropsContext["res"]`]() \| [`NextApiResponse`]() | response from `getServerSideProps()` or API route |

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

### `clearSession()`

Deletes all session cookies of the user sent with the request. This will NOT invalidate the provided session - this can be down with [`invalidateSession()`](/reference/api/server-api#invalidatesession).

```ts
const clearSession: () => void;
```

#### Example

```ts
const authRequest = new AuthRequest();
authRequest.clearSession();
```

## `getSession()`

Validates the request and return the current session. This method will also attempt to renew the session if it was invalid and return the new session if so.

```ts
const getSession: () => Promise<Session | null>;
```

#### Returns

| type                                                        | description               |
| ----------------------------------------------------------- | ------------------------- |
| [`Session`](/reference/types/lucia-types#session)` \| null` | `null` if unauthenticated |

#### Example

```ts
const authRequest = new AuthRequest();
const session = await authRequest.getSession();
if (session) {
	// authenticated
}
```

## `getSessionUser()`

Similar to [`getSession()`](/nextjs/api-reference/locals-api#getsession) but returns both the current session and user without an additional database.

```ts
const authRequest = new AuthRequest();
const { session, user } = await authRequest.getSessionUser();
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
	const session = locals.getSession();
	if (!session) {
		// invalid
	}
};
```

## `setSession()`

Sets the session id cookie of the provided session. When called multiple times this will only set the last provided session.

```ts
const setSession: (session: Session) => void;
```

#### Parameter

| name    | type                                              | description                   |
| ------- | ------------------------------------------------- | ----------------------------- |
| session | [`Session`](/reference/types/lucia-types#session) | The session to set to cookies |

#### Example

```ts
import { auth } from "../lucia";

const authRequest = new AuthRequest();
const session = await auth.createSession();
authRequest.setSession(session);
```
