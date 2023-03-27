type PayloadResult = {
	count: number;
};

type Model = {
	schema: Record<string, any>;
	relations: Record<string, Record<any, any>>;
};

export type PrismaClient<Models extends Record<string, Model>> = {
	[K in keyof Models]: {
		findUnique: (options: {
			where: Partial<Models[K]["schema"]>;
			include?: any;
		}) => Promise<any>;
	} & { [K: string]: any };
} & { [K: string]: any };

export type SmartPrismaClient<Models extends Record<string, Model>> = {
	[K in keyof Models]: {
		findUnique: <
			Options extends {
				where: Partial<Models[K]["schema"]>;
				include?: Partial<Record<keyof Models[K]["relations"], boolean>>;
			}
		>(
			options: Options
		) => Options["include"] extends undefined
			? Promise<null | Models[K]["schema"]>
			: Promise<
					| null
					| (Models[K]["schema"] & {
							[L in keyof Options["include"]]: L extends keyof Models[K]["relations"]
								? Models[K]["relations"][L]
								: never;
					  })
			  >;
		findMany: (options: {
			where: Partial<Models[K]["schema"]>;
		}) => Promise<Models[K]["schema"][]>;
		create: (options: {
			data: Models[K]["schema"];
		}) => Promise<Models[K]["schema"]>;
		delete: (options: {
			where: Partial<Models[K]["schema"]>;
		}) => Promise<PayloadResult>;
		deleteMany: (options: {
			where: Partial<Models[K]["schema"]>;
		}) => Promise<PayloadResult>;
		update: (options: {
			data: Partial<Models[K]["schema"]>;
			where: Partial<Models[K]["schema"]>;
		}) => Promise<Models[K]["schema"]>;
	};
} & {
	$transaction: <
		Transaction extends (
			tx: Omit<SmartPrismaClient<Models>, "$transaction">
		) => Promise<any>
	>(
		transaction: Transaction
	) => ReturnType<Transaction>;
};
