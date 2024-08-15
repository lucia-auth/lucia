# `@lucia-auth/adapter-mongodb`

[Firestore](https://firebase.google.com/docs/firestore) adapter for Lucia.

**[Documentation](https://v3.lucia-auth.com/database/firestore)**

**[Lucia documentation](https://v3.lucia-auth.com)**

**[Changelog](https://github.com/pilcrowOnPaper/lucia/blob/main/packages/adapter-firestore/CHANGELOG.md)**

## Installation

```
npm install @lucia-auth/adapter-firestore
pnpm add @lucia-auth/adapter-firestore
yarn add @lucia-auth/adapter-firestore
```

## Testing

Add Firebase Project ID `FIREBASE_PROJECT_ID` to `.env` file.

Other project configuration properties like _API Key_, _Auth Domain_, _Database URL_ (for Realtime DB), _Storage Bucket_, _Messaging Sender ID_ or _App ID_ are not required for testing nor for the adapter to work.

Run the tests with the following command:
```
pnpm test
```
