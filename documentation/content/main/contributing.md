---
title: "Contributing"
description: "Learn how to contribute to Lucia"
---

Thanks for your interests in taking part in the project! Lucia is maintained by [pilcrowOnPaper](https://github.com/pilcrowOnPaper) and feel free to ask questions on Discord!

## Forking the project

### Prerequisites

This repository requires Node.js version 20 and the latest version of [pnpm](https://pnpm.io).

### Set up

After forking the project, set up your local fork by running the following command in the root:

```
pnpm i
```

## Documentation

Writing the documentation is the most time consuming part of maintaining Lucia, so this is one of the best way to contribute! The documentation website is built with [Astro](https://astro.build).

The following types of PRs are generally accepted quickly:

- Typos
- Fixing small parts of the content
- Adding new content (framework) to an existing Guidebook guide

Please open a feature request for anything related to the website's functionality.

### Examples

This is also another great way to contribute to the library. The example should follow existing ones as close as possible. You can find them at [`lucia-auth/examples`](https://github.com/lucia-auth/examples).

## Source code

For anything bigger than a bug fix, please open a new feature request or a RFC in the discussions tab on GitHub first. We appreciate your enthusiasm but we don't want to close it immediately and waste hours of your time!

Please make the pull request as small as possible, and break them into smaller ones if possible.

### Changesets

Whenever you make a change to the source code, create a changeset by running the following in the project root:

```
pnpm auri add
```

This will create an empty changeset file in `.auri` directory. Fill in the blanks, for example:

```md
---
package: "@lucia-auth/oauth"
type: "minor"
---

Adds X to Y
```

- `package`: The _full_ NPM package name (e.g. `oauth` but `@lucia-auth/oauth`)
- `type`: Change type - can be one of 3 values:
  - `major`: Breaking change
  - `minor`: New backward compatible feature (e.g. new configuration, adapters, oauth providers)
  - `patch`: Bug and type fixes
- Content: A small description of the change - do _not_ add PR and issue numbers

If you've added multiple changes and cannot break it into smaller PRs, create multiple changesets. **Do not manually update `CHANGELOG.md` or `package.json`.**

### OAuth provider

We are generally lenient on what providers we accept. However, please open a new feature request or start a new discussion on Discord or GitHub if you're unsure (e.g. worried if the provider is too niche).

### Database adapters

Please open a new feature request or start a new discussion on Discord or GitHub before creating an official adapter. Adapters must be tested with the testing package and must pass all tests for it to be accepted.

Keep in mind that it may be more appropriate to provide the adapter from an existing adapter package instead of creating a new one.

#### Naming convention

Regular adapter packages should be named `@lucia-auth/adapter-X`, while session adapters should be named `@lucia-auth/adapter-session-X`.

## Style guide

- **Use TypeScript**
- `camelCase`
- Use arrow functions
- Use `const`
- `null` over `undefined`
- `await` over callbacks
- `type` over `interface`
- Explicitly define `public`, `protected`, and `private` for class methods
- Explicitly define return types
- Generics should be prefixed with `_`
- Timestamps should be represented with `Date` or in milliseconds with `number`
- Paths in import statements must have their extensions defined
- Use `import type { X }` instead of `import { type X }`
- No default exports
- No more than 3 parameters in a function

In addition, unit tests should be written for critical components.

### Recommendation

- Prefer using `Array.at()` instead of `Array[]`
- Avoid using optional chaining `a?.b` inside `if` blocks
- Do not over use generics
- Functions that return booleans should be start with `is`, `has`, `includes`, etc
  - This means `boolean` variables should be past tense (e.g. `passwordDefined` instead of `isPasswordDefined`)
- Keep dependencies to a minimum
