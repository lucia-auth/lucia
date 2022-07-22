## Throwing exceptions

When creating a custom adapter or provider, an error should be thrown using `LuciaError` which is a normal JavaScript `Error`.

```ts
import { LuciaError } from "lucia-sveltekit"

throw new LuciaError("DATABASE_FETCH_FAILED")
```

## Errors

- `AUTH_INVALID_ACCESS_TOKEN`
- `AUTH_INVALID_REFRESH_TOKEN`
- `AUTH_INVALID_PASSWORD`
- `AUTH_INVALID_IDENTIFIER_TOKEN`
- `AUTH_DUPLICATE_USER_DATA`
- `AUTH_DUPLICATE_IDENTIFER_TOKEN`
- `DATABASE_FETCH_FAILED`
- `DATABASE_UPDATE_FAILED`
- `REQUEST_UNAUTHORIZED`
- `UNKNOWN_ERROR`