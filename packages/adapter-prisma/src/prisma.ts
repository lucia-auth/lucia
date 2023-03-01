type PayloadResult = {
	count: number;
};

export type PrismaClient<Schemas extends Record<string, {}>> = {
	[K in keyof Schemas]: {
		findUnique: (options: {
			where: Partial<Schemas[K]>;
			include?: any;
		}) => Promise<any>;
	} & { [K: string]: any };
} & { [K: string]: any };

export type SmartPrismaClient<Schemas extends Record<string, {}>> = {
	[K in keyof Schemas]: {
		findUnique: <
			Options extends {
				where: Partial<Schemas[K]>;
				include?: Partial<Record<keyof Schemas, boolean>>;
			}
		>(
			options: Options
		) => Options["include"] extends undefined
			? Promise<null | Schemas[K]>
			: Promise<
					| null
					| (Schemas[K] & {
							[L in keyof Options["include"]]: L extends keyof Schemas
								? Schemas[L]
								: never;
					  })
			  >;
		findMany: (options: {
			where: Partial<Schemas[K]>;
		}) => Promise<Schemas[K][]>;
		create: (options: { data: Schemas[K] }) => Promise<Schemas[K]>;
		delete: (options: { where: Partial<Schemas[K]> }) => Promise<PayloadResult>;
		deleteMany: (options: {
			where: Partial<Schemas[K]>;
		}) => Promise<PayloadResult>;
		update: (options: {
			data: Partial<Schemas[K]>;
			where: Partial<Schemas[K]>;
		}) => Promise<Schemas[K]>;
	};
} & {
	$transaction: <
		Transaction extends (
			tx: Omit<SmartPrismaClient<Schemas>, "$transaction">
		) => Promise<any>
	>(
		transaction: Transaction
	) => ReturnType<Transaction>;
};
