Types can be imported from `lucia-sveltekit/types`

```ts
import type { User } from "lucia-sveltekit/types";
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
    cookies: string[];
}
```

| name              | type                                                        | description                               |
| ----------------- | ----------------------------------------------------------- | ----------------------------------------- |
| user              | [User](/references/types#user)                              |                                           |
| access_token      | [AccessToken](/references/instances#accesstoken)            |                                           |
| refresh_token     | [RefreshToken](/references/instances#refreshtoken)          |                                           |
| fingerprint_token | [Fingerprint_Token](/references/instances#fingerprinttoken) |                                           |
| cookies           | string[]                                                    | An array of all the cookies of the tokens |

### Error

Tyoe of error instance thrown by Lucia.
