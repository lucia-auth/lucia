---
_order: 0
title: "Main (/)"
---

These can be imported from `@lucia-auth/nextjs` and should only be used inside a server context.

```ts
import { AuthRequest } from "@lucia-auth/nextjs";
```

## `AuthRequest`

Refer to [`AuthRequest`](/reference/nextjs/authrequest).

## `handleApiRoutes()`

Handles api requests to `/api/auth/**`.

```ts
const handleApiRoutes = (auth: Auth) => (req: NextRequest, res: NextResponse) =>
	Promise<void>;
```

#### Parameter

| name | type                          | description    |
| ---- | ----------------------------- | -------------- |
| auth | [`Auth`](/reference/api/auth) | Lucia instance |

#### Returns

| type       | description          |
| ---------- | -------------------- |
| `Function` | an api route handler |
