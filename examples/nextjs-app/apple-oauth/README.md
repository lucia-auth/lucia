# Apple OAuth example with Lucia and Next.js App Router

This example uses `better-sqlite3`. Make sure to setup your `.env` file.

```bash
# install dependencies
pnpm i

# run dev server
pnpm dev
```

## Runtime

This example is built for Node.js 20. If you're using Node.js 16/18, un-comment the following lines in `auth/lucia.ts`:

```ts
// import "lucia/polyfill/node";
```

### Setup Apple ID OAuth

**Before starting make sure you have an paid apple dev account**

Setup the Apple App and copy-paste credentials into `.env`.

Refer to Apple Docs:

- [Creating App ID](https://developer.apple.com/help/account/manage-identifiers/register-an-app-id/)
- [Creating Service ID](https://developer.apple.com/help/account/manage-identifiers/register-a-services-id)
- [Enable "Sign In with Apple" Capability](https://developer.apple.com/help/account/manage-identifiers/enable-app-capabilities)
- [Creating Private Key](https://developer.apple.com/help/account/manage-keys/create-a-private-key)
- [Locate the keyId](https://developer.apple.com/help/account/manage-keys/get-a-key-identifier)
- [How to locate your teamId](https://developer.apple.com/help/account/manage-your-team/locate-your-team-id)
- [Requesting Access Token](https://developer.apple.com/documentation/sign_in_with_apple/request_an_authorization_to_the_sign_in_with_apple_server)
- [How to validate tokens](https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens)

```bash
APPLE_TEAM_ID=""
APPLE_KEY_ID=""
APPLE_CERT_PATH=""
APPLE_REDIRECT_URI=""
APPLE_CLIENT_ID=""
```

## User schema

| id      | type     | unique |
| ------- | -------- | :----: |
| `id`    | `string` |        |
| `email` | `string` |        |
