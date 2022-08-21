## Overview

An adapter to use with CouchDB via nano.

### Installation

```bash
npm i @lucia-sveltekit/adapter-couchdb
```

## Usage

```ts
import adapter from '@lucia-sveltekit/adapter-couchdb';
import nano from 'nano';

const couchDbURL = '';
let couch = nano(couchDbURL);

const auth = lucia({
	adapter: adapter(couch)
	// ...
});
```

#### Parameters

| name  | type             | description      |
| ----- | ---------------- | ---------------- |
| couch | nano.ServerScope | CouchDB instance |

## Database

The adapter will automatically create two databases inside the CouchDB instance:

- refresh_token
- user

Please make sure your instance does not already contain these databases, as they may get overridden.

## Contributors

- [@TazorDE](https://github.com/TazorDE)
