---
title: "`LuciaOAuthRequestError`"
_order: 1
---

Error thrown if a request to a provider failed.

```ts
class LuciaOAuthRequestError extends Error {
    status: number,
    body: Record<string, any> | null
    message: "REQUEST_FAILED"
}
```

## Properties

| name    | type                          | description                                        |
| ------- | ----------------------------- | -------------------------------------------------- |
| status  | `number`                      | response status                                    |
| body    | `Record<string, any> \| null` | JSON parsed response body, `null` if parsing fails |
| message | `string`                      | error message                                      |
