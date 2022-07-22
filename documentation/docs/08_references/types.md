Types can be imported from `lucia-sveltekit/types`

```ts
import type { User } from "lucia-sveltekit/types";
```

### User

```ts
interface User {
    user_id: string;
    [key: string]: any;
}
```

### DatabaseUser

```ts
interface DatabaseUser {
    id: string;
    hashed_password: string;
    identifier_token: string;
    [key: string]: any;
}
```

### Adapter

Refer to [custom adapters](/adapters/custom)

### Configurations

Refer to [Lucia configurations](/configurations)

### LuciaSvelteKitSession

```ts
export type LuciaSvelteKitSession = {
    user: User;
    access_token: string;
    refresh_token: string;
} | null;
```

#### Usage

```ts
// app.d.ts
declare namespace App {
    interface Session {
        lucia: import("lucia-sveltekit/types").LuciaSvelteKitSession;
    }
}
```
