---
title: "Pages router with Edge runtime"
_order: 1
---

The response object is not available inside `getServerSideProps()` when deployed to the Edge runtime. Since Lucia won't be able to store renewed session ids, **users will be signed out after 24 hours** with the default configuration. This can somewhat addressed by extending the session expiration with the [`sessionExpiresIn.activePeriod`](/basics/configuration#sessionexpiresin) configuration.

## `getServerSideProps()`

```ts
// pages/index.tsx
import { auth } from "../auth/lucia";

export const getServerSideProps = async (context) => {
	const authRequest = auth.handleRequest(context);
	// ...
};
```

## API routes

You can call `handleRequest()` by passing on a [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) or [`Headers`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).

```ts
// pages/api/index.ts
import { auth } from "../../auth/lucia";

export default (request: Request) => {
	const response = new Response();
	const authRequest = auth.handleRequest({
		request,
		response
	});
	// ...
};
```

```ts
// pages/api/index.ts
import { auth } from "../../auth/lucia";

export default (request: Request) => {
	const headers = new Headers();
	const authRequest = auth.handleRequest({
		request,
		headers
	});
	const response = new Response(null, {
		headers
	});
	// ...
};
```
