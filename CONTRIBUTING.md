# Lucia contributing guide

This is a monorepo and requires the use of [pnpm](https://pnpm.io). After forking the repo, run the following command:

```
pnpm ready
```

This will install and build all the required dependencies. It might take a few minutes (but will likely save you from debugging pnpm).

## General conventions

- **TypeScript**
- Variables and functions should use `camelCase`
- Arrow functions over named functions
- `async`/`await` over callbacks
- `type` over `interface`
- Installed Prettier should be used for formatting
- Use ESM over CommonJS

## Repository

This repository uses [`Auri`](https://github.com/pilcrowOnPaper/auri) to handle package changes and releases.

## Adapters

Adapters provide a set of methods that Lucia can call to read and update data from the database.

### Naming

Name the adapter as `adapter-<database_name>` (no `-` or `_` in `<database_name>`, lowercase), and the version should start at 0.1.0. If the client/ORM is not the official package (Prisma, Mongoose), use that for the name instead of the DB name itself (SQL, MongoDB).

### Errors

[Known errors](https://lucia-auth.com/learn/basics/error-handling#known-errors) should be caught and thrown using `LuciaError`, while database errors should be thrown as is.

### Tests

The testing package are documented at [Testing adapters](https://lucia-auth.com/reference/adapters/testing-adapters). They check if they return appropriate data and throw appropriate errors. You'll need to provide a `db` object that holds methods that read and modify the db. All tests must pass.

## Documentation

The markdown files for documentation are stored in `/documentation/collection`. The documentation site is built with Astro, SolidJS, and Tailwind, though knowledge of these shouldn't be needed for updating the content.

The documentation uses 2 specialized library:

- [Custom content collection](https://github.com/pilcrowOnPaper/lucia/tree/main/documentation/db): For managing and querying markdown content
- [Siena](https://github.com/pilcrowOnPaper/siena): For optimizing images

## Changesets

If a PR introduces a change to one of the packages, run `pnpm exec auri add`. This will create a new changeset file in `.auri`. `package` should be the package name (e.g. `lucia-auth`), `type` should be `minor` if it introduces breaking change or `patch` if not, and the content should be a short summary of the update. Make sure to prefix it with `[Breaking]` if it's a breaking change.

**You do not have to manually update `CHANGELOG.md` or `package.json`.**
