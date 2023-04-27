---
title: "`Cookie`"
_order: 3
---

```ts
type Cookie = {
	name: string;
	value: string;
	attributes: Record<string, any>;
	serialize: () => string;
};
```

## Properties

| name       | type                  | description                                                                              |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------- |
| name       | `string`              |                                                                                          |
| value      | `string`              |                                                                                          |
| attributes | `Record<string, any>` | `cookie` NPM package [`serialize()` options](https://github.com/jshttp/cookie#options-1) |

## `serialize()`

Serializes the cookie using the name, value, and options using [`cookies`](https://www.npmjs.com/package/cookie) npm package.

```ts
const serialize: () => string;
```
