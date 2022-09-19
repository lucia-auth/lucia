## Overview

Imported from `lucia-sveltekit/load`. For SvelteKit's load functions, and can be used both in server and browser context.

```ts
import { getSession } from "lucia-sveltekit/load";
```

## Reference

### getSession

Gets the current session in a load function. Will await for the parent load function if running in an server context and run immediately if running in the browser context. While this will work in a server load function, [`validateRequestByCookie`](/server-apis/lucia#validaterequestbycookie) method of Lucia instance should be used.

```ts
const getSession: (
    event: LoadEvent // sveltekit's load event
) => Promise<Session>;
```

#### Example

```ts
// +page.ts
import { PageLoad } from "./$types";
import { getSession } from "lucia-sveltekit/load";

export const load = async (event) => {
    const session = await getSession(event);
};
```
