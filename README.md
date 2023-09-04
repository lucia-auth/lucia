# Lucia

Lucia is a simple and flexible user and session management library that provides an
abstraction layer between your app and your database. It's bare-bones by design, keeping
everything easy to use and understand.

### Code sample

Working with Lucia looks something like this. In the code below, you're creating a new user with an email/password method, creating a new session, and creating a cookie that you can set to the user.

```ts
const user = await auth.createUser({
	key: {
		providerId: "email",
		providerUserId: email,
		password
	},
	attributes: {
		email
	}
});
const session = await auth.createSession({
	userId: user.userId,
	attributes: {}
});
const sessionCookie = auth.createSessionCookie(session);
```

## Resources

**[Documentation](https://lucia-auth.com)**

**[Join the Discord server!](https://discord.gg/PwrK3kpVR3)**

**[Changelog](https://github.com/pilcrowOnPaper/lucia/blob/main/packages/lucia/CHANGELOG.md)**

**[Contributing](https://lucia-auth.com/start-here/contributing)**

## Installation

```
npm i lucia
pnpm add lucia
yarn add lucia
```

## Attributions

This project would not have been possible without our contributors, thank you!

Logo by [@dawidmachon](https://github.com/dawidmachon), licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).
