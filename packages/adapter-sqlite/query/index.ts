const query = () => {
	const ctx = {
		innerJoin: () => {
			return {
				type: "INNER_JOIN"
			};
		},
		selectFrom: (tableName: string, ...columns: string[]) => {
			return {
				type: "SELECT",
				tableName,
				columns
			};
		},
		returning: () => {
			return {
				type: "RETURNING"
			};
		},
		insertInto: (tableName: string, values: Record<string, any>) => {
			return {
				type: "INSERT_INTO",
				values
			};
		},
		where: (column: string, comparator: string, value: string) => {
			return {
				type: "WHERE",
				column,
				comparator,
				value
			};
		},
        deleteFrom: (tableName: string) => {

        },
        update: (tableName: string, values: Record<string, any>) => {
            
        }

	};
	type CreateStatement = (context: typeof ctx) => any;
	const get = <Schema extends Record<string, any>>(
		createStatement: CreateStatement
	) => {};
	const getAll = () => {};
	const run = () => {};
};
