## 0.2.6

Date: Jul. 19, 2022

- Added [`LuciaSvelteKitSession`](/references/types#luciasveltekitsession) type for adding types to SvelteKit's session
- [Breaking] `verifyRequest()` is changed to `validateRequest()`
- [Breaking] `getUser()` returns `null` if a user that matches the input doesn't exist 
- Improved code readability