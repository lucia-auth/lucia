The standard way of sending and validating requests is to use `validateRequest`. However, that requires the use of client-side js. This guide covers how to use Lucia with progressive enhancements using forms and SvelteKit actions.

## Form

We'll add the access token to the form/request by creating a hidden input in the form. This will send the access token  safely along with the other inputs without the use of js (bearer token inside authorization header).

```html
<script>
    import { getSession } from "lucia-sveltekit/client";
    
    const session = getSession();
</script>

<form method="post">
    <input name="access_token" value="{$session?.access_token}" hidden />
    <input type="submit" />
</form>
```

## Actions

Actions are handled by `actions` in `+page.sever.ts`. `default` will handle all POST submissions to the page.

```ts
export const actions: Actions = {
    default: async (event) => {}
}
```

Now, here's the basic steps:

1. Get the access token from the form data
2. Get the fingerprint token from cookies
3. Validate the access token using the fingerprint token

### 1. Get the access token

```ts
export const actions: Actions = {
    default: async ({request, cookies}) => {
        const formData = await request.formData()
        const accessToken = formData.get("access_token")?.toString() || ""
    }
}
```

### 2. Get the fingerprint token

```ts
export const actions: Actions = {
    default: async ({request, cookies}) => {
        const formData = await request.formData()
        const accessToken = formData.get("access_token")?.toString() || ""
        const fingerprintToken = cookies.get("fingerprint_token") || ""
    }
}
```

### 3. Validate the access token

[`getUserFromAccessToken`](/server-apis/lucia#getuserfromaccesstoken) returns [`User`](/references/types#user) if valid, and throws an error if not.

```ts
import { auth } from "$lib/lucia"

export const actions: Actions = {
    default: async ({request, cookies}) => {
        const formData = await request.formData()
        const accessToken = formData.get("access_token")?.toString() || ""
        const fingerprintToken = cookies.get("fingerprint_token") || ""
        try {
            const user = await auth.getUserFromAccessToken(accessToken, fingerprintToken)
        } catch {
            // throws error AUTH_INVALID_ACCESS_TOKEN if either token is invalid
        }
    }
}
```