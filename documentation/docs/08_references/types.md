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

### ClientSession

```ts
type ClientSession<UserData> = {
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

### Session

```ts
type ServerSession<UserData> = {
    user: User<UserData>;
    access_token: AccessToken;
    refresh_token: RefreshToken;
    fingerprint_token: FingerprintToken;
    cookies: string[];
};
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