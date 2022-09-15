Types can be imported from `lucia-sveltekit/types`

```ts
import type { User } from "lucia-sveltekit/types";
```

### Lucia (namespace)

```ts
declare namespace Lucia {
    interface UserData {} // additional data saved to the user
}
```

### User

```ts
type User = {
    user_id: string;
} & Lucia.UserData;
```

### DatabaseUser

```ts
type DatabaseUser = {
    id: string;
    hashed_password: string;
    identifier_token: string;
} & Lucia.UserData;
```

### Adapter

Refer to [custom adapters](/adapters/custom)

### Configurations

Refer to [Lucia configurations](/configurations)

### Session

```ts
type Session = {
    user: User;
    access_token: string;
    refresh_token: string;
} | null;
```

### ServerSession

```ts
interface ServerSession {
    user: User;
    access_token: AccessToken;
    refresh_token: RefreshToken;
    fingerprint_token: FingerprintToken;
    cookies: string[] // list of all cookie-fied tokens
}
```

### Error

Type of error instance thrown by Lucia.
