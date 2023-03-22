import type { Auth } from "lucia-auth";
import type { AwaitedReturnType } from "./utils.js";

export type LuciaUser<A extends Auth> = AwaitedReturnType<A["getUser"]>;

export type CreateUserAttributesParameter<A extends Auth> = Parameters<
	A["createUser"]
>[0]["attributes"];
