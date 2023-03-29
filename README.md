# Lucia

**This library is in the release candidate phase! Expect version 1.0 to be released soon!**

Lucia is a simple and flexible user and session management library that provides an
abstraction layer between your app and your database. It's bare-bones by design, keeping
everything easy to use and understand. Get started by reading the [introduction page](https://lucia-auth.com/learn/start-here/introduction).

### Code sample

Working with Lucia looks something like this. In the code below, you're creating a new user with a email/password method, creating a new session, and creating a cookie that you can set it to the user.

```ts
const user = await auth.createUser({
	primaryKey: {
		providerId: "email",
		providerUserId: email,
		password
	},
	attributes: {
		email,
		username
	}
});
const session = await auth.createSession(user.userId);
const sessionCookie = auth.createSessionCookie(session);
```

## Resources

**[Documentation](https://lucia-auth.com)**

**[Join the Discord server!](https://discord.gg/PwrK3kpVR3)**

**[Changelog](https://github.com/pilcrowOnPaper/lucia/blob/main/packages/lucia-auth/CHANGELOG.md)**

**[CONTRIBUTING.md](https://github.com/pilcrowOnPaper/lucia/blob/main/CONTRIBUTING.md)**

## Installation

```bash
npm i lucia-auth
pnpm add lucia-auth
yarn add lucia-auth
```

## Attributions

This project would not have been possible without our contributors, thank you!

Logo by [@dawidmachon](https://github.com/dawidmachon), licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).
