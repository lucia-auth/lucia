---
title: "Interfaces"
---

## `OAuth2ProviderAuth`

See [`OAuth2ProviderAuth`](/reference/oauth/interfaces/oauth2providerauth).

## `OAuth2ProviderAuthWithPKCE`

See [`OAuth2ProviderAuthWithPKCE`](/reference/oauth/interfaces/oauth2providerauthwithpkce).

## `OAuthRequestError`

Extends standard `Error`.

```ts
interface OAuthRequestError extends Error {
	request: Request;
	response: Response;
}
```

## `ProviderUserAuth`

See [`ProviderUserAuth`](/reference/oauth/interfaces/provideruserauth).
