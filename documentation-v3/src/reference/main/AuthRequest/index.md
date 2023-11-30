---
type: "class"
---

The core API.

## Constructor

```ts
//$ Lucia=ref:main
//$ SessionCookie=ref:main
//$ RequestContext=ref:main
function constructor<_Lucia extends $$Lucia = Lucia>(
	lucia: _Lucia,
	requestContext: $$RequestContext
): this;
```

### Parameters

- `lucia`
- `sessionCookie`

## Method

- [`deleteSessionCookie()`](ref:main/AuthRequest)
- [`setSessionCookie()`](ref:main/AuthRequest)
- [`validate()`](ref:main/AuthRequest)
- [`validateBearerToken()`](ref:main/AuthRequest)