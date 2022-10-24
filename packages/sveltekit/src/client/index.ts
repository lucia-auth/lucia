import type { User } from "lucia-auth";
import { get, type Readable, derived } from "svelte/store";
import { getContext, setContext } from "svelte";
import type { LuciaContext } from "../types.js";

export const signOut = async (redirect?: string): Promise<void> => {
	const user = get(getUser());
	if (!user) throw new Error("AUTH_NOT_AUTHENTICATED");
	const response = await fetch("/api/auth/logout", {
		method: "POST"
	});
	if (response.ok) {
		if (redirect) {
			globalThis.location.href = redirect;
		}
		return;
	}
	let result;
	try {
		result = await response.json();
	} catch (e) {
		console.error(e);
		throw new Error("UNKNOWN_ERROR");
	}
	if (result.message) throw new Error(result.message);
};

export const getUser = (): Readable<User | null> => {
	const luciaContext = getContext("__lucia__") as LuciaContext | undefined;
	if (!luciaContext) throw new Error("Lucia context undefined");
	return luciaContext.user;
};

export const lucia = (
	pageStore: Readable<{
		data: Record<string, any>;
	}>
) => {
	setContext("__lucia__", {
		user: derived(pageStore, (pageStoreValue) => {
			const pageData = pageStoreValue.data as { _lucia?: User | null };
			const user = pageData?._lucia || null;
			if (typeof window === "undefined") return user;
			const globalWindow = window as Window & {
				_lucia?: LuciaContext;
			};
			globalWindow._lucia = {
				user
			};
			return user;
		})
	});
};
