---
title: "Node"
description: "Learn how to handle requests with Lucia using the Node middleware"
---

Default middleware. Can be used for Next.js as well.

```ts
const handleRequest: (
	request: IncomingMessage,
	response: OutgoingMessage
) => AuthRequest;
```

| name     | type                                                                            |
| -------- | ------------------------------------------------------------------------------- |
| request  | [`IncomingMessage`](https://nodejs.org/api/http.html#class-httpincomingmessage) |
| response | [`OutgoingMessage`](https://nodejs.org/api/http.html#class-httpoutgoingmessage) |

## Example

### Next.js

```ts
import { auth } from "../auth/lucia";

import type {
	GetServerSidePropsContext,
	GetServerSidePropsResult,
} from "next";
import type { User } from "lucia-auth";

export const getServerSideProps = async (
	context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult> => {
	const authRequest = auth.handleRequest(context.req, context.res);
	const session = await authRequest.validate();
	if (!session)
		return {
			redirect: {
				destination: "/login",
				permanent: false
			}
		};
	return {};
};
```
