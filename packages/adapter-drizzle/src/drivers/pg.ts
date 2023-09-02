import { eq } from "drizzle-orm";
import type { Adapter, InitializeAdapter, KeySchema, UserSchema } from "lucia";
import {
  pgTable as defaultPgTableFn,
  PgTableFn,
  PgDatabase,
  varchar,
  bigint,
} from "drizzle-orm/pg-core";

import type { myDrizzleError } from "../adapter";

export function createTables(
  pgTable: PgTableFn,
  modelNames: {
    user: string;
    session: string | null;
    key: string;
  }
) {
  const user = pgTable(modelNames.user, {
    id: varchar("id", {
      length: 15, // change this when using custom user ids
    }).primaryKey(),
    // other user attributes
  });

  const session = pgTable(modelNames.session ?? "user_session", {
    id: varchar("id", {
      length: 128,
    }).primaryKey(),
    userId: varchar("user_id", {
      length: 15,
    })
      .notNull()
      .references(() => user.id),
    activeExpires: bigint("active_expires", {
      mode: "number",
    }).notNull(),
    idleExpires: bigint("idle_expires", {
      mode: "number",
    }).notNull(),
  });

  const key = pgTable(modelNames.key, {
    id: varchar("id", {
      length: 255,
    }).primaryKey(),
    userId: varchar("user_id", {
      length: 15,
    })
      .notNull()
      .references(() => user.id),
    hashedPassword: varchar("hashed_password", {
      length: 255,
    }),
  });

  return { session, user, key };
}

export function pgDrizzleAdapter(
  client: InstanceType<typeof PgDatabase>,
  tableFn = defaultPgTableFn,
  modelNames: {
    user: string;
    session: string | null;
    key: string;
  }
): InitializeAdapter<Adapter> {
  const { user, key, session } = createTables(tableFn, modelNames);

  const $transaction = <_Query extends (...args: any) => any>(
    query: _Query
  ): void => {
    client.transaction(async (trx) => {
      try {
        const result = await query(trx)();
        return result;
      } catch (e) {
        trx.rollback();
        throw e;
      }
    });
  };

  return (luciaError) => {
    return {
      // getSessionAndUser: async (sessionId) => {
      //   const records = await client
      //     .select()
      //     .from(session)
      //     .leftJoin(user, eq(session.userId, user.id))
      //     .where(eq(session.id, sessionId))
      //     // .leftJoin(user, eq(session.userId, user.id))
      //     .then((res) => res ?? [null, null]);

      //   return records;
      // },
      getUser: async (userId: string) => {
        const record =
          (await client
            .select()
            .from(user)
            .where(eq(user.id, userId))
            .then((res) => res[0])) ?? null;

        return record;
      },
      setUser: async (userData: UserSchema, keyData: KeySchema | null) => {
        if (!keyData) {
          await client.insert(user).values({ ...userData, id: userData.id });
          return;
        }
        try {
          $transaction(async () => {
            await client.insert(user).values({ ...userData, id: userData.id });

            const { hashed_password, user_id, ...restKeyData } = keyData;

            await client.insert(key).values({
              ...restKeyData,
              hashedPassword: hashed_password,
              userId: user_id,
            });
          });
        } catch (e) {
          const error = e as Partial<myDrizzleError>;
          if (error.message?.includes("`id`"))
            throw new luciaError("AUTH_DUPLICATE_KEY_ID");
          throw error;
        }
      },
      deleteUser: async (userId) => {
        await client.delete(user).where(eq(user.id, userId));
      },
      updateUser: async (userId, partialUser) => {
        try {
          await client
            .update(user)
            .set({ ...partialUser })
            .where(eq(user.id, userId));
        } catch (e) {
          const error = e as Partial<myDrizzleError>;
          if (error.message?.includes("`id`"))
            throw new luciaError("AUTH_INVALID_USER_ID");
          throw error;
        }
      },
      getSession: async (sessionId) => {
        const record = await client
          .select()
          .from(session)
          .where(eq(session.id, sessionId))
          .then((res) => res[0] ?? null);

        return {
          id: record?.id!,
          active_expires: record?.activeExpires!,
          idle_expires: record?.idleExpires!,
          user_id: record?.userId!,
        };
      },
      getSessionsByUserId: async (userId) => {
        const records = await client
          .select()
          .from(session)
          .where(eq(session.userId, userId))
          .then((res) => res ?? []);

        const resultRecords = records.map((record) => ({
          id: record.id!,
          active_expires: record.activeExpires!,
          idle_expires: record.idleExpires!,
          user_id: record.userId!,
        }));

        return resultRecords;
      },
      setSession: async (sessionData) => {
        try {
          const { active_expires, idle_expires, user_id, ...restSessionData } =
            sessionData;
          await client.insert(session).values({
            ...restSessionData,
            activeExpires: active_expires,
            idleExpires: idle_expires,
            userId: user_id,
          });
        } catch (e) {
          const error = e as Partial<myDrizzleError>;
          if (error.message?.includes("`id`"))
            throw new luciaError("AUTH_INVALID_USER_ID");
          throw error;
        }
      },
      deleteSession: async (sessionId) => {
        await client.delete(session).where(eq(session.id, sessionId));
      },
      deleteSessionsByUserId: async (userId) => {
        await client.delete(session).where(eq(session.userId, userId));
      },
      updateSession: async (sessionId, partialSession) => {
        try {
          await client
            .update(session)
            .set({ ...partialSession })
            .where(eq(session.id, sessionId));
        } catch (e) {
          const error = e as Partial<myDrizzleError>;
          if (error.message?.includes("`id`"))
            throw new luciaError("AUTH_INVALID_SESSION_ID");
          throw error;
        }
      },
      getKey: async (keyId) => {
        const record = await client
          .select()
          .from(key)
          .where(eq(key.id, keyId))
          .then((res) => res[0] ?? null);

        return {
          id: record?.id!,
          hashed_password: record?.hashedPassword!,
          user_id: record?.userId!,
        };
      },
      getKeysByUserId: async (userId) => {
        const records = await client
          .select()
          .from(key)
          .where(eq(key.userId, userId))
          .then((res) => res ?? []);

        const resultRecords = records.map((record) => ({
          id: record.id!,
          hashed_password: record.hashedPassword!,
          user_id: record.userId!,
        }));

        return resultRecords;
      },
      setKey: async (keyData) => {
        try {
          await client
            .insert(key)
            .values({ ...keyData, userId: keyData.user_id });
        } catch (e) {
          const error = e as Partial<myDrizzleError>;
          if (error.message?.includes("`id`"))
            throw new luciaError("AUTH_INVALID_USER_ID");
          throw error;
        }
      },
      deleteKey: async (keyId) => {
        await client.delete(key).where(eq(key.id, keyId));
      },
      deleteKeysByUserId: async (userId) => {
        await client.delete(key).where(eq(key.userId, userId));
      },
      updateKey: async (keyId, partialKey) => {
        try {
          const { hashed_password, user_id, ...restPartialKey } = partialKey;

          if (hashed_password === undefined || user_id === undefined) {
            throw new Error("Missing updateKey data");
          }

          await client
            .update(key)
            .set({
              hashedPassword: hashed_password,
              userId: user_id,
              ...restPartialKey,
            })
            .where(eq(key.id, keyId));
        } catch (e) {
          const error = e as Partial<myDrizzleError>;
          if (error.message?.includes("`id`"))
            throw new luciaError("AUTH_INVALID_KEY_ID");
          throw error;
        }
      },
    };
  };
}
