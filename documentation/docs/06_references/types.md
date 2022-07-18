### User

```ts
interface LuciaUser {
    user_id: string;
    [key: string]: any;
}
```

### UserDa

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
