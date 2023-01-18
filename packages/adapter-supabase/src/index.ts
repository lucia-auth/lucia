import { PostgrestClient } from "@supabase/postgrest-js"; // Supabase's realtime breaks adapter
import { getUpdateData } from "lucia-auth/adapter";
import type {
	Adapter,
	UserSchema,
	SessionSchema,
	AdapterFunction
} from "lucia-auth";

type PostgrestError = {
	details: string | null;
	code: string;
	hint: string | null;
	message: string;
};

type PostgrestSingleResult<T> =
	| {
			data: T;
			error: null;
	  }
	| {
			data: null;
			error: PostgrestError;
	  };

type PostgrestMultipleResult<T> =
	| {
			data: T[];
			error: null;
	  }
	| {
			data: null;
			error: PostgrestError;
	  };

type PostgrestPossibleErrorResult = {
	error: PostgrestError | null;
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
					.maybeSingle()) as PostgrestSingleResult<UserSchema>;
				if (error) throw error;
				return data;
			},
			getUserByProviderId: async (providerId) => {
				const { data, error } = (await supabase
					.from<UserSchema>("user")
					.select()
					.eq("provider_id", providerId)
					.maybeSingle()) as PostgrestSingleResult<UserSchema>;
				if (error) throw error;
				if (!data) return null;
				return data;
			},
			getSessionAndUserBySessionId: async (sessionId) => {
				type Schema = SessionSchema & { user: UserSchema };
				const { data, error } = (await supabase
					.from<Schema>("session")
					.select("user(*), *")
					.eq("id", sessionId)
					.maybeSingle()) as PostgrestSingleResult<Schema>;
				if (error) throw error;
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
					.maybeSingle()) as PostgrestSingleResult<SessionSchema>;
				if (error) throw error;
				return data;
			},
			getSessionsByUserId: async (userId) => {
				const { data, error } = (await supabase
					.from<SessionSchema>("session")
					.select("*, user(*)")
					.eq("user_id", userId)) as PostgrestMultipleResult<SessionSchema>;
				if (error) throw error;
				return (
					data?.map((val) => {
						return val;
					}) || []
				);
			},
			setUser: async (userId, userData) => {
				const { data, error } = (await supabase
					.from<UserSchema>("user")
					.insert(
						{
							id: userId || undefined,
							provider_id: userData.providerId,
							hashed_password: userData.hashedPassword,
							...userData.attributes
						},
						{
							returning: "representation"
						}
					)
					.single()) as PostgrestSingleResult<UserSchema>;
				if (error) {
					if (
						error.details?.includes("(provider_id)") &&
						error.details.includes("already exists.")
					) {
						throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
					}
					throw error;
				}
				return data;
			},
			deleteUser: async (userId) => {
				const { error } = (await supabase
					.from<UserSchema>("user")
					.delete({
						returning: "minimal"
					})
					.eq("id", userId)) as PostgrestSingleResult<UserSchema>;
				if (error) throw error;
			},
			setSession: async (sessionId, data) => {
				const { error } = (await supabase.from<SessionSchema>("session").insert(
					{
						id: sessionId,
						expires: data.expires,
						idle_expires: data.idlePeriodExpires,
						user_id: data.userId
					},
					{
						returning: "minimal"
					}
				)) as PostgrestSingleResult<UserSchema>;
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
				const { error } = (await supabase
					.from<SessionSchema>("session")
					.delete({
						returning: "minimal"
					})
					.in("id", sessionIds)) as PostgrestPossibleErrorResult;
				if (error) throw error;
			},
			deleteSessionsByUserId: async (userId) => {
				const { error } = (await supabase
					.from<SessionSchema>("session")
					.delete({
						returning: "minimal"
					})
					.eq("user_id", userId)) as PostgrestPossibleErrorResult;
				if (error) throw error;
			},
			updateUser: async (userId, newData) => {
				const dbData = getUpdateData(newData);
				const { data, error } = (await supabase
					.from<UserSchema>("user")
					.update(dbData)
					.eq("id", userId)
					.maybeSingle()) as PostgrestSingleResult<UserSchema>;
				if (error) {
					if (
						error.details?.includes("(provider_id)") &&
						error.details.includes("already exists.")
					) {
						throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
					}
					throw error;
				}
				if (!data) throw new LuciaError("AUTH_INVALID_USER_ID");
				return data;
			}
		};
	};
};

export default adapter;
