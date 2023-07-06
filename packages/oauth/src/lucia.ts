import type { Auth } from "lucia";

type AwaitedReturnType<T extends (...args: any[]) => any> = Awaited<
	ReturnType<T>
>;

export type LuciaUser<A extends Auth> = AwaitedReturnType<A["getUser"]>;

export type CreateUserAttributesParameter<A extends Auth> = Parameters<
	A["createUser"]
>[0]["attributes"];
