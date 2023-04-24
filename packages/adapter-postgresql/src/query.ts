const resolveQueryBlock = (block: Block, paramCount: number): ResolvedBlock => {
	const escapeName = (val: string) => {
		if (val === "*") return val;
		return `"${val}"`;
	};
	if (block.type === "DELETE_FROM") {
		return {
			queryChunk: `DELETE FROM ${escapeName(block.table)}`,
			params: []
		};
	}
	if (block.type === "INNER_JOIN") {
		return {
			queryChunk: `INNER JOIN ${escapeName(block.targetTable)} ON ${
				block.targetColumn
			} = ${block.column}`,
			params: []
		};
	}
	if (block.type === "INSERT_INTO") {
		const keys = Object.keys(block.values);
		return {
			queryChunk: `INSERT INTO ${escapeName(block.table)} (${keys.map((k) =>
				escapeName(k)
			)}) VALUES (${Array(keys.length)
				.fill("")
				.map((_, i) => `$${paramCount + i + 1}`)})`,
			params: keys.map((k) => block.values[k])
		};
	}
	if (block.type === "RETURNING") {
		return {
			queryChunk: `RETURNING ${block.columns}`,
			params: []
		};
	}
	if (block.type === "SELECT") {
		return {
			queryChunk: `SELECT ${block.columns} FROM ${escapeName(block.table)}`,
			params: []
		};
	}
	if (block.type === "WHERE") {
		return {
			queryChunk: `WHERE ${block.column} ${block.comparator} $${
				paramCount + 1
			}`,
			params: [block.value]
		};
	}
	if (block.type === "UPDATE") {
		const keys = Object.keys(block.values);
		return {
			queryChunk: `UPDATE ${escapeName(block.table)} SET ${keys.map((k, i) => {
				return `${escapeName(k)} = $${paramCount + i + 1}`;
			})}`,
			params: keys.map((k) => block.values[k])
		};
	}
	if (block.type === "AND") {
		const resolvedConditionQueryBlocks = block.whereBlocks.map(
			(whereBlock, i) => {
				return {
					queryChunk: `${whereBlock.column} ${whereBlock.comparator} $${
						paramCount + 1 + i
					}`,
					params: [whereBlock.value]
				};
			}
		);
		const conditionQueryChunk = resolvedConditionQueryBlocks
			.map((resolvedBlock) => resolvedBlock.queryChunk)
			.join(" AND ");
		return {
			queryChunk: `WHERE ${conditionQueryChunk}`,
			params: resolvedConditionQueryBlocks.reduce(
				(acc, curr) => [...acc, ...curr.params],
				[] as ColumnValue[]
			)
		};
	}
	throw new TypeError(`Invalid block type`);
};

const ctx = {
	innerJoin: (targetTable: string, targetColumn: string, column: string) => {
		return {
			type: "INNER_JOIN",
			targetTable,
			targetColumn,
			column
		};
	},
	selectFrom: (table: string, ...columns: [string, ...string[]]) => {
		return {
			type: "SELECT",
			table,
			columns
		};
	},
	returning: (...columns: [string, ...string[]]) => {
		return {
			type: "RETURNING",
			columns
		};
	},
	insertInto: (table: string, values: Record<string, ColumnValue>) => {
		return {
			type: "INSERT_INTO",
			table,
			values
		};
	},
	where: (column: string, comparator: string, value: ColumnValue) => {
		return {
			type: "WHERE",
			column,
			comparator,
			value
		};
	},
	deleteFrom: (table: string) => {
		return {
			type: "DELETE_FROM",
			table
		};
	},
	update: (table: string, values: Record<string, ColumnValue>) => {
		return {
			type: "UPDATE",
			table,
			values
		};
	},
	and: (...whereBlocks: WhereBlock[]) => {
		return {
			type: "AND",
			whereBlocks
		};
	}
} satisfies Record<string, (...args: any[]) => Block>;

export const createOperator = <_Runner extends Runner>(runner: _Runner) => {
	const resolveQueryBlocks = (queryBlocks: Block[]) => {
		const queryChunks: string[] = [];
		const params: ColumnValue[] = [];
		for (const queryBlock of queryBlocks) {
			const resolvedBlock = resolveQueryBlock(queryBlock, params.length);
			queryChunks.push(resolvedBlock.queryChunk);
			params.push(...resolvedBlock.params);
		}
		const statement = queryChunks.join(" ");
		return {
			statement,
			params
		};
	};

	const write = <_Selection extends Record<string, ColumnValue>>(
		createQueryBlocks: CreateQueryBlocks
	) => {
		const blocks = createQueryBlocks(ctx);
		return resolveQueryBlocks(blocks);
	};
	const get = <_Selection extends Record<string, ColumnValue>>(
		createQueryBlocks: CreateQueryBlocks
	): _Runner extends AsyncRunner
		? Promise<_Selection | null>
		: _Selection | null => {
		const query = write(createQueryBlocks);
		const result = runner.get(query.statement, query.params);
		if (result instanceof Promise) {
			return new Promise(async (resolve) => {
				const awaitedResult = await result;
				if (Array.isArray(awaitedResult))
					return resolve(awaitedResult.at(0) ?? null);
				resolve(awaitedResult ?? null);
			}) as any;
		}
		if (Array.isArray(result)) return result.at(0) ?? null;
		return result ?? null;
	};
	const getAll = <_Selection extends Record<string, ColumnValue>>(
		createQueryBlocks: CreateQueryBlocks
	): _Runner extends AsyncRunner ? Promise<_Selection[]> : _Selection[] => {
		const query = write(createQueryBlocks);
		const result = runner.get(query.statement, query.params);
		if (result instanceof Promise) {
			return new Promise(async (resolve) => {
				const awaitedResult = await result;
				if (!awaitedResult) return resolve([]);
				if (!Array.isArray(awaitedResult)) return resolve([awaitedResult]);
				return resolve(awaitedResult);
			}) as any;
		}
		if (!result) return [] as any;
		if (!Array.isArray(result)) return [result] as any;
		return result as any;
	};
	const run = <_Selection extends Record<string, ColumnValue>>(
		createQueryBlocks: CreateQueryBlocks
	): _Runner extends AsyncRunner ? Promise<void> : void => {
		const query = write(createQueryBlocks);
		return runner.run(query.statement, query.params) as any;
	};

	const transaction = <const _Execute extends () => any>(
		execute: _Execute
	): _Runner extends AsyncRunner
		? Promise<ReturnType<_Execute>>
		: ReturnType<_Execute> => {
		return runner.transaction(execute) as any;
	};
	return {
		write,
		get,
		getAll,
		run,
		transaction
	} as const;
};

export type ColumnValue = string | number | null | bigint | boolean;

type CreateQueryBlocks = (context: typeof ctx) => Block[];

type ResolvedBlock = {
	queryChunk: string;
	params: ColumnValue[];
};

export type Runner = SyncRunner | AsyncRunner;

export type SyncRunner = {
	type: "sync";
	get: (statement: string, params: ColumnValue[]) => any;
	run: (statement: string, params: ColumnValue[]) => void;
	transaction: (execute: () => any) => any;
};

export type AsyncRunner = {
	type: "async";
	get: (statement: string, params: ColumnValue[]) => Promise<any>;
	run: (statement: string, params: ColumnValue[]) => Promise<void>;
	transaction: (execute: () => Promise<any>) => Promise<any>;
};

type Block =
	| {
			type: "INNER_JOIN";
			targetTable: string;
			targetColumn: string;
			column: string;
	  }
	| {
			type: "SELECT";
			table: string;
			columns: string[];
	  }
	| {
			type: "RETURNING";
			columns: string[];
	  }
	| {
			type: "INSERT_INTO";
			table: string;
			values: Record<string, ColumnValue>;
	  }
	| {
			type: "WHERE";
			column: string;
			comparator: string;
			value: ColumnValue;
	  }
	| {
			type: "AND";
			whereBlocks: WhereBlock[];
	  }
	| {
			type: "DELETE_FROM";
			table: string;
	  }
	| {
			type: "UPDATE";
			table: string;
			values: Record<string, ColumnValue>;
	  }
	| WhereBlock;

type WhereBlock = {
	type: "WHERE";
	column: string;
	comparator: string;
	value: ColumnValue;
};
