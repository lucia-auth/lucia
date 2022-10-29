# Lucia

**[Join the Discord server!](https://discord.gg/PwrK3kpVR3)**

**Thank you for 300 GitHub stars, and counting!**

Lucia is a simple yet flexible user and session management library that provides an
abstraction layer between your app and your database. It's bare-bones by design, keeping
everything easy to use and understand. Lucia is the authentication solution that works with
you and your app. Get started by reading the [introduction page](https://lucia-auth.vercel.app/learn/start-here/introduction).

At its core, it makes managing users and sessions easy, and it doesn’t attempt to do anything more than that. It’s not an out-of-the-box library like NextAuth, nor an auth platform like Firebase, and that is a super important distinction. You will need to use your own database and strategies like OAuth and magic links have to be made by yourself. However, once you understand the basics of Lucia and authentication, it allows you to fully control and customize your authentication.

Working with Lucia looks something like this. In the code below, you're creating a new user with a email/password method, creating a new session, and creating a cookie that you can set it to the user.

```ts
const user = await auth.createUser("email", email, {
	password
});
const session = await auth.createSession(user.userId);
const sessionCookie = auth.createSessionCookie(session)
```

## Documentation

**[Documentation](https://lucia-auth.vercel.app)**

**[Changelog](https://github.com/pilcrowOnPaper/lucia-auth/blob/main/packages/lucia-auth/CHANGELOG.md)**

## Installation

```bash
npm i lucia-auth
pnpm add lucia-auth
yarn add lucia-auth
```

## Contributing

**[CONTRIBUTING.md](https://github.com/pilcrowOnPaper/lucia-auth/blob/main/CONTRIBUTING.md)**
