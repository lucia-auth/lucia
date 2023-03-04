# Lucia contributing guide

This is a monorepo and requires the use of [pnpm](https://pnpm.io). After forking the repo, run the following command:

```
pnpm ready
```

This will install and build all the required dependencies. It might take a few minutes (but will likely save you from debugging pnpm).

## General conventions

- **TypeScript**
- Variables and functions should use `camelCase`
- Use arrow functions whenever possible
- Use async/await instead of callbacks
- Installed Prettier should be used for formatting
- Use ESM over CommonJS

## Adapters

Adapters provide a set of methods that Lucia can call to read and update data from the database.

Adapters should not return any unnecessary data. For `updateUser()`, Lucia provides `adapterGetUpdateData()`, which will remove everything that is undefined from the input (`null` is a value and should not be ignored)

### Naming

Name the adapter as `adapter-<database_name>` (no `-` or `_` in `<database_name>`, lowercase), and the version should start at 0.1.0. If the client/ORM is not the official package (Prisma, Mongoose), use that for the name instead of the DB name itself (SQL, MongoDB).

### Errors

Known errors (errors related to user id, provider id, session id) should be caught and thrown using `LuciaError`. while database errors should be thrown as is.

### Tests

The testing package are documented at the end of [custom adapters](https://lucia-auth.com/learn/adapters/custom) . They check if they return the appropriate data and throw the appropriate errors. You'll need to provide a `db` object that holds methods that read and modify the db. All tests must be passed.

### Documentation

Documentation for it should go inside `lucia-auth/documentation/docs/<database_name>.md`. Names within file names that should be capitalized should be defined in [`formate.ts`](https://github.com/pilcrowOnPaper/lucia/blob/main/apps/documentation/src/lib/format.ts)

### Changesets

If you're contributing to one of the packages, run `pnpm exec auri add`. This will create a new changeset file in `.auri`. `package` should be the package name (e.g. `lucia-auth`), `type` should be `minor` if it introduces breaking change or `patch` if not, and the content should be a short summary of the update. Make sure to prefix it with `[Breaking]` if it's a breaking change.