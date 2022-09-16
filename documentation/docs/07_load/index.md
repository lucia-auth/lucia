## Overview

Imported from `lucia-sveltekit/load`. For SvelteKit's load functions, and can be used both in server and browser context.

```ts
import { handleLoad } from "lucia-sveltekit/load";
```

## Reference

### handleLoad

For normal load functions (both page and layout). Refer to [`handleServerLoad`](/server-apis/lucia#handleserverload) for server load functions. When provided with multiple load functions, `handleLoad` will automatically merge the returned object and return that as load function's result. `redirect()` and `error()` exception can be used as normal.

```ts
const handleLoad: (
    /*
    provided load functions will run in sequence when there are more than 1.
    */
    ...loadHandler: LoadHandler[]
) => Load;
```

#### Types

```ts
/*
a normal load function with added parameters
sveltekit's redirect() and error() can be used inside as well
*/
type LoadHandler = (event: LuciaLoadEvent) => Promise<Record<string, any>>;
```

```ts
type LuciaLoadEvent = LoadEvent & {
    /*
    gets the current user session
    will wait for parent load function in a server context but will run immediately in a browser context
    */
    getSession: () => Promise<Session>;
};
```

#### Example

```ts
import { redirect } from "@sveltejs/kit";

export const load = handleLoad(async ({ getSession, parent }) => {
    const session = await getSession();
    if (!session) throw redirect(302, "/login")
    const { count } = await parent();
    return {
        doubleCount: count * 2
    }
});
```
