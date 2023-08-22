import type { Auth } from "lucia";

/*
'lucia' exports `User` and `GlobalDatabaseUserAttributes`
but these will use the user's .d.ts file

if you try to test that with the monorepo it works fine
but will not work when published and installed
*/

export type LuciaUser<_Auth extends Auth> = ReturnType<
	_Auth["transformDatabaseUser"]
>;

export type LuciaDatabaseUserAttributes<_Auth extends Auth> = Parameters<
	_Auth["createUser"]
>[0]["attributes"];