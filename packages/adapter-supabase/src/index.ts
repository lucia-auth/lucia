import { PostgrestClient, PostgrestError } from "@supabase/postgrest-js"; // Supabase's realtime breaks adapter
import { LuciaError } from "@lucia-auth/lucia";
import { getUpdateData } from "@lucia-auth/lucia/adapter";
import type { Adapter, UserSchema, SessionSchema } from "@lucia-auth/lucia";

const adapter = (
	url: string,
	secret: string,
	errorHandler: (error: PostgrestError) => void = () => {}
): Adapter => {
	const supabase = new PostgrestClient(`${url}/rest/v1`, {
		headers: {
			Authorization: `Bearer ${secret}`,
			apikey: secret
		}
	});
	return {
		getUser: async (userId) => {
			const { data, error } = await supabase
				.from<UserSchema>("user")
				.select()
				.eq("id", userId)
				.maybeSingle();
			if (error) {
				errorHandler(error);
				throw error;
			}
			if (!data) return null;
			return data;
		},
		getUserByProviderId: async (providerId) => {
			const { data, error } = await supabase
				.from<UserSchema>("user")
				.select()
				.eq("provider_id", providerId)
				.maybeSingle();
			if (error) {
				errorHandler(error);
				throw error;
			}
			if (!data) return null;
			return data;
		},
		getSessionAndUserBySessionId: async (sessionId) => {
			const { data, error } = await supabase
				.from<SessionSchema & { user: UserSchema }>("session")
				.select("user(*), *")
				.eq("id", sessionId)
				.maybeSingle();
			if (error) {
				errorHandler(error);
				throw error;
			}
			if (!data) return null;
			const { user, ...session } = data;
			return {
				user,
				session
			};
		},
		getSession: async (sessionId) => {
			const { data, error } = await supabase
				.from<SessionSchema>("session")
				.select("*, user(*)")
				.eq("id", sessionId)
				.maybeSingle();
			if (error) {
				errorHandler(error);
				throw error;
			}
			if (!data) return null;
			return data;
		},
		getSessionsByUserId: async (userId) => {
			const { data, error } = await supabase
				.from<SessionSchema>("session")
				.select("*, user(*)")
				.eq("user_id", userId);
			if (error) {
				errorHandler(error);
				throw error;
			}
			return (
				data?.map((val) => {
					return val;
				}) || []
			);
		},
		setUser: async (userId, data) => {
			const { data: dbData, error } = await supabase
				.from<UserSchema>("user")
				.insert(
					{
						id: userId || undefined,
						provider_id: data.providerId,
						hashed_password: data.hashedPassword,
						...data.attributes
					},
					{
						returning: "representation"
					}
				)
				.single();
			if (error) {
				if (error.details.includes("(provider_id)") && error.details.includes("already exists.")) {
					throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
				}
				errorHandler(error);
				throw error;
			}
			return dbData;
		},
		deleteUser: async (userId) => {
			const { error } = await supabase
				.from("user")
				.delete({
					returning: "minimal"
				})
				.eq("id", userId);
			if (error) {
				errorHandler(error);
				throw error;
			}
		},
		setSession: async (sessionId, data) => {
			const { error } = await supabase.from<SessionSchema>("session").insert(
				{
					id: sessionId,
					expires: data.expires,
					idle_expires: data.idlePeriodExpires,
					user_id: data.userId
				},
				{
					returning: "minimal"
				}
			);
			if (error) {
				if (
					error.details.includes("is not present in table") &&
					error.details.includes("user_id")
				) {
					throw new LuciaError("AUTH_INVALID_USER_ID");
				}
				if (error.details.includes("(id)") && error.details.includes("already exists.")) {
					throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
				}
				errorHandler(error);
				throw error;
			}
		},
		deleteSession: async (...sessionIds) => {
			const { error } = await supabase
				.from("session")
				.delete({
					returning: "minimal"
				})
				.in("id", sessionIds);
			if (error) {
				errorHandler(error);
				throw error;
			}
		},
		deleteSessionsByUserId: async (userId) => {
			const { error } = await supabase
				.from("session")
				.delete({
					returning: "minimal"
				})
				.eq("user_id", userId);
			if (error) {
				errorHandler(error);
				throw error;
			}
		},
		updateUser: async (userId, newData) => {
			const dbData = getUpdateData(newData);
			const { data, error } = await supabase
				.from("user")
				.update(dbData)
				.eq("id", userId)
				.maybeSingle();
			if (error) {
				if (error.details.includes("(provider_id)") && error.details.includes("already exists.")) {
					throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
				}
				errorHandler(error);
				throw error;
			}
			if (!data) throw new LuciaError("AUTH_INVALID_USER_ID");
			return data;
		}
	};
};

export default adapter;
