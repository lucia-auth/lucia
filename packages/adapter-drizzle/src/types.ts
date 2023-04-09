import type { AnyTable, AnyColumn } from "drizzle-orm";

type AuthUserTable = AnyTable<{
	columns: {
		id: AnyColumn<{
			notNull: true;
			data: string;
		}>;
	};
}>;

type AuthSessionTable = AnyTable<{
	columns: {
		id: AnyColumn<{
			data: string;
			notNull: true;
		}>;
		userId: AnyColumn<{
			data: string;
			notNull: true;
		}>;
		activeExpires: AnyColumn<{
			data: number;
			notNull: true;
		}>;
		idleExpires: AnyColumn<{
			data: number;
			notNull: true;
		}>;
	};
}>;

type AuthKeyTable = AnyTable<{
	columns: {
		id: AnyColumn<{
			data: string;
			notNull: true;
		}>;
		userId: AnyColumn<{
			data: string;
			notNull: true;
		}>;
		primaryKey: AnyColumn<{
			data: boolean;
			notNull: true;
		}>;
		hashedPassword: AnyColumn<{
			data: string;
		}>;
		expires: AnyColumn<{
			data: bigint;
		}>;
	};
}>;
