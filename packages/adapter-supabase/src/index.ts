import { PostgrestClient } from "@supabase/postgrest-js"; // Supabase's realtime breaks adapter
import type {
	Adapter,
	UserSchema,
	SessionSchema,
	AdapterFunction,
	KeySchema
} from "lucia-auth";

type PostgrestError = {
	details: string | null;
	code: string;
	hint: string | null;
	message: string;
};

type PostgrestSingleReadResult<T> =
	| {
			data: T | null;
			error: null;
	  }
	| {
			data: null;
			error: PostgrestError;
	  };

type PostgrestCountResult = {
	count: number;
	error: PostgrestError;
};

const adapter = (url: string, secret: string): AdapterFunction<Adapter> => {
	const supabase = new PostgrestClient(`${url}/rest/v1`, {
		headers: {
			Authorization: `Bearer ${secret}`,
			apikey: secret
		}
	});
	return (LuciaError) => {
		return {
			getUser: async (userId) => {
				const { data, error } = (await supabase
					.from<UserSchema>("user")
					.select()
					.eq("id", userId)
					.maybeSingle()) as PostgrestSingleReadResult<UserSchema>;
				if (error) throw error;
				return data;
			},
			getUserByKey: async (key) => {
				type Schema = KeySchema & {
					user: UserSchema;
				};
				const { data, error } = (await supabase
					.from<Schema>("user")
					.select("user(*), *")
					.eq("id", key)
					.maybeSingle()) as PostgrestSingleReadResult<Schema>;
				if (error) throw error;
				if (!data) return null;
				return data.user;
			},
			getSessionAndUserBySessionId: async (sessionId) => {
				type Schema = SessionSchema & { user: UserSchema };
				const { data, error } = await supabase
					.from<Schema>("session")
					.select("user(*), *")
					.eq("id", sessionId)
					.maybeSingle();
				if (error) throw error;
				if (!data) return null;
				const { user, ...session } = data;
				return {
					user,
					session
				};
			},
			getSession: async (sessionId) => {
				const { data, error } = (await supabase
					.from<SessionSchema>("session")
					.select("*, user(*)")
					.eq("id", sessionId)
					.maybeSingle()) as PostgrestSingleReadResult<SessionSchema>;
				if (error) throw error;
				return data;
			},
			getSessionsByUserId: async (userId) => {
				const { data, error } = await supabase
					.from<SessionSchema>("session")
					.select("*, user(*)")
					.eq("user_id", userId);
				if (error) throw error;
				return (
					data?.map((val) => {
						return val;
					}) || []
				);
			},
			setUser: async (userId, attributes) => {
				const { data, error } = await supabase
					.from<UserSchema>("user")
					.insert(
						{
							id: userId ?? undefined,
							...attributes
						},
						{
							returning: "representation"
						}
					)
					.single();
				if (error) throw error;
				return data;
			},
			deleteUser: async (userId) => {
				const { error } = await supabase
					.from<UserSchema>("user")
					.delete({
						returning: "minimal"
					})
					.eq("id", userId);
				if (error) throw error;
			},
			setSession: async (sessionId, data) => {
				const { error } = await supabase.from<SessionSchema>("session").insert(
					{
						id: sessionId,
						active_expires: data.activePeriodExpires,
						idle_expires: data.idlePeriodExpires,
						user_id: data.userId
					},
					{
						returning: "minimal"
					}
				);
				if (error) {
					if (
						error.details?.includes("is not present in table") &&
						error.details.includes("user_id")
					) {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					}
					if (
						error.details?.includes("(id)") &&
						error.details.includes("already exists.")
					) {
						throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
					}
					throw error;
				}
			},
			deleteSession: async (...sessionIds) => {
				const { error } = await supabase
					.from<SessionSchema>("session")
					.delete({
						returning: "minimal"
					})
					.in("id", sessionIds);
				if (error) throw error;
			},
			deleteSessionsByUserId: async (userId) => {
				const { error } = await supabase
					.from<SessionSchema>("session")
					.delete({
						returning: "minimal"
					})
					.eq("user_id", userId);
				if (error) throw error;
			},
			updateUserAttributes: async (userId, userAttributes) => {
				const { data, error } = (await supabase
					.from<UserSchema>("user")
					.update(userAttributes)
					.eq("id", userId)
					.maybeSingle()) as PostgrestSingleReadResult<UserSchema>;
				if (!data) throw new LuciaError("AUTH_INVALID_USER_ID");
				if (error) throw error;
				return data;
			},
			setKey: async (key, data) => {
				const { error } = await supabase.from<KeySchema>("key").insert(
					{
						id: key,
						user_id: data.userId,
						primary: data.isPrimary,
						hashed_password: data.hashedPassword
					},
					{
						returning: "minimal"
					}
				);
				if (error) {
					if (
						error.details?.includes("is not present in table") &&
						error.details.includes("user_id")
					) {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					}
					if (
						error.details?.includes("(id)") &&
						error.details.includes("already exists.")
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY");
					}
				}
			},
			getKey: async (key) => {
				const { data, error } = (await supabase
					.from<KeySchema>("key")
					.select()
					.eq("id", key)
					.single()) as PostgrestSingleReadResult<KeySchema>;
				if (error) throw error;
				return data;
			},
			getKeysByUserId: async (userId) => {
				const { data, error } = await supabase
					.from<KeySchema>("key")
					.select()
					.eq("user_id", userId);
				if (error) throw error;
				return data;
			},
			updateKeyPassword: async (key, hashedPassword) => {
				const { error, count } = (await supabase
					.from<KeySchema>("key")
					.update(
						{
							hashed_password: hashedPassword
						},
						{
							returning: "minimal",
							count: "exact"
						}
					)
					.eq("id", key)
					.single()) as unknown as PostgrestCountResult;
				if (count < 1) throw new LuciaError("AUTH_INVALID_KEY");
				if (error) throw error;
			},
			deleteKeysByUserId: async (userId) => {
				const { error } = await supabase
					.from<KeySchema>("key")
					.delete({
						returning: "minimal"
					})
					.eq("user_id", userId);
				if (error) throw error;
			},
			deleteNonPrimaryKey: async (...keys) => {
				const { error } = await supabase
					.from<KeySchema>("key")
					.delete({
						returning: "minimal"
					})
					.in("id", keys)
					.eq("primary", false);
				if (error) throw error;
			}
		};
	};
};

export default adapter;
