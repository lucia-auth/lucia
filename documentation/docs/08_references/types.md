Types can be imported from `lucia-sveltekit/types`

```ts
import type { User } from "lucia-sveltekit/types";
```

### User

```ts
type User<UserData extends {}> = {
    user_id: string;
} & UserData;
```

### DatabaseUser

```ts
type DatabaseUser<UserData extends {}> = {
    id: string;
    hashed_password: string;
    identifier_token: string;
} & UserData;
```

### Adapter

Refer to [custom adapters](/adapters/custom)

### Configurations

Refer to [Lucia configurations](/configurations)

### SvelteKitSession

```ts
export type SvelteKitSession<UserData> = {
    user: User<UserData>;
    access_token: string;
    refresh_token: string;
} | null;
```

#### Usage

```ts
// app.d.ts
declare namespace App {
    interface Session {
        lucia: import("lucia-sveltekit/types").SvelteKitSession<{
            username: string;
        }>;
    }
}
```
